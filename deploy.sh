#!/bin/bash

set -e

cd /home/ec2-user/bet-profile

echo "Resetting to origin/master..."
git reset --hard origin/master

echo "Building frontend..."
cd frontend
npm run build
cd ..

cp /home/ec2-user/.env /home/ec2-user/bet-profile/backend/.env

echo "prune ..."
docker system prune -a --volumes -f


echo "Building Docker image..."
docker build -t imeansu/bet-profile:latest .

echo "Stopping and removing existing containers..."
docker ps -q --filter "ancestor=imeansu/bet-profile:latest" | xargs -r docker stop
docker ps -aq --filter "ancestor=imeansu/bet-profile:latest" | xargs -r docker rm

echo "Running Docker container in background..."
docker run -d \
  -p 4000:4000 \
  --env-file /home/ec2-user/.env \
  -v /home/ec2-user/logs:/app/backend/logs \
  imeansu/bet-profile:latest

echo "Script completed successfully!"
