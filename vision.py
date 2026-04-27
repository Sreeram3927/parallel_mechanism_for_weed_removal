import pyrealsense2 as rs
import numpy as np
import cv2
import subprocess
from ultralytics import YOLO
from config import Config

class VisionSystem:
    def __init__(self, target_detected_callback=None):
        self.target_detected_callback = target_detected_callback
        self.pipeline = rs.pipeline()
        self.align = rs.align(rs.stream.color)
        self.ffmpeg_process = None
        self.running = False

    def setup(self):
        print("Loading TensorRT Engine...")
        self.model = YOLO(Config.YOLO_ENGINE_PATH, task='detect')

        config = rs.config()
        config.enable_stream(rs.stream.depth, Config.CAMERA_WIDTH, Config.CAMERA_HEIGHT, rs.format.z16, Config.CAMERA_FPS)
        config.enable_stream(rs.stream.color, Config.CAMERA_WIDTH, Config.CAMERA_HEIGHT, rs.format.bgr8, Config.CAMERA_FPS)

        print("Starting RealSense camera...")
        self.pipeline.start(config)

        print("Initializing FFmpeg pipeline...")
        ffmpeg_cmd = [
            'ffmpeg', '-y', '-f', 'rawvideo', '-vcodec', 'rawvideo',
            '-pix_fmt', 'bgr24', '-s', f"{Config.CAMERA_WIDTH}x{Config.CAMERA_HEIGHT}",
            '-r', str(Config.CAMERA_FPS), '-i', '-', '-c:v', 'libx264',
            '-preset', 'ultrafast', '-tune', 'zerolatency', '-f', 'rtsp', Config.RTSP_URL
        ]
        
        try:
            self.ffmpeg_process = subprocess.Popen(ffmpeg_cmd, stdin=subprocess.PIPE, stderr=subprocess.DEVNULL)
        except FileNotFoundError:
            raise Exception("FFmpeg not installed. Run 'apt-get install -y ffmpeg'.")

    def run(self):
        """Blocking loop. Intended to be run in its own thread."""
        self.running = True
        print(f"Streaming live to {Config.RTSP_URL}")
        
        try:
            while self.running:
                frames = self.pipeline.wait_for_frames()
                aligned_frames = self.align.process(frames)
                depth_frame = aligned_frames.get_depth_frame()
                color_frame = aligned_frames.get_color_frame()

                if not depth_frame or not color_frame:
                    continue

                color_image = np.asanyarray(color_frame.get_data())
                depth_intrin = depth_frame.profile.as_video_stream_profile().intrinsics

                results = self.model.predict(source=color_image, conf=Config.CONFIDENCE_THRESHOLD, verbose=False)

                for result in results:
                    for box in result.boxes:
                        x1, y1, x2, y2 = map(int, box.xyxy[0])
                        conf = float(box.conf)
                        
                        cx, cy = (x1 + x2) // 2, (y1 + y2) // 2
                        z_dist = depth_frame.get_distance(cx, cy)

                        if 0.01 < z_dist < 3.0:
                            # 1. Translate 2D Pixel + Depth into Real-World 3D space (Meters)
                            spatial_coords = rs.rs2_deproject_pixel_to_point(depth_intrin, [cx, cy], z_dist)
                            target_x, target_y, target_z = spatial_coords
                            
                            # TODO: Fix this!!!
                            # 2. Fire callback to send to Serial
                            if self.target_detected_callback:
                                self.target_detected_callback(target_x, target_y, target_z)

                            # 3. Draw visuals
                            cv2.rectangle(color_image, (x1, y1), (x2, y2), (0, 255, 0), 2)
                            cv2.circle(color_image, (cx, cy), 4, (0, 0, 255), -1)
                            label = f"Box {conf:.2f} | X:{target_x:.2f} Y:{target_y:.2f} Z:{target_z:.2f}"
                            cv2.putText(color_image, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

                if self.ffmpeg_process and self.ffmpeg_process.stdin:
                    self.ffmpeg_process.stdin.write(color_image.tobytes())

        except Exception as e:
            print(f"Vision loop error: {e}")
        finally:
            self.stop()

    def stop(self):
        self.running = False
        self.pipeline.stop()
        if self.ffmpeg_process:
            self.ffmpeg_process.stdin.close()
            self.ffmpeg_process.wait()
        print("Camera and stream closed cleanly.")