import pyrealsense2 as rs
import numpy as np
import cv2
import serial
import subprocess
from ultralytics import YOLO

# --- Configuration ---
FPS = 30
WIDTH = 640
HEIGHT = 480
# RTSP URL matches the path in mediamtx.yml
RTSP_URL = "rtsp://localhost:8554/realsense"

def main():

    # 2. Load the optimized TensorRT YOLO Engine
    print("Loading TensorRT Engine...")
    folder_name = "boxes_ai"
    yolo_type = 'v5s'
    model = YOLO(f"ai_models/{folder_name}/{yolo_type}/boxes_ai.engine", task='detect')

    # 3. Configure RealSense Pipeline
    pipeline = rs.pipeline()
    config = rs.config()
    config.enable_stream(rs.stream.depth, WIDTH, HEIGHT, rs.format.z16, FPS)
    config.enable_stream(rs.stream.color, WIDTH, HEIGHT, rs.format.bgr8, FPS)

    print("Starting RealSense camera...")
    profile = pipeline.start(config)
    align = rs.align(rs.stream.color)

    # 4. Configure FFmpeg Subprocess (Bypasses OpenCV VideoWriter)
    print("Initializing FFmpeg pipeline...")
    ffmpeg_cmd = [
        'ffmpeg',
        '-y',                           # Overwrite output
        '-f', 'rawvideo',               # Input format
        '-vcodec', 'rawvideo',
        '-pix_fmt', 'bgr24',            # OpenCV uses BGR
        '-s', f"{WIDTH}x{HEIGHT}",      # Frame size
        '-r', str(FPS),                 # Framerate
        '-i', '-',                      # Read from stdin
        '-c:v', 'libx264',              # Encode to h264
        '-preset', 'ultrafast',         # Maximize speed
        '-tune', 'zerolatency',         # Minimize stream delay
        '-f', 'rtsp',                   # Output format
        RTSP_URL
    ]

    # Start the process. We will write our image bytes directly into its 'stdin'
    try:
        process = subprocess.Popen(ffmpeg_cmd, stdin=subprocess.PIPE, stderr=subprocess.DEVNULL)
    except FileNotFoundError:
        print("Error: FFmpeg is not installed. Run 'apt-get update && apt-get install -y ffmpeg' in your container.")
        pipeline.stop()
        return

    print(f"Streaming live to {RTSP_URL}")

    try:
        while True:
            # Wait for a coherent pair of frames
            frames = pipeline.wait_for_frames()
            aligned_frames = align.process(frames)
            
            depth_frame = aligned_frames.get_depth_frame()
            color_frame = aligned_frames.get_color_frame()

            if not depth_frame or not color_frame:
                continue

            # Convert color frame to numpy array
            color_image = np.asanyarray(color_frame.get_data())

            # =========================================================
            # AI INFERENCE & KINEMATICS EXTRACTION
            # =========================================================
            results = model.predict(source=color_image, conf=0.5, verbose=False)

            for result in results:
                for box in result.boxes:
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    conf = float(box.conf)
                    
                    # Calculate the 2D Center for Laser Targeting
                    cx = (x1 + x2) // 2
                    cy = (y1 + y2) // 2

                    # Get the real-world distance (Z-axis) in meters
                    z_dist = depth_frame.get_distance(cx, cy)

                    if 0.01 < z_dist < 3.0:

                        # Draw Visuals for the RTSP Stream
                        cv2.rectangle(color_image, (x1, y1), (x2, y2), (0, 255, 0), 2)
                        cv2.circle(color_image, (cx, cy), 4, (0, 0, 255), -1)
                        label = f"Weed {conf:.2f} | Z: {z_dist:.2f}m"
                        cv2.putText(color_image, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

            # =========================================================

            # Push the annotated RGB frame directly into FFmpeg
            process.stdin.write(color_image.tobytes())

    except KeyboardInterrupt:
        print("\nProcess interrupted by user.")
    except Exception as e:
        print(f"\nAn error occurred: {e}")
    finally:
        pipeline.stop()
        
        # Close the FFmpeg pipe safely
        if process:
            process.stdin.close()
            process.wait()
            
        print("Camera and stream closed cleanly.")

if __name__ == "__main__":
    main()