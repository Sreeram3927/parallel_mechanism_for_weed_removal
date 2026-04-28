# 1. Base Image: The Ultralytics image configured for Jetson Nano's Python 3.8 & PyTorch
FROM ultralytics/ultralytics:latest-jetson-jetpack4

# 2. Install System Dependencies: We need FFmpeg to push the RTSP stream to MediaMTX
RUN apt-get update && \
    apt-get install -y ffmpeg avrdude && \
    rm -rf /var/lib/apt/lists/*

# 3. Set Working Directory: This is where our project will live inside the container
WORKDIR /workspace

# 4. Install Python Dependencies: Copy your requirements and install them
# (pyrealsense2, pyserial, websockets, etc.)
COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt

# 5. Copy your actual code and AI models into the container
# COPY . .

# 6. Default Command: Tell the container what to run when it starts up
CMD ["sleep", "infinity"]