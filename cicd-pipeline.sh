#!/bin/bash

# Complete CI/CD Pipeline Script for bet-profile
# This script builds, pushes, and deploys the application

set -e

# Configuration
IMAGE_NAME="imeansu/bet-profile"
REGISTRY="docker.io"
NAMESPACE="bet-profile-ns"
DEPLOYMENT_NAME="bet-profile-deployment"

# Get tag from argument or generate from git
if [ -n "$1" ]; then
    TAG=$1
else
    TAG=$(git rev-parse --short HEAD 2>/dev/null || echo "latest")
fi

echo "🚀 Complete CI/CD Pipeline"
echo "=========================="
echo "Image: ${REGISTRY}/${IMAGE_NAME}:${TAG}"
echo "Namespace: ${NAMESPACE}"
echo "Deployment: ${DEPLOYMENT_NAME}"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "🔍 Checking prerequisites..."

REQUIRED_COMMANDS=("docker" "npm" "node" "kubectl")
for cmd in "${REQUIRED_COMMANDS[@]}"; do
    if ! command_exists "$cmd"; then
        echo "❌ $cmd is not installed or not in PATH"
        exit 1
    fi
done

echo "✅ Prerequisites check passed!"

# Check Docker daemon
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker daemon is not running"
    exit 1
fi

# Check kubectl connection
if ! kubectl cluster-info >/dev/null 2>&1; then
    echo "❌ kubectl is not connected to a cluster"
    echo "Please run: aws eks update-kubeconfig --region ap-northeast-2 --name bet-profile-cluster"
    exit 1
fi

echo "✅ Environment check passed!"

# Step 1: Build and Push
echo ""
echo "📦 Step 1: Build and Push"
echo "========================"

# Build frontend
echo "Building frontend..."
cd frontend
npm ci --silent
npm run build
cd ..

# Build and push Docker image
echo "Building and pushing Docker image..."
docker build --platform linux/amd64 -t ${IMAGE_NAME}:${TAG} .
docker tag ${IMAGE_NAME}:${TAG} ${REGISTRY}/${IMAGE_NAME}:${TAG}
docker push ${REGISTRY}/${IMAGE_NAME}:${TAG}

echo "✅ Build and push completed!"

# Step 2: Update Deployment
echo ""
echo "🔄 Step 2: Update Deployment"
echo "============================"

# Update image tag in deployment.yaml
echo "Updating deployment.yaml..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s|image: ${IMAGE_NAME}:[^[:space:]]*|image: ${IMAGE_NAME}:${TAG}|g" k8s/deployment.yaml
else
    sed -i "s|image: ${IMAGE_NAME}:[^[:space:]]*|image: ${IMAGE_NAME}:${TAG}|g" k8s/deployment.yaml
fi

echo "✅ Deployment file updated!"

# Step 3: Deploy to Kubernetes
echo ""
echo "🚀 Step 3: Deploy to Kubernetes"
echo "==============================="

# Check if namespace exists, create if not
if ! kubectl get namespace ${NAMESPACE} >/dev/null 2>&1; then
    echo "Creating namespace ${NAMESPACE}..."
    kubectl apply -f k8s/namespace.yaml
fi

# Apply all Kubernetes resources
echo "Applying Kubernetes resources..."
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml

echo "✅ Kubernetes resources applied!"

# Step 4: Wait for Deployment
echo ""
echo "⏳ Step 4: Waiting for Deployment"
echo "================================="

echo "Waiting for deployment to be ready..."
kubectl rollout status deployment/${DEPLOYMENT_NAME} -n ${NAMESPACE} --timeout=300s

echo "✅ Deployment is ready!"

# Step 5: Get Service Information
echo ""
echo "🌐 Step 5: Service Information"
echo "=============================="

# Get load balancer URL
echo "Getting load balancer URL..."
LB_URL=$(kubectl get svc bet-profile-service -n ${NAMESPACE} -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || echo "Pending...")

echo "Load Balancer URL: ${LB_URL}"

# Get pod information
echo ""
echo "📊 Pod Status:"
kubectl get pods -n ${NAMESPACE} -l app=bet-profile

# Step 6: Summary
echo ""
echo "🎉 CI/CD Pipeline Completed Successfully!"
echo "========================================="
echo ""
echo "📋 Summary:"
echo "   ✅ Frontend built"
echo "   ✅ Docker image created and pushed"
echo "   ✅ Kubernetes deployment updated"
echo "   ✅ Application deployed"
echo ""
echo "🔗 Access Information:"
echo "   Load Balancer: ${LB_URL}"
echo "   Image: ${REGISTRY}/${IMAGE_NAME}:${TAG}"
echo ""
echo "🔍 Useful Commands:"
echo "   kubectl get pods -n ${NAMESPACE}"
echo "   kubectl logs -n ${NAMESPACE} deployment/${DEPLOYMENT_NAME}"
echo "   kubectl get svc -n ${NAMESPACE}"
echo ""
echo "📈 Monitoring:"
echo "   kubectl top pods -n ${NAMESPACE}"
echo "   kubectl describe deployment ${DEPLOYMENT_NAME} -n ${NAMESPACE}" 