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

def pack_command(command_str, motor_id, val_a, val_b, val_c):
    """Encodes JSON command into the 17-byte packed binary struct for ESP32."""
    header = 0x5A
    cmd_type = COMMAND_TYPES.get(command_str, 0x00) # Default to STOP if unknown
    
    # Ensure motor_id is exactly 1 byte char
    m_id = str(motor_id)[0].encode('ascii') if motor_id else b'T'
    
    # Calculate simple checksum
    checksum = int(val_a + val_b + val_c) & 0xFFFF
    
    # <BBcfffH means: Little-endian, uint8, uint8, char, float, float, float, uint16
    packet = struct.pack('<BBcfffH', header, cmd_type, m_id, float(val_a), float(val_b), float(val_c), checksum)
    return packet

def parse_esp_log(raw_line):
    """Parses a raw serial line, formats it into a structured JSON dictionary."""
    clean_line = ANSI_ESCAPE.sub('', raw_line.strip())
    if not clean_line:
        return None
    
    # 1. Try to match the Arduino Core ESP32 format
    match = ARDUINO_LOG_PATTERN.match(clean_line)
    
    if match:
        timestamp_str, level_char, raw_message = match.groups()
        
        # 2. Check if the message has a custom tag like "[General] message"
        tag_match = TAG_PATTERN.match(raw_message)
        if tag_match:
            tag = tag_match.group(1).strip()
            message = tag_match.group(2).strip()
        else:
            tag = "System" # Default to System if no custom tag is present
            message = raw_message.strip()
            
        return {
            "type": "log",
            "level": LOG_LEVEL_MAP.get(level_char, "info"),
            "timestamp": int(timestamp_str),
            "tag": tag,
            "message": message
        }
    else:
        # 3. Fallback for raw bootloader prints (e.g., 'ets Jun  8 2016')
        return {
            "type": "log",
            "level": "info",
            "timestamp": None,
            "tag": "System",
            "message": clean_line
        }
