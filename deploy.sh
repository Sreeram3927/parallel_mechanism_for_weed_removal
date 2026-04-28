#!/bin/bash

# PlatformIO passes the path to the compiled firmware as the first argument
FIRMWARE_PATH=$1 

# --- CONFIGURATION ---
JETSON_USER="sreeram"
JETSON_IP="10.42.0.69" 
ARDUINO_PORT="/dev/arduino_uno"
JETSON_WORKSPACE="/home/sreeram/major_project" # Where you launch Docker from
CONTAINER_NAME="jetson_core"                   # The fixed name we gave the container

# The [m] is a regex trick to prevent pgrep from finding its own process
TELEMETRY_PROCESS_MATCH="[m]ain.py"
TELEMETRY_START_CMD="python3 /workspace/main.py"

# ---------------------
echo "🚀 Transferring firmware to Jetson Nano..."
# Using -q to keep the PlatformIO output clean
scp -q -o LogLevel=ERROR "$FIRMWARE_PATH" $JETSON_USER@$JETSON_IP:$JETSON_WORKSPACE/upload/arduino_firmware_update.hex

echo "🔄 Managing processes and flashing Arduino Uno..."
# -t forces a pseudo-terminal if sudo is needed; -q keeps it quiet
ssh -t -q -o LogLevel=ERROR $JETSON_USER@$JETSON_IP << EOF
    
    if bridge status > /dev/null; then
        WAS_RUNNING=1
        bridge stop
        sleep 2 
    else
        WAS_RUNNING=0
        echo "⏸️ Telemetry is not currently running."
    fi

    echo "⚡ Flashing Arduino Uno via avrdude..."
    # Note: If this fails with 'Permission Denied', run: sudo usermod -aG dialout \$USER
    docker exec $CONTAINER_NAME avrdude -v -p atmega328p -c arduino -P $ARDUINO_PORT -b 115200 -D -U flash:w:/workspace/upload/arduino_firmware_update.hex:i

    if [ "\$WAS_RUNNING" -eq 1 ]; then
        echo "🔁 Restarting telemetry..."
        bridge start
    else
        echo "⏭️ Skipping telemetry restart (was not running previously)."
    fi

    # Clean up the hex file
   rm $JETSON_WORKSPACE/upload/arduino_firmware_update.hex
EOF