#!/bin/bash

# PlatformIO passes the path to the compiled firmware as the first argument
FIRMWARE_PATH=$1 

# --- CONFIGURATION ---
JETSON_USER="sreeram"
JETSON_IP="10.42.0.69" 
ESP_PORT="/dev/ttyUSB0"

# Using the absolute path prevents false positives with pgrep/pkill
TELEMETRY_PROCESS_MATCH="[m]ain.py"
TELEMETRY_START_CMD="/home/sreeram/major_project/venv/bin/python3 /home/sreeram/major_project/main.py"
# ---------------------

echo "🚀 Transferring firmware to Jetson Nano..."
# Added flags to silence SCP warnings
scp -q -o LogLevel=ERROR "$FIRMWARE_PATH" $JETSON_USER@$JETSON_IP:/tmp/firmware.bin

echo "🔄 Managing processes and flashing ESP32..."
# Added flags to silence SSH warnings and connection noise
ssh -q -o LogLevel=ERROR $JETSON_USER@$JETSON_IP << EOF
    echo "🔍 Checking if telemetry is currently running..."
    
    # Check for the specific absolute path
    if pgrep -f "$TELEMETRY_PROCESS_MATCH" > /dev/null; then
        WAS_RUNNING=1
        echo "🛑 Telemetry is running. Stopping it..."
        pkill -f "$TELEMETRY_PROCESS_MATCH"
        sleep 2 
    else
        WAS_RUNNING=0
        echo "⏸️ Telemetry is not currently running."
    fi

    echo "⚡ Flashing ESP32..."
    esptool.py --port $ESP_PORT --baud 460800 write_flash 0x10000 /tmp/firmware.bin

    if [ "\$WAS_RUNNING" -eq 1 ]; then
        echo "🟢 Restarting telemetry script..."
        nohup $TELEMETRY_START_CMD > /tmp/telemetry.log 2>&1 &
        echo "✅ Telemetry restarted in background!"
    else
        echo "⏭️ Skipping telemetry restart (was not running previously)."
    fi
EOF