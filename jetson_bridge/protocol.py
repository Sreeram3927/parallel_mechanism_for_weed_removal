import struct
import re
from config import Config

class ProtocolManager:
    ANSI_ESCAPE = re.compile(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])')
    ARDUINO_LOG_PATTERN = re.compile(r'^\[\s*(\d+)\]\[([IEWDV])\]\[[^\]]+\]\s*[^:]+:\s*(.*)$')
    TAG_PATTERN = re.compile(r'^\[([^\]]+)\]\s*(.*)$')

    LOG_LEVEL_MAP = {
        'E': 'error', 'W': 'warning', 'I': 'info', 'D': 'debug', 'V': 'verbose'
    }

    @staticmethod
    def pack_joint_command(command_str, motor_id, val_a, val_b, val_c):
        header = 0x5A
        cmd_type = Config.COMMAND_TYPES.get(command_str, 0x00) 
        m_id = str(motor_id)[0].encode('ascii') if motor_id else b'T'
        checksum = int(val_a + val_b + val_c) & 0xFFFF
        
        return struct.pack('<BBcfffH', header, cmd_type, m_id, float(val_a), float(val_b), float(val_c), checksum)

    @staticmethod
    def pack_coordinate_command(x, y, z):
        header = 0x5A
        cmd_type = Config.COMMAND_TYPES.get("CMD_MOVE_COORDINATE")
        checksum = int(x + y + z) & 0xFFFF
        
        return struct.pack('<BBfffH', header, cmd_type, float(x), float(y), float(z), checksum)

    @staticmethod
    def parse_esp_log(raw_line):
        clean_line = ProtocolManager.ANSI_ESCAPE.sub('', raw_line.strip())
        if not clean_line:
            return None
        
        match = ProtocolManager.ARDUINO_LOG_PATTERN.match(clean_line)
        if match:
            timestamp_str, level_char, raw_message = match.groups()
            tag_match = ProtocolManager.TAG_PATTERN.match(raw_message)
            tag = tag_match.group(1).strip() if tag_match else "System"
            message = tag_match.group(2).strip() if tag_match else raw_message.strip()
                
            return {
                "type": "log",
                "level": ProtocolManager.LOG_LEVEL_MAP.get(level_char, "info"),
                "timestamp": int(timestamp_str),
                "tag": tag,
                "message": message
            }
        else:
            return {"type": "log", "level": "info", "timestamp": None, "tag": "System", "message": clean_line}