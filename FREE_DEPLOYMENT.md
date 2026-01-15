# 🆓 Free Deployment Guide for ChatterBox

Deploy your app for FREE with free subdomains (no domain purchase needed!)

---

## ⚠️ Important Note

You need to deploy **Backend** and **Frontend** as **2 separate services** because:
- Backend = Java/Spring Boot (needs Java runtime)
- Frontend = Next.js (needs Node.js runtime)

**Recommended**: Use **Render.com** for both - same platform, 2 services, 100% free!

---

## 🚀 Option 1: Render for BOTH (Easiest - Recommended)

### Step 1: Push to GitHub
```bash
# If not already a git repo
git init
git add .
git commit -m "Initial commit"

# Create repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/ChatterBox.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy Backend on Render

1. Go to [render.com](https://render.com) and sign up (free)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account and select your repo
4. Configure:
   - **Name**: `chatterbox-backend`
   - **Region**: Choose nearest to you
   - **Branch**: `main`
   - **Root Directory**: (leave empty)
   - **Runtime**: `Java`
   - **Build Command**: `./mvnw clean package -DskipTests`
   - **Start Command**: `java -jar target/chatterbox-0.0.1-SNAPSHOT.jar`
5. Select **Free** plan
6. Click **"Create Web Service"**

📝 **Your backend URL will be**: `https://chatterbox-backend.onrender.com`

### Step 3: Deploy Frontend on Render

1. Click **"New +"** → **"Web Service"**
2. Select same repo
3. Configure:
   - **Name**: `chatterbox-frontend`
   - **Root Directory**: `frontend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. Add **Environment Variable**:
   - `NEXT_PUBLIC_API_URL` = `https://chatterbox-backend.onrender.com`
   - `NEXT_PUBLIC_WS_URL` = `wss://chatterbox-backend.onrender.com/ws`
5. Select **Free** plan
6. Click **"Create Web Service"**

📝 **Your frontend URL will be**: `https://chatterbox-frontend.onrender.com`

---

## 🚀 Option 2: Vercel (Frontend) + Render (Backend)

### Backend: Deploy on Render (same as above)

### Frontend: Deploy on Vercel (faster)

1. Go to [vercel.com](https://vercel.com) and sign up with GitHub
2. Click **"Add New Project"**
3. Import your GitHub repo
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
5. Add **Environment Variables**:
   - `NEXT_PUBLIC_API_URL` = `https://chatterbox-backend.onrender.com`
   - `NEXT_PUBLIC_WS_URL` = `wss://chatterbox-backend.onrender.com/ws`
6. Click **"Deploy"**

📝 **Your frontend URL will be**: `https://chatterbox.vercel.app`

---

## 🚀 Option 3: Railway (Simple but limited free tier)

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click **"New Project"** → **"Deploy from GitHub repo"**
4. Select your repo
5. Railway auto-detects Spring Boot and deploys!
6. Add another service for frontend (set root to `frontend`)

📝 **URLs will be**: `https://your-app.up.railway.app`

---

## ⚠️ Important: Update CORS Settings

Before deploying, update your backend to allow your free domains:

Edit `src/main/java/com/example/ChatBot/config/WebSecurityConfig.java`:

```java
@Override
public void addCorsMappings(@NonNull CorsRegistry registry) {
    registry.addMapping("/**")
            .allowedOriginPatterns(
                "http://localhost:3000",
                "https://*.onrender.com",
                "https://*.vercel.app",
                "https://*.railway.app"
            )
            .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
            .allowedHeaders("*")
            .allowCredentials(true)
            .maxAge(3600);
}
```

---

## 📋 Quick Checklist

- [ ] Push code to GitHub
- [ ] Update CORS settings for production domains
- [ ] Deploy backend first (get the URL)
- [ ] Deploy frontend with backend URL as environment variable
- [ ] Test the application!

---

## 🎉 Free Hosting Comparison

| Platform | Backend | Frontend | Free Subdomain | Limits |
|----------|---------|----------|----------------|--------|
| **Render** | ✅ | ✅ | `*.onrender.com` | Sleeps after 15min inactive |
| **Vercel** | ❌ | ✅ | `*.vercel.app` | Frontend only |
| **Railway** | ✅ | ✅ | `*.railway.app` | $5/month credit |
| **Fly.io** | ✅ | ✅ | `*.fly.dev` | 3 free VMs |

---

## 🐌 Note About Free Tier

Free services on Render "sleep" after 15 minutes of inactivity. First request after sleep takes ~30 seconds to wake up. This is normal for free tier!

---

## 🔗 Your Final URLs (Example)

After deployment:
- **Frontend**: `https://chatterbox-frontend.onrender.com`
- **Backend**: `https://chatterbox-backend.onrender.com`
- **WebSocket**: `wss://chatterbox-backend.onrender.com/ws`

Share the frontend URL with friends to chat! 🎉

