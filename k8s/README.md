# Kubernetes Manifests for bet-profile

This directory contains all Kubernetes resources for the bet-profile application.

## Files

- `namespace.yaml` - Creates the bet-profile-ns namespace
- `secret.yaml` - Template for API keys (update with your actual keys)
- `deployment.yaml` - Application deployment with 2 replicas
- `service.yaml` - LoadBalancer service for external access
- `deploy.sh` - Script to deploy all resources
- `update-secret.sh` - Script to update API keys

## Quick Start

### 1. Deploy Infrastructure (Terraform)
```bash
cd terraform
terraform apply
```

### 2. Configure kubectl for EKS
```bash
aws eks update-kubeconfig --region ap-northeast-2 --name bet-profile-cluster
```

### 3. Update API Keys
```bash
cd k8s
./update-secret.sh "your_openai_api_key" "your_bfl_api_key"
```

### 4. Deploy Application
```bash
./deploy.sh
```

## Manual Deployment

If you prefer to deploy manually:

```bash
# Create namespace
kubectl apply -f namespace.yaml

# Create secret (update secret.yaml first with your keys)
kubectl apply -f secret.yaml

# Deploy application
kubectl apply -f deployment.yaml

# Create service
kubectl apply -f service.yaml
```

## Check Status

```bash
# Check pods
kubectl get pods -n bet-profile-ns

# Check services
kubectl get svc -n bet-profile-ns

# Get load balancer URL
kubectl get svc bet-profile-service -n bet-profile-ns -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'

# Check logs
kubectl logs -n bet-profile-ns deployment/bet-profile-deployment
```

## Update Application

To update the application image or configuration:

```bash
# Edit deployment.yaml and apply
kubectl apply -f deployment.yaml

# Or restart deployment
kubectl rollout restart deployment/bet-profile-deployment -n bet-profile-ns
```

## Troubleshooting

```bash
# Check pod status
kubectl describe pod -n bet-profile-ns -l app=bet-profile

# Check events
kubectl get events -n bet-profile-ns --sort-by='.lastTimestamp'

# Check secret
kubectl describe secret bet-profile-api-keys -n bet-profile-ns
``` 