#!/bin/bash

# Run the below command to add this to user binaries
# chmod +x js-bridge.sh
# sudo cp js-bridge.sh /usr/local/bin/bridge

# Check if an argument was provided
if [ -z "$1" ]; then
    echo "Usage: js-bridge [mode]"
    echo "mode: start/stop"
    exit 1
fi

# The [m] is a clever trick to prevent pgrep from finding itself
TELEMETRY_PROCESS_MATCH="[m]ain.py"

if [ "$1" == "start" ]; then
    echo "🚀 Starting bridge..."
    # Running in background with '&' so the script finishes and leaves the process running
    /home/sreeram/major_project/venv/bin/python3 /home/sreeram/major_project/main.py &
    sleep 1
    echo "Process started in background."
    exit 0

elif [ "$1" == "stop" ]; then
    if pgrep -f "$TELEMETRY_PROCESS_MATCH" > /dev/null; then
        echo "🛑 Telemetry is running. Stopping it..."
        pkill -f "$TELEMETRY_PROCESS_MATCH"
        sleep 2 
        echo "Stopped."
    else
        echo "⏸️ Telemetry is not currently running."
    fi

else
    echo "❌ Invalid Usage"
    echo "Usage: js-bridge [mode]"
    echo "mode: start/stop"
    exit 1
fi
