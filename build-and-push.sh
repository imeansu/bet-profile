#!/bin/bash

# Build and Push Script for bet-profile
# This script builds the frontend, creates a Docker image, and pushes it to registry

set -e  # Exit on any error

# Configuration
IMAGE_NAME="imeansu/bet-profile"
TAG=${1:-latest}
REGISTRY="docker.io"  # Change to your registry if different

echo "🚀 Starting build and push process..."
echo "Image: ${REGISTRY}/${IMAGE_NAME}:${TAG}"

# Step 1: Build Frontend
echo "📦 Building frontend..."
cd frontend

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

# Build the frontend
echo "Building Next.js application..."
npm run build

# Step 2: Build Docker Image
echo "🐳 Building Docker image..."
docker build --platform linux/amd64 -t ${IMAGE_NAME}:${TAG} .

echo "✅ Docker image built successfully!"

# Step 3: Tag for registry
echo "🏷️  Tagging image for registry..."
docker tag ${IMAGE_NAME}:${TAG} ${REGISTRY}/${IMAGE_NAME}:${TAG}

# Step 4: Push to Registry
echo "📤 Pushing to registry..."
docker push ${REGISTRY}/${IMAGE_NAME}:${TAG}

echo "✅ Image pushed successfully!"
echo "🎉 Build and push completed!"
echo ""
echo "Image: ${REGISTRY}/${IMAGE_NAME}:${TAG}"
echo ""
echo "To deploy to Kubernetes, update the image tag in k8s/deployment.yaml and run:"
echo "kubectl apply -f k8s/deployment.yaml" 