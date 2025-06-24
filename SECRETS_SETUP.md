# Secrets Management Setup Guide

This guide explains how to set up and use API keys securely in the bet-profile application using Kubernetes Secrets.

## Overview

The application now uses a simple and secure approach:

1. **Kubernetes Secrets** (Production)
   - API keys stored as Kubernetes Secrets
   - Injected as environment variables into pods
   - Simple and secure

2. **Environment Variables** (Development)
   - Traditional method for local development
   - Uses .env file

## Setup Instructions

### 1. Create Kubernetes Secret

#### Option A: Using the provided script
```bash
cd terraform
./create-k8s-secret.sh "your_openai_api_key" "your_bfl_api_key"
```

#### Option B: Manual creation
```bash
kubectl create secret generic bet-profile-api-keys \
    --from-literal=openai_api_key="your_openai_api_key" \
    --from-literal=bfl_api_key="your_bfl_api_key" \
    --namespace=bet-profile-ns
```

### 2. Apply Terraform Configuration

```bash
cd terraform
terraform plan -var="openai_api_key=your_openai_key" -var="bfl_api_key=your_bfl_key"
terraform apply -var="openai_api_key=your_openai_key" -var="bfl_api_key=your_bfl_key"
```

### 3. Install Dependencies

```bash
cd backend
npm install
```

## How It Works

### Kubernetes Secret Approach

1. **Secret Creation**: API keys are stored in a Kubernetes Secret
2. **Environment Injection**: Secrets are injected as environment variables into pods
3. **Application Access**: Application reads from `process.env.OPENAI_API_KEY` and `process.env.BFL_API_KEY`

### Backend Code

The backend uses a simple `secrets.js` module that:
- Reads API keys from environment variables
- Provides clear error messages if keys are missing
- Works in both development and production

### Kubernetes Integration

The Terraform configuration includes:
- **Kubernetes Secret** for storing API keys
- **Environment variables** in deployment that reference the secret
- **Simple and clean** approach without complex CSI drivers

## Security Benefits

1. **No hardcoded secrets** in code or configuration
2. **Kubernetes-native** secret management
3. **Encrypted at rest** in etcd
4. **RBAC support** for access control
5. **Simple to manage** and update

## Development vs Production

### Development
- Use environment variables in `.env` file
- No Kubernetes required
- Fast development cycle

### Production
- Secrets stored in Kubernetes Secrets
- Injected as environment variables
- Managed through Terraform

## Local Development Setup

### Environment Variables (Recommended)

Create a `.env` file in the backend directory:

```bash
cd backend
echo "OPENAI_API_KEY=your_openai_key_here" > .env
echo "BFL_API_KEY=your_bfl_key_here" >> .env
```

## Troubleshooting

### Common Issues

1. **"API keys not found" error**
   - Check if Kubernetes Secret exists
   - Verify secret names match exactly
   - Ensure namespace is correct

2. **Secret not accessible**
   - Check if secret is in the correct namespace
   - Verify pod has access to the secret
   - Check secret key names

### Debug Commands

```bash
# Check if secret exists
kubectl get secret bet-profile-api-keys -n bet-profile-ns

# Check secret details
kubectl describe secret bet-profile-api-keys -n bet-profile-ns

# Check pod environment variables
kubectl exec -n bet-profile-ns deployment/bet-profile-deployment -- env | grep API_KEY

# Check pod logs
kubectl logs -n bet-profile-ns deployment/bet-profile-deployment
```

## Updating Secrets

To update existing secrets:

```bash
# Delete old secret
kubectl delete secret bet-profile-api-keys -n bet-profile-ns

# Create new secret
./create-k8s-secret.sh "new_openai_key" "new_bfl_key"

# Restart deployment to pick up new secrets
kubectl rollout restart deployment/bet-profile-deployment -n bet-profile-ns
```

## Best Practices

1. **Never commit secrets** to version control
2. **Use different secrets** for different environments
3. **Rotate secrets regularly**
4. **Use RBAC** to control access to secrets
5. **Monitor secret access** through audit logs
6. **Test secret updates** in staging first 