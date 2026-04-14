import asyncio
import json
import websockets
from protocol import pack_joint_command, pack_coordinate_command

# Active WebSocket connections
connected_clients = set()

async def broadcast_ws(message_dict):
    """Sends a JSON message to all connected frontend clients safely."""
    if not connected_clients:
        return
    
    message_json = json.dumps(message_dict)
    
    results = await asyncio.gather(
        *(client.send(message_json) for client in connected_clients),
        return_exceptions=True
    )
    
    for res in results:
        if isinstance(res, Exception):
            print(f"Broadcast warning: {res}")

async def ws_handler(websocket, path, ser):
    """Handles incoming WebSocket connections and commands from the frontend."""
    connected_clients.add(websocket)
    print(f"Frontend connected from {websocket.remote_address}")
    
    try:
        async for message in websocket:
            
            try:
                # Parse JSON command from frontend
                data = json.loads(message)
                print(data)
                command = data.get("command", "CMD_STOP")
                
                # Determine packet type based on command string
                if command == "CMD_MOVE_COORDINATE":
                    x = data.get("x", 0.0)
                    y = data.get("y", 0.0)
                    z = data.get("z", 0.0)
                    
                    # Pack 16-byte Coordinate packet
                    binary_payload = pack_coordinate_command(x, y, z)
                else:
                    motor_id = data.get("motorId", "T")
                    val_a = data.get("valA", 0.0)
                    val_b = data.get("valB", 0.0)
                    val_c = data.get("valC", 0.0)
                    
                    # Pack 17-byte Joint packet
                    binary_payload = pack_joint_command(command, motor_id, val_a, val_b, val_c)
                
                # Send to ESP32 over serial
                ser.write(binary_payload)
                
                # Echo to frontend that command was sent successfully
                await broadcast_ws({"type": "status", "message": f"Sent {command} to ESP32"})

            except json.JSONDecodeError:
                print("Invalid JSON received from frontend")
            except Exception as e:
                print(f"Error processing WS message: {e}")
                
    except websockets.exceptions.ConnectionClosedError:
        print(f"Frontend connection dropped abruptly: {websocket.remote_address}")
    except Exception as e:
        print(f"Unexpected WebSocket error: {e}")
        
    finally:
        if websocket in connected_clients:
            connected_clients.remove(websocket)
            print(f"Frontend disconnected: {websocket.remote_address}")
