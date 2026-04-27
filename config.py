class Config:
    # Serial Configuration
    SERIAL_PORT = '/dev/esp32'
    BAUD_RATE = 115200

    # WebSocket Configuration
    WS_HOST = "0.0.0.0"
    WS_PORT = 8765

    # Command Types
    COMMAND_TYPES = {
        "CMD_STOP": 0x00,
        "CMD_MOVE_ABSOLUTE": 0x01,
        "CMD_JOG_RELATIVE": 0x02,
        "CMD_MOVE_COORDINATE": 0x03
    }

    # Camera & AI Configuration
    CAMERA_FPS = 30
    CAMERA_WIDTH = 640
    CAMERA_HEIGHT = 480
    RTSP_URL = "rtsp://localhost:8554/realsense"
    
    # Model Configuration
    YOLO_ENGINE_PATH = "ai_models/boxes_ai/v5s/boxes_ai.engine"
    CONFIDENCE_THRESHOLD = 0.5