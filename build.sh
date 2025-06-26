#!/bin/bash

set -e

echo "Building frontend..."
cd frontend
#npm run build
cd ..

echo "Building Docker image..."
docker build --platform linux/amd64 -t imeansu/bet-profile:latest .

docker push imeansu/bet-profile:latest

echo "Script completed successfully!"