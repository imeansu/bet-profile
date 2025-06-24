#!/bin/bash

# Simple Docker test script
echo "🐳 Testing Docker image with .env"

# Build image
docker build -t bet-profile:latest .

# Run container with .env file
docker run -p 4000:4000 --env-file ./backend/.env bet-profile:latest 