#!/bin/bash

# Deployment script for bet-profile Kubernetes resources
# Usage: ./deploy.sh

echo "Deploying bet-profile to Kubernetes..."

# Apply namespace first
echo "Creating namespace..."
kubectl apply -f namespace.yaml

# Apply secret
echo "Creating secret..."
kubectl apply -f secret.yaml

# Apply deployment
echo "Creating deployment..."
kubectl apply -f deployment.yaml

# Apply service
echo "Creating service..."
kubectl apply -f service.yaml

echo "Deployment completed!"
echo ""
echo "Check the status with:"
echo "kubectl get pods -n bet-profile-ns"
echo "kubectl get svc -n bet-profile-ns"
echo ""
echo "Get the load balancer URL with:"
echo "kubectl get svc bet-profile-service -n bet-profile-ns -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'" 