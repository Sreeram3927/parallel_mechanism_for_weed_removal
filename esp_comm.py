import asyncio
import json
import websockets
import serial
import struct
from config import Config
from protocol import ProtocolManager
import numpy as np

class ESPCommunicator:
    def __init__(self):
        self.connected_clients = set()
        self.ser = None
        self.sync_marker = b'\xaa\x55\xa5\x01'
        self.packet_size = 19

        self.T_cam_to_rob = np.array([
            [ 0.0076,  0.9394, -0.5007,  246.0],  # Recalibrated (Fixes Y_man)
            [ 0.9325,  0.2294,  0.2790, -197.0],  # Original (X_man is correct)
            [ 0.1289, -0.6343, -0.7929,  -49.0],  # Recalibrated (Fixes Z_man)
            [ 0.0000,  0.0000,  0.0000,    1.0]
        ])
        
    def connect_esp(self):
        """Initializes the esp connection."""
        print(f"Opening ESP Port {Config.ESP_PORT} at {Config.BAUD_RATE} baud...")
        self.ser = serial.Serial(Config.ESP_PORT, Config.BAUD_RATE, timeout=0)

    def send_command(self, packet):
        """Thread-safe write to serial. Used by WS and Vision systems."""
        if self.ser and self.ser.is_open:
            self.ser.write(packet)

    def trigger_targeting(self, x_cam, y_cam, z_cam):
        x_rob, y_rob, z_rob = self.transform_to_robotFrame(x_cam*1000, y_cam*1000 ,z_cam*1000)
        x_man, y_man, z_man = self.transform_to_manipulatorFrame(x_rob, y_rob, z_rob)
        # packet = ProtocolManager.pack_coordinate_command(x_man, y_man, z_man)
        print(x_man, y_man, z_man)
        # self.send_command(packet)

    def transform_to_robotFrame(self, x_cam, y_cam, z_cam):
        """
        Converts weed coordinates from the Camera Frame to the Delta Robot Frame.
        Expects inputs in the same units used during calibration (mm).
        """
        # 1. Convert the 3D point into a 4D homogeneous vector [x, y, z, 1.0]
        point_camera = np.array([x_cam, y_cam, z_cam, 1.0])
        
        # 2. Multiply the 4x4 matrix by the 4x1 vector using the '@' operator
        point_robot = self.T_cam_to_rob @ point_camera
        
        # 3. Extract the new X, Y, Z coordinates. 
        # Rounding to 2 decimal places for cleaner serial transmission to the ESP32
        x_rob = round(point_robot[0], 2)
        y_rob = round(point_robot[1], 2)
        z_rob = round(point_robot[2], 2)
        
        return x_rob, y_rob, z_rob
    
    def transform_to_manipulatorFrame(self, x, y, z):
        """
        Transforms coordinates from the Robot Frame to the Manipulator Frame.
        - The manipulator origin is at (0, 0, -45) in the Robot Frame.
        - The Z-axis orientation remains the same.
        - The X and Y axes are swapped.
        """
        # 1. Swap the X and Y axes
        x_m = y
        y_m = x
        
        # 2. Shift the Z axis
        # Subtracting the origin position: z - (-45) = z + 45
        z_m = z + 45.0
        
        # 3. Return as floats for consistency
        return float(x_m), float(y_m), float(z_m)
    

    async def broadcast_ws(self, message_dict):
        """Broadcasts data to all connected web UI clients."""
        if not self.connected_clients:
            return
        message_json = json.dumps(message_dict)
        results = await asyncio.gather(
            *(client.send(message_json) for client in self.connected_clients),
            return_exceptions=True
        )
        for res in results:
            if isinstance(res, Exception):
                print(f"Broadcast warning: {res}")

    async def ws_handler(self, websocket, path):
        """Handles incoming WebSockets commands."""
        self.connected_clients.add(websocket)
        try:
            async for message in websocket:
                try:
                    data = json.loads(message)
                    command = data.get("command", "CMD_STOP")
                    
                    if command == "CMD_MOVE_COORDINATE":
                        packet = ProtocolManager.pack_coordinate_command(
                            data.get("x", 0.0), data.get("y", 0.0), data.get("z", 0.0)
                        )
                    else:
                        packet = ProtocolManager.pack_joint_command(
                            command, data.get("motorId", "T"), 
                            data.get("valA", 0.0), data.get("valB", 0.0), data.get("valC", 0.0)
                        )
                    
                    self.send_command(packet)
                    await self.broadcast_ws({"type": "status", "message": f"Sent {command} to ESP32"})

                except json.JSONDecodeError:
                    print("Invalid JSON received from frontend")
        except websockets.exceptions.ConnectionClosedError:
            pass
        finally:
            if websocket in self.connected_clients:
                self.connected_clients.remove(websocket)

    async def process_serial_loop(self):
        """Reads serial data, separates telemetry from logs, broadcasts to WS."""
        buffer = bytearray()
        text_buffer = ""

        while True:
            if self.ser and self.ser.in_waiting > 0:
                buffer.extend(self.ser.read(self.ser.in_waiting))
                
                while True:
                    sync_idx = buffer.find(self.sync_marker)
                    if sync_idx != -1:
                        if sync_idx > 0:
                            text_buffer += buffer[:sync_idx].decode('ascii', errors='ignore')
                            del buffer[:sync_idx]
                            sync_idx = 0 
                        
                        if len(buffer) >= self.packet_size:
                            packet_bytes = buffer[:self.packet_size]
                            if packet_bytes[-1] == 0x0D:
                                struct_data = packet_bytes[2:18]
                                unpacked = struct.unpack('<BBfffH', struct_data)
                                calc_chk = int(unpacked[2] + unpacked[3] + unpacked[4]) & 0xFFFF
                                
                                await self.broadcast_ws({
                                    "type": "telemetry",
                                    "data": {
                                        "angleA": round(unpacked[2], 2),
                                        "angleB": round(unpacked[3], 2),
                                        "angleC": round(unpacked[4], 2),
                                        "checksum_valid": (calc_chk == unpacked[5])
                                    }
                                })
                            else:
                                text_buffer += chr(buffer[0])
                                del buffer[:1]
                                continue
                                
                            del buffer[:self.packet_size]
                        else:
                            break
                    else:
                        if len(buffer) > 3:
                            text_buffer += buffer[:-3].decode('ascii', errors='ignore')
                            del buffer[:-3]
                        break
                
                while '\n' in text_buffer:
                    line, text_buffer = text_buffer.split('\n', 1)
                    parsed_log = ProtocolManager.parse_esp_log(line)
                    if parsed_log:
                        await self.broadcast_ws(parsed_log)

            await asyncio.sleep(0.01)