#!/bin/bash

# Update Kubernetes Deployment Script
# This script updates the deployment with a new image tag

set -e

# Configuration
DEPLOYMENT_FILE="k8s/deployment.yaml"
DEPLOYMENT_NAME="bet-profile-deployment"
NAMESPACE="bet-profile-ns"

# Get tag from argument or use latest
TAG=${1:-latest}
IMAGE_NAME="imeansu/bet-profile"

echo "🔄 Updating Kubernetes Deployment"
echo "================================="
echo "Image: ${IMAGE_NAME}:${TAG}"
echo "Deployment: ${DEPLOYMENT_NAME}"
echo "Namespace: ${NAMESPACE}"
echo ""

# Check if deployment file exists
if [ ! -f "$DEPLOYMENT_FILE" ]; then
    echo "❌ Deployment file not found: $DEPLOYMENT_FILE"
    exit 1
fi

# Update the image tag in deployment.yaml
echo "📝 Updating image tag in deployment.yaml..."

# Use sed to replace the image tag
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|image: ${IMAGE_NAME}:[^[:space:]]*|image: ${IMAGE_NAME}:${TAG}|g" "$DEPLOYMENT_FILE"
else
    # Linux
    sed -i "s|image: ${IMAGE_NAME}:[^[:space:]]*|image: ${IMAGE_NAME}:${TAG}|g" "$DEPLOYMENT_FILE"
fi

echo "✅ Image tag updated in deployment.yaml"

# Apply the updated deployment
echo "🚀 Applying updated deployment..."
kubectl apply -f "$DEPLOYMENT_FILE"

echo "✅ Deployment updated successfully!"

# Check deployment status
echo ""
echo "📊 Checking deployment status..."
kubectl rollout status deployment/${DEPLOYMENT_NAME} -n ${NAMESPACE}

echo ""
echo "🎉 Deployment update completed!"
echo ""
echo "📋 Deployment Details:"
echo "   Name: ${DEPLOYMENT_NAME}"
echo "   Namespace: ${NAMESPACE}"
echo "   Image: ${IMAGE_NAME}:${TAG}"
echo ""
echo "🔍 Useful Commands:"
echo "   kubectl get pods -n ${NAMESPACE}"
echo "   kubectl logs -n ${NAMESPACE} deployment/${DEPLOYMENT_NAME}"
echo "   kubectl describe deployment ${DEPLOYMENT_NAME} -n ${NAMESPACE}" 