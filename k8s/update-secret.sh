#!/bin/bash

# Script to update Kubernetes Secret with API keys
# Usage: ./update-secret.sh <openai_api_key> <bfl_api_key>

if [ $# -ne 2 ]; then
    echo "Usage: $0 <openai_api_key> <bfl_api_key>"
    exit 1
fi

OPENAI_API_KEY=$1
BFL_API_KEY=$2

echo "Updating Kubernetes Secret with API keys..."

# Delete existing secret if it exists
kubectl delete secret bet-profile-api-keys -n bet-profile-ns --ignore-not-found=true

# Create new secret
kubectl create secret generic bet-profile-api-keys \
    --from-literal=OPENAI_API_KEY="$OPENAI_API_KEY" \
    --from-literal=BFL_API_KEY="$BFL_API_KEY" \
    --namespace=bet-profile-ns

echo "Secret updated successfully!"
echo "Restarting deployment to pick up new secrets..."

# Restart deployment to pick up new secrets
kubectl rollout restart deployment/bet-profile-deployment -n bet-profile-ns

echo "Deployment restart initiated!"
echo "Check status with: kubectl get pods -n bet-profile-ns" 