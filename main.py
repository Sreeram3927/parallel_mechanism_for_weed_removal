import asyncio
import struct
import serial
import websockets

from config import SERIAL_PORT, BAUD_RATE, WS_HOST, WS_PORT
from protocol import parse_esp_log
from websocket_manager import ws_handler, broadcast_ws

async def process_serial_loop(ser):
    """Reads serial data continuously, separates binary telemetry from ASCII logs."""
    buffer = bytearray()
    text_buffer = ""
    
    # The start sequence of our telemetry packet (from your C++ code)
    SYNC_MARKER = b'\xaa\x55\xa5\x01'
    PACKET_SIZE = 19 # 2 sync + 16 struct + 1 end marker

    while True:
        if ser.in_waiting > 0:
            data = ser.read(ser.in_waiting)
            buffer.extend(data)
            
            while True:
                sync_idx = buffer.find(SYNC_MARKER)
                
                if sync_idx != -1:
                    # 1. Anything BEFORE the sync marker is standard ASCII log data
                    if sync_idx > 0:
                        log_bytes = buffer[:sync_idx]
                        text_buffer += log_bytes.decode('ascii', errors='ignore')
                        del buffer[:sync_idx]
                        sync_idx = 0 
                    
                    # 2. Check if we have the full 19-byte packet in the buffer
                    if len(buffer) >= PACKET_SIZE:
                        packet_bytes = buffer[:PACKET_SIZE]
                        
                        # Verify the End of Frame marker
                        if packet_bytes[-1] == 0x0D:
                            struct_data = packet_bytes[2:18]
                            unpacked = struct.unpack('<BBfffH', struct_data)
                            
                            calc_chk = int(unpacked[2] + unpacked[3] + unpacked[4]) & 0xFFFF
                            chk_valid = (calc_chk == unpacked[5])

                            # Send Telemetry Data to Frontend
                            await broadcast_ws({
                                "type": "telemetry",
                                "data": {
                                    "angleA": round(unpacked[2], 2),
                                    "angleB": round(unpacked[3], 2),
                                    "angleC": round(unpacked[4], 2),
                                    "checksum_valid": chk_valid
                                }
                            })
                        else:
                            text_buffer += chr(buffer[0])
                            del buffer[:1]
                            continue
                            
                        del buffer[:PACKET_SIZE]
                    else:
                        break
                else:
                    # No sync marker found. Last 3 bytes could be partial marker.
                    if len(buffer) > 3:
                        log_bytes = buffer[:-3]
                        text_buffer += log_bytes.decode('ascii', errors='ignore')
                        del buffer[:-3]
                    break
            
            # 3. Process accumulated text buffer into structured logs
            while '\n' in text_buffer:
                line, text_buffer = text_buffer.split('\n', 1)
                
                parsed_log = parse_esp_log(line)
                if parsed_log:
                    await broadcast_ws(parsed_log)

        await asyncio.sleep(0.01)

async def main():
    print(f"Opening Serial Port {SERIAL_PORT} at {BAUD_RATE} baud...")
    try:
        ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=0) 
    except Exception as e:
        print(f"Failed to open serial port: {e}")
        return

    # Start WebSocket server
    ws_server = await websockets.serve(
        lambda ws, path: ws_handler(ws, path, ser), 
        WS_HOST, 
        WS_PORT
    )
    print(f"WebSocket server running on ws://{WS_HOST}:{WS_PORT}")

    # Start Serial processing
    await process_serial_loop(ser)

if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    try:
        loop.run_until_complete(main())
    except KeyboardInterrupt:
        print("\nShutting down gracefully.")
    finally:
        loop.close()
