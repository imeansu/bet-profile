# Build and Deployment Scripts

This directory contains various scripts for building, pushing, and deploying the bet-profile application.

## 📁 Available Scripts

### 1. `build-and-push.sh` - Basic Build Script
**Purpose**: Simple script to build frontend, create Docker image, and push to registry.

**Usage**:
```bash
# Build with 'latest' tag
./build-and-push.sh

# Build with custom tag
./build-and-push.sh v1.0.0
```

**Features**:
- ✅ Builds Next.js frontend
- ✅ Creates Docker image
- ✅ Pushes to Docker Hub
- ✅ Simple and straightforward

---

### 2. `build-and-push-advanced.sh` - Advanced Build Script
**Purpose**: Enhanced build script with better error handling, versioning, and cleanup.

**Usage**:
```bash
# Build with git commit hash as tag
./build-and-push-advanced.sh

# Build with custom tag
./build-and-push-advanced.sh v1.0.0
```

**Features**:
- ✅ Prerequisites checking
- ✅ Git-based versioning
- ✅ Multiple tag support (commit hash + branch)
- ✅ Automatic cleanup
- ✅ Better error handling
- ✅ Detailed progress reporting

---

### 3. `update-deployment.sh` - Kubernetes Deployment Update
**Purpose**: Updates the Kubernetes deployment with a new image tag.

**Usage**:
```bash
# Update with 'latest' tag
./update-deployment.sh

# Update with specific tag
./update-deployment.sh v1.0.0
```

**Features**:
- ✅ Updates deployment.yaml automatically
- ✅ Applies changes to Kubernetes
- ✅ Waits for deployment to be ready
- ✅ Provides useful monitoring commands

---

### 4. `cicd-pipeline.sh` - Complete CI/CD Pipeline
**Purpose**: End-to-end pipeline that builds, pushes, and deploys the application.

**Usage**:
```bash
# Run complete pipeline with git commit hash
./cicd-pipeline.sh

# Run with custom tag
./cicd-pipeline.sh v1.0.0
```

**Features**:
- ✅ Complete automation
- ✅ Environment validation
- ✅ Build and push
- ✅ Kubernetes deployment
- ✅ Health checks
- ✅ Load balancer URL retrieval
- ✅ Comprehensive reporting

---

## 🚀 Quick Start

### Option 1: Complete Pipeline (Recommended)
```bash
# Run the complete CI/CD pipeline
./cicd-pipeline.sh
```

### Option 2: Step by Step
```bash
# 1. Build and push
./build-and-push-advanced.sh

# 2. Update and deploy
./update-deployment.sh
```

### Option 3: Manual Steps
```bash
# 1. Build frontend
cd frontend
npm install
npm run build
npm run export
cd ..

# 2. Build Docker image
docker build -t imeansu/bet-profile:latest .

# 3. Push to registry
docker tag imeansu/bet-profile:latest docker.io/imeansu/bet-profile:latest
docker push docker.io/imeansu/bet-profile:latest

# 4. Deploy to Kubernetes
kubectl apply -f k8s/
```

---

## 🔧 Prerequisites

Before running any script, ensure you have:

- ✅ **Docker** installed and running
- ✅ **Node.js** and **npm** installed
- ✅ **kubectl** configured for your EKS cluster
- ✅ **Docker Hub** account (or other registry)
- ✅ **AWS CLI** configured (for EKS access)

### Setup kubectl for EKS:
```bash
aws eks update-kubeconfig --region ap-northeast-2 --name bet-profile-cluster
```

### Login to Docker Hub:
```bash
docker login
```

---

## 📋 Script Comparison

| Feature | Basic | Advanced | Update | CI/CD |
|---------|-------|----------|--------|-------|
| Frontend Build | ✅ | ✅ | ❌ | ✅ |
| Docker Build | ✅ | ✅ | ❌ | ✅ |
| Docker Push | ✅ | ✅ | ❌ | ✅ |
| K8s Update | ❌ | ❌ | ✅ | ✅ |
| K8s Deploy | ❌ | ❌ | ✅ | ✅ |
| Error Handling | Basic | Advanced | Good | Excellent |
| Prerequisites Check | ❌ | ✅ | Basic | ✅ |
| Cleanup | ❌ | ✅ | ❌ | ❌ |
| Health Checks | ❌ | ❌ | ✅ | ✅ |

---

## 🔍 Troubleshooting

### Common Issues:

1. **Docker not running**
   ```bash
   # Start Docker Desktop or Docker daemon
   sudo systemctl start docker  # Linux
   ```

2. **kubectl not connected**
   ```bash
   aws eks update-kubeconfig --region ap-northeast-2 --name bet-profile-cluster
   ```

3. **Docker Hub login required**
   ```bash
   docker login
   ```

4. **Frontend build fails**
   ```bash
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   ```

5. **Kubernetes deployment fails**
   ```bash
   kubectl describe deployment bet-profile-deployment -n bet-profile-ns
   kubectl logs -n bet-profile-ns deployment/bet-profile-deployment
   ```

---

## 📈 Monitoring

After deployment, monitor your application:

```bash
# Check pod status
kubectl get pods -n bet-profile-ns

# Check service
kubectl get svc -n bet-profile-ns

# Check logs
kubectl logs -n bet-profile-ns deployment/bet-profile-deployment

# Get load balancer URL
kubectl get svc bet-profile-service -n bet-profile-ns -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
```

---

## 🔄 Versioning Strategy

The scripts support different versioning approaches:

- **Git commit hash**: Automatic versioning based on git
- **Custom tags**: Manual versioning (e.g., v1.0.0)
- **Latest**: Default tag for development

Recommended workflow:
1. Use git commit hash for development
2. Use semantic versioning for releases
3. Use 'latest' for quick testing 