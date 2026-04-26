This file uses python3.6.9 which is the default for this jetson nano

use docker
# Pull the specific image for your older JetPack version
sudo docker pull ultralytics/ultralytics:latest-jetson-jetpack4

# Run the container
sudo docker run -it --ipc=host --runtime=nvidia --privileged -v /dev:/dev -v $(pwd):/workspace ultralytics/ultralytics:latest-jetson-jetpack4

yolo export model=ai_models/boxes_ai.pt format=engine half=true device=0 opset=12 simplify=True

apt-get update && apt-get install -y ffmpeg

# my container
sudo docker run -it --ipc=host --runtime=nvidia --privileged --network host -v /dev:/dev -v $(pwd):/workspace jetson-bridge