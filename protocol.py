import struct
import re
from config import COMMAND_TYPES

# Regex to remove terminal color codes
ANSI_ESCAPE = re.compile(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])')

# Matches Arduino ESP32 Core format: [ 546][I][main.cpp:26] setup(): Message
ARDUINO_LOG_PATTERN = re.compile(r'^\[\s*(\d+)\]\[([IEWDV])\]\[[^\]]+\]\s*[^:]+:\s*(.*)$')

# Matches custom tags embedded in the message: e.g., "[General] Communication initialized"
TAG_PATTERN = re.compile(r'^\[([^\]]+)\]\s*(.*)$')

# Map ESP log characters to full text levels
LOG_LEVEL_MAP = {
    'E': 'error',
    'W': 'warning',
    'I': 'info',
    'D': 'debug',
    'V': 'verbose'
}

def pack_joint_command(command_str, motor_id, val_a, val_b, val_c):
    """Encodes JSON command into the 17-byte packed binary struct for Joint Control."""
    header = 0x5A
    
    # Try getting from config, default to 0x00 (STOP)
    cmd_type = COMMAND_TYPES.get(command_str, 0x00) 
    
    # Ensure motor_id is exactly 1 byte char
    m_id = str(motor_id)[0].encode('ascii') if motor_id else b'T'
    
    # Calculate simple checksum
    checksum = int(val_a + val_b + val_c) & 0xFFFF
    
    # <BBcfffH: Little-endian, uint8, uint8, char, float, float, float, uint16 (Total: 17 bytes)
    packet = struct.pack('<BBcfffH', header, cmd_type, m_id, float(val_a), float(val_b), float(val_c), checksum)
    return packet

def pack_coordinate_command(x, y, z):
    """Encodes JSON command into the 16-byte packed binary struct for XYZ Coordinate Control."""
    header = 0x5A
    cmd_type = COMMAND_TYPES.get("CMD_MOVE_COORDINATE") # 0x03
    
    # Calculate simple checksum
    checksum = int(x + y + z) & 0xFFFF
    
    # <BBfffH: Little-endian, uint8, uint8, float, float, float, uint16 (Total: 16 bytes)
    packet = struct.pack('<BBfffH', header, cmd_type, float(x), float(y), float(z), checksum)
    return packet

def parse_esp_log(raw_line):
    # ... (Keep this exactly the same as your current code) ...
    clean_line = ANSI_ESCAPE.sub('', raw_line.strip())
    if not clean_line:
        return None
    
    match = ARDUINO_LOG_PATTERN.match(clean_line)
    
    if match:
        timestamp_str, level_char, raw_message = match.groups()
        tag_match = TAG_PATTERN.match(raw_message)
        if tag_match:
            tag = tag_match.group(1).strip()
            message = tag_match.group(2).strip()
        else:
            tag = "System"
            message = raw_message.strip()
            
        return {
            "type": "log",
            "level": LOG_LEVEL_MAP.get(level_char, "info"),
            "timestamp": int(timestamp_str),
            "tag": tag,
            "message": message
        }
    else:
        return {
            "type": "log",
            "level": "info",
            "timestamp": None,
            "tag": "System",
            "message": clean_line
        }
