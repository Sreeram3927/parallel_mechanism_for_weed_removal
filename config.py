
# Serial Configuration
SERIAL_PORT = '/dev/ttyUSB0'
BAUD_RATE = 115200

# WebSocket Configuration
WS_HOST = "0.0.0.0"
WS_PORT = 8765

# Command Type Mapping (Frontend -> Jetson -> ESP32)
COMMAND_TYPES = {
    "CMD_STOP": 0x00,
    "CMD_MOVE_ABSOLUTE": 0x01,
    "CMD_JOG_RELATIVE": 0x02,
    "CMD_MOVE_COORDINATE": 0x03
}
