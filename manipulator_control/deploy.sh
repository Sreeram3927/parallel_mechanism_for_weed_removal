#!/bin/bash

# PlatformIO passes the path to the compiled firmware as the first argument
FIRMWARE_PATH=$1 

# --- CONFIGURATION ---
JETSON_USER="sreeram"
JETSON_IP="10.42.0.69" 
ESP_PORT="/dev/esp32"
JETSON_WORKSPACE="/home/sreeram/major_project" # Where you launch Docker from
CONTAINER_NAME="jetson_core"                   # The fixed name we gave the container

# Update these to match the paths INSIDE the Docker container
TELEMETRY_PROCESS_MATCH="[m]ain.py"
TELEMETRY_START_CMD="python3 /workspace/main.py"
# ---------------------

echo "🚀 Transferring firmware to Jetson Nano workspace..."
# We SCP into the mounted directory so the Docker container sees it instantly at /workspace
scp -q -o LogLevel=ERROR "$FIRMWARE_PATH" $JETSON_USER@$JETSON_IP:$JETSON_WORKSPACE/upload/esp_firmware_update.bin

echo "🔄 Managing Docker processes and flashing ESP32..."
ssh -q -o LogLevel=ERROR $JETSON_USER@$JETSON_IP << EOF
    if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        echo "❌ Error: Docker container '${CONTAINER_NAME}' is not running!"
        exit 1
    fi

    echo "🔍 Checking if telemetry is currently running inside Docker..."

    if bridge status > /dev/null; then
        WAS_RUNNING=1
        bridge stop
        sleep 2 
    else
        WAS_RUNNING=0
        echo "⏸️ Telemetry is not currently running."
    fi

    echo "⚡ Flashing ESP32 via Docker..."
    # esptool.py runs inside the container. It targets the firmware we dropped in the shared volume.
    docker exec $CONTAINER_NAME esptool.py --port $ESP_PORT --baud 460800 write_flash 0x10000 /workspace/upload/esp_firmware_update.bin

    if [ "\$WAS_RUNNING" -eq 1 ]; then
        bridge start
    else
        echo "⏭️ Skipping telemetry restart (was not running previously)."
    fi

    # Clean up the transferred file from the host
    rm $JETSON_WORKSPACE/upload/esp_firmware_update.bin
EOF