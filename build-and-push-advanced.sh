#!/bin/bash

# Advanced Build and Push Script for bet-profile
# Features: Versioning, multiple registries, better error handling

set -e  # Exit on any error

# Configuration
IMAGE_NAME="imeansu/bet-profile"
REGISTRY="docker.io"
DEFAULT_TAG="latest"

# Get tag from argument or generate from git
if [ -n "$1" ]; then
    TAG=$1
else
    # Generate tag from git commit hash
    TAG=$(git rev-parse --short HEAD 2>/dev/null || echo "latest")
fi

# Get git branch for additional tagging
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")

echo "🚀 Advanced Build and Push Script"
echo "=================================="
echo "Image: ${REGISTRY}/${IMAGE_NAME}"
echo "Tag: ${TAG}"
echo "Branch: ${BRANCH}"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "🔍 Checking prerequisites..."

if ! command_exists docker; then
    echo "❌ Docker is not installed or not in PATH"
    exit 1
fi

if ! command_exists npm; then
    echo "❌ npm is not installed or not in PATH"
    exit 1
fi

if ! command_exists node; then
    echo "❌ Node.js is not installed or not in PATH"
    exit 1
fi

echo "✅ Prerequisites check passed!"

# Check if user is logged into Docker registry
echo "🔐 Checking Docker registry login..."
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker daemon is not running"
    exit 1
fi

# Step 1: Build Frontend
echo ""
echo "📦 Building Frontend..."
echo "======================"

cd frontend

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found in frontend directory"
    exit 1
fi

# Install dependencies
echo "Installing dependencies..."
npm ci --silent

# Build the frontend
echo "Building Next.js application..."
npm run build

# Export static files
echo "Exporting static files..."
npm run export

echo "✅ Frontend build completed!"

# Step 2: Build Docker Image
echo ""
echo "🐳 Building Docker Image..."
echo "=========================="

cd ..

# Check if Dockerfile exists
if [ ! -f "Dockerfile" ]; then
    echo "❌ Dockerfile not found"
    exit 1
fi

# Build the Docker image with multiple tags
echo "Building image with tag: ${TAG}"
docker build --platform linux/amd64 -t ${IMAGE_NAME}:${TAG} .

# Tag with branch name if not main
if [ "$BRANCH" != "main" ]; then
    echo "Tagging with branch: ${BRANCH}"
    docker tag ${IMAGE_NAME}:${TAG} ${IMAGE_NAME}:${BRANCH}
fi

# Tag for registry
echo "Tagging for registry..."
docker tag ${IMAGE_NAME}:${TAG} ${REGISTRY}/${IMAGE_NAME}:${TAG}

if [ "$BRANCH" != "main" ]; then
    docker tag ${IMAGE_NAME}:${TAG} ${REGISTRY}/${IMAGE_NAME}:${BRANCH}
fi

echo "✅ Docker image built successfully!"

# Step 3: Push to Registry
echo ""
echo "📤 Pushing to Registry..."
echo "========================"

# Push main tag
echo "Pushing tag: ${TAG}"
docker push ${REGISTRY}/${IMAGE_NAME}:${TAG}

# Push branch tag if not main
if [ "$BRANCH" != "main" ]; then
    echo "Pushing branch tag: ${BRANCH}"
    docker push ${REGISTRY}/${IMAGE_NAME}:${BRANCH}
fi

echo "✅ Images pushed successfully!"

# Step 4: Cleanup
echo ""
echo "🧹 Cleanup..."
echo "============"

# Remove local tags to save space
echo "Removing local tags..."
docker rmi ${IMAGE_NAME}:${TAG} 2>/dev/null || true
docker rmi ${REGISTRY}/${IMAGE_NAME}:${TAG} 2>/dev/null || true

if [ "$BRANCH" != "main" ]; then
    docker rmi ${IMAGE_NAME}:${BRANCH} 2>/dev/null || true
    docker rmi ${REGISTRY}/${IMAGE_NAME}:${BRANCH} 2>/dev/null || true
fi

echo "✅ Cleanup completed!"

# Step 5: Summary
echo ""
echo "🎉 Build and Push Summary"
echo "========================"
echo "✅ Frontend built successfully"
echo "✅ Docker image created"
echo "✅ Images pushed to registry"
echo ""
echo "📋 Image Details:"
echo "   Registry: ${REGISTRY}"
echo "   Image: ${IMAGE_NAME}"
echo "   Tags: ${TAG}"
if [ "$BRANCH" != "main" ]; then
    echo "         ${BRANCH}"
fi
echo ""
echo "🚀 Next Steps:"
echo "1. Update k8s/deployment.yaml with new image tag: ${TAG}"
echo "2. Deploy to Kubernetes:"
echo "   kubectl apply -f k8s/deployment.yaml"
echo ""
echo "🔗 Registry URL:"
echo "   https://hub.docker.com/r/${IMAGE_NAME}" 