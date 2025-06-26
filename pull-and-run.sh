#!/bin/bash

set -e

cd /home/ec2-user/bet-profile

IMAGE=imeansu/bet-profile:latest

# Pull the latest image
echo "Pulling latest Docker image..."
docker pull $IMAGE

# Stop and remove existing containers
echo "Stopping and removing existing containers..."
docker ps -q --filter "ancestor=$IMAGE" | xargs -r docker stop
docker ps -aq --filter "ancestor=$IMAGE" | xargs -r docker rm

# Run the Docker container in background
echo "Running Docker container in background..."
docker run -d \
  -p 4000:4000 \
  --env-file /home/ec2-user/.env \
  -v /home/ec2-user/logs:/app/backend/logs \
  $IMAGE

echo "Script completed successfully!" 