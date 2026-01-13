# ChatterBox Deployment Guide

This guide covers multiple deployment options for the ChatterBox application (Spring Boot backend + Next.js frontend).

---

## 🚀 Deployment Options

### Option 1: Local Development (Already Configured)
```bash
./start.sh
```
- Backend runs on `http://localhost:8080`
- Frontend runs on `http://localhost:3000`

---

### Option 2: Docker Deployment (Recommended for Production)

#### Step 1: Create Frontend Dockerfile
Create `frontend/Dockerfile`:
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```

#### Step 2: Create Docker Compose
Create `docker-compose.yml` in the root directory:
```yaml
version: '3.8'
services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=production
    healthcheck:
      test: ["CMD", "wget", "--spider", "http://localhost:8080/actuator/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:8080
    depends_on:
      - backend
```

#### Step 3: Build and Run
```bash
# Build the Spring Boot JAR first
./mvnw clean package -DskipTests

# Start with Docker Compose
docker-compose up --build
```

---

### Option 3: Cloud Platform Deployment

#### A. Deploy to Railway (Easiest)

1. **Push your code to GitHub**

2. **Deploy Backend:**
   - Go to [railway.app](https://railway.app)
   - Create new project → Deploy from GitHub
   - Select your repo
   - Railway auto-detects Spring Boot
   - Set environment variable: `SPRING_PROFILES_ACTIVE=production`

3. **Deploy Frontend:**
   - Add new service → Deploy from GitHub
   - Set root directory to `frontend`
   - Set build command: `npm run build`
   - Set start command: `npm start`
   - Add env: `NEXT_PUBLIC_API_URL=<your-backend-url>`

#### B. Deploy to Vercel (Frontend) + Railway/Render (Backend)

**Frontend on Vercel:**
```bash
cd frontend
npm i -g vercel
vercel
```

**Backend on Render:**
1. Go to [render.com](https://render.com)
2. Create new Web Service
3. Connect GitHub repo
4. Build command: `./mvnw clean package -DskipTests`
5. Start command: `java -jar target/chatterbox-0.0.1-SNAPSHOT.jar`

#### C. Deploy to AWS (Production-Grade)

**Backend on AWS Elastic Beanstalk:**
```bash
# Install EB CLI
pip install awsebcli

# Initialize and deploy
eb init -p java-17 chatterbox-backend
eb create chatterbox-env
eb deploy
```

**Frontend on AWS Amplify:**
1. Go to AWS Amplify Console
2. Connect your GitHub repo
3. Set app root to `frontend`
4. Deploy

---

### Option 4: Kubernetes Deployment (Enterprise)

You already have `k8s-deployment.yaml`. Here's how to use it:

```bash
# Build and push Docker images
docker build -t yourusername/chatterbox-backend:latest .
docker build -t yourusername/chatterbox-frontend:latest ./frontend
docker push yourusername/chatterbox-backend:latest
docker push yourusername/chatterbox-frontend:latest

# Deploy to Kubernetes
kubectl apply -f k8s-deployment.yaml
```

---

## 📝 Environment Configuration

### Backend (application-production.properties)
```properties
server.port=8080
spring.profiles.active=production
# Add your production database configs here
```

### Frontend Environment Variables
Create `frontend/.env.production`:
```
NEXT_PUBLIC_API_URL=https://your-backend-url.com
NEXT_PUBLIC_WS_URL=wss://your-backend-url.com/ws
```

---

## 🔧 Pre-Deployment Checklist

- [ ] Update CORS settings in `WebSecurityConfig.java` for production domains
- [ ] Set proper environment variables
- [ ] Build backend: `./mvnw clean package -DskipTests`
- [ ] Build frontend: `cd frontend && npm run build`
- [ ] Test WebSocket connections work in production
- [ ] Configure SSL/HTTPS for secure WebSocket (wss://)

---

## 🌐 Quick Start Commands

```bash
# Development
./start.sh

# Production with Docker
docker-compose up --build -d

# Build only
./mvnw clean package -DskipTests && cd frontend && npm run build
```

