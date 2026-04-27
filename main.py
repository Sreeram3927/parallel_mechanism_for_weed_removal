import asyncio
import threading
import websockets
from config import Config
from comms import SystemCommunicator
from vision import VisionSystem

async def main():
    # 1. Initialize Communications
    comms = SystemCommunicator()
    try:
        comms.connect_serial()
    except Exception as e:
        print(f"Failed to open serial port: {e}")
        return

    # 2. Initialize Vision System
    # Pass the comms trigger function as the callback.
    # When YOLO finds a weed, it will call comms.trigger_targeting(x,y,z)
    vision = VisionSystem(target_detected_callback=comms.trigger_targeting)
    vision.setup()

    # 3. Start Vision in a separate background thread
    # This prevents the blocking RealSense/cv2 loop from starving asyncio
    vision_thread = threading.Thread(target=vision.run, daemon=True)
    vision_thread.start()

    # 4. Start WebSocket server
    ws_server = await websockets.serve(
        comms.ws_handler, 
        Config.WS_HOST, 
        Config.WS_PORT
    )
    print(f"WebSocket server running on ws://{Config.WS_HOST}:{Config.WS_PORT}")

    # 5. Run the Serial processing loop concurrently
    try:
        await comms.process_serial_loop()
    except asyncio.CancelledError:
        pass
    finally:
        vision.stop()
        vision_thread.join(timeout=2.0)

if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    try:
        loop.run_until_complete(main())
    except KeyboardInterrupt:
        print("\nShutting down gracefully.")
    finally:
        loop.close()