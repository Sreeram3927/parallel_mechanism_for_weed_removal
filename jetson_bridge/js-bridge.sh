#!/bin/bash

# Run the below command to add this to user binaries
# chmod +x js-bridge.sh
# sudo cp js-bridge.sh /usr/local/bin/bridge

# Check if an argument was provided
if [ -z "$1" ]; then
    echo "Usage: bridge [mode]"
    echo "mode: start / stop / shell"
    exit 1
fi

CONTAINER_NAME="jetson_core"
TELEMETRY_PROCESS_MATCH="[m]ain.py"
TELEMETRY_START_CMD="python3 /workspace/main.py"

# Ensure the Docker container is actually running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "❌ Error: Docker container '${CONTAINER_NAME}' is not running!"
    exit 1
fi

if [ "$1" == "status" ]; then
    if docker exec $CONTAINER_NAME pgrep -f "$TELEMETRY_PROCESS_MATCH" > /dev/null; then
        echo "Telemetry is running"
        exit 0
    else
        echo "Telementry is not running"
        exit 1
    fi
    

elif [ "$1" == "start" ]; then
    echo "🚀 Starting bridge inside Docker..."
    if docker exec $CONTAINER_NAME pgrep -f "$TELEMETRY_PROCESS_MATCH" > /dev/null; then
        echo "⚠️ Telemetry is already running!"
        exit 0
    fi
    docker exec -d $CONTAINER_NAME sh -c "nohup $TELEMETRY_START_CMD > /workspace/logs/telemetry.log 2>&1"
    sleep 1
    echo "✅ Process started in background."
    exit 0

elif [ "$1" == "stop" ]; then
    if docker exec $CONTAINER_NAME pgrep -f "$TELEMETRY_PROCESS_MATCH" > /dev/null; then
        echo "🛑 Telemetry is running inside Docker. Stopping it..."
        docker exec $CONTAINER_NAME pkill -f "$TELEMETRY_PROCESS_MATCH"
        sleep 2 
        echo "✅ Stopped."
    else
        echo "⏸️ Telemetry is not currently running inside Docker."
    fi

elif [ "$1" == "shell" ] || [ "$1" == "term" ]; then
    echo "🔌 Connecting to Docker container terminal..."
    echo "Type 'exit' to leave the container and return to Jetson host."
    # -it creates an interactive terminal session
    docker exec -it $CONTAINER_NAME /bin/bash
    exit 0

else
    echo "❌ Invalid Usage"
    echo "Usage: bridge [mode]"
    echo "mode: start / stop / status / shell"
    exit 1
fi