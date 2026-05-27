import asyncio
import serial
from config import Config

class ArduinoCommunicator:
    def __init__(self):
        self.ser = None

    def connect_arduino(self):
        """Initializes the Arduino connection."""
        print(f"Opening Arduino Port {Config.UNO_PORT} at {Config.BAUD_RATE} baud...")
        # Make sure to define UNO_PORT and BAUD_RATE (115200) in your config.py
        self.ser = serial.Serial(Config.UNO_PORT, Config.BAUD_RATE, timeout=0)

    def send_command(self, command_str):
        """Thread-safe write to Arduino serial."""
        if self.ser and self.ser.is_open:
            # Ensure command is a string, strip accidental whitespace, and ADD NEWLINE
            command = str(command_str).strip() + '\n'
            self.ser.write(command.encode('utf-8'))

    async def process_serial_loop(self, broadcast_callback):
        """Reads log replies from the Arduino and passes them to the WS broadcaster."""
        buffer = ""
        while True:
            if self.ser and self.ser.in_waiting > 0:
                try:
                    # Read available bytes and decode
                    new_data = self.ser.read(self.ser.in_waiting).decode('utf-8', errors='ignore')
                    buffer += new_data
                    
                    # If we have a full line, broadcast it
                    while '\n' in buffer:
                        line, buffer = buffer.split('\n', 1)
                        clean_line = line.strip()
                        if clean_line:
                            await broadcast_callback({
                                "type": "log",
                                "source": "arduino",
                                "message": clean_line
                            })
                except Exception as e:
                    print(f"Arduino Read Error: {e}")
            
            # Yield control back to the asyncio event loop
            await asyncio.sleep(0.01)