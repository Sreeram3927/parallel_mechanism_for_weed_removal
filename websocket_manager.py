import asyncio
import json
import websockets
from protocol import pack_command

# Active WebSocket connections
connected_clients = set()

async def broadcast_ws(message_dict):
    """Sends a JSON message to all connected frontend clients."""
    print(message_dict)
    if not connected_clients:
        return
    message_json = json.dumps(message_dict)
    # Create tasks for all sends to avoid blocking
    await asyncio.gather(*(client.send(message_json) for client in connected_clients))

async def ws_handler(websocket, path, ser):
    """Handles incoming WebSocket connections and commands from the frontend."""
    connected_clients.add(websocket)
    print(f"Frontend connected from {websocket.remote_address}")
    try:
        async for message in websocket:
            try:
                # Parse JSON command from frontend
                data = json.loads(message)
                
                command = data.get("command", "CMD_STOP")
                motor_id = data.get("motorId", "T")
                val_a = data.get("valA", 0.0)
                val_b = data.get("valB", 0.0)
                val_c = data.get("valC", 0.0)
                
                # Pack and send to ESP32 over serial
                binary_payload = pack_command(command, motor_id, val_a, val_b, val_c)
                ser.write(binary_payload)
                
                # Echo to frontend that command was sent successfully
                await broadcast_ws({"type": "status", "message": f"Sent {command} to ESP32"})

            except json.JSONDecodeError:
                print("Invalid JSON received from frontend")
            except Exception as e:
                print(f"Error processing WS message: {e}")
                
    finally:
        connected_clients.remove(websocket)
        print(f"Frontend disconnected: {websocket.remote_address}")
