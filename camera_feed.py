import pyrealsense2 as rs
import numpy as np
import cv2

# --- Configuration ---
FPS = 30
WIDTH = 640
HEIGHT = 480
# RTSP URL matches the path in mediamtx.yml
RTSP_URL = "rtsp://localhost:8554/realsense"

def main():
    # 1. Configure RealSense Pipeline
    pipeline = rs.pipeline()
    config = rs.config()
    
    # Enable both depth and color streams
    config.enable_stream(rs.stream.depth, WIDTH, HEIGHT, rs.format.z16, FPS)
    config.enable_stream(rs.stream.color, WIDTH, HEIGHT, rs.format.bgr8, FPS)

    print("Starting RealSense camera...")
    profile = pipeline.start(config)

    # Create an align object. 
    # rs.align allows us to perfectly map depth pixels to color pixels.
    align_to = rs.stream.color
    align = rs.align(align_to)

    # 2. Configure GStreamer VideoWriter for MediaMTX
    # We use Jetson's hardware encoder (nvv4l2h264enc) to avoid CPU bottlenecking.
    # Added 'videoconvert ! video/x-raw, format=BGRx' to bridge OpenCV to Nvidia's hardware
    gst_out = (
        f"appsrc ! video/x-raw, format=BGR ! "
        f"videoconvert ! video/x-raw, format=BGRx ! "
        f"nvvidconv ! video/x-raw(memory:NVMM), format=I420 ! "
        f"nvv4l2h264enc control-rate=1 bitrate=1000000 preset-level=1 insert-sps-pps=true iframeinterval={FPS} ! "
        f"h264parse ! rtspclientsink location={RTSP_URL} protocols=tcp"
    )
    
    # Initialize the OpenCV VideoWriter
    out = cv2.VideoWriter(gst_out, cv2.CAP_GSTREAMER, 0, float(FPS), (WIDTH, HEIGHT), True)

    if not out.isOpened():
        print("Error: Could not open VideoWriter. Check GStreamer pipeline syntax.")
        pipeline.stop()
        return

    print(f"Streaming live to {RTSP_URL}")

    try:
        while True:
            # Wait for a coherent pair of frames
            frames = pipeline.wait_for_frames()
            
            # Align the depth frame to the color frame
            aligned_frames = align.process(frames)
            
            # Extract the aligned frames
            depth_frame = aligned_frames.get_depth_frame()
            color_frame = aligned_frames.get_color_frame()

            # Validate that both frames are available
            if not depth_frame or not color_frame:
                continue

            # Convert color frame to numpy array for OpenCV/YOLO
            color_image = np.asanyarray(color_frame.get_data())

            # =========================================================
            # AI INFERENCE & ANNOTATION BLOCK
            # =========================================================
            # Run your YOLO model on `color_image` here.
            # Example (Pseudo-code):
            # results = yolo_model(color_image)
            # for box in results.boxes:
            #     x1, y1, x2, y2 = box.xyxy[0]
            #     cv2.rectangle(color_image, (x1, y1), (x2, y2), (0, 255, 0), 2)
            #     cv2.putText(color_image, "Weed", (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
            
            # Dummy annotation for testing the pipeline:
            cv2.putText(color_image, "AI Pipeline Active", (20, 30), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
            cv2.circle(color_image, (WIDTH // 2, HEIGHT // 2), 5, (0, 0, 255), -1)
            # =========================================================

            # 3. Push the annotated RGB frame to MediaMTX
            out.write(color_image)

    except KeyboardInterrupt:
        print("\nProcess interrupted by user.")
    except Exception as e:
        print(f"\nAn error occurred: {e}")
    finally:
        # Graceful cleanup
        print("Stopping camera and closing stream...")
        pipeline.stop()
        out.release()

if __name__ == "__main__":
    main()