# 🚀 Quick Start: Deploy ChatterBox to Render + Vercel

## 5-Minute Summary

### Prerequisites
- GitHub account
- Render account (free)
- Vercel account (free)
- MongoDB Atlas account (free)

---

## The 4 Steps

### 1️⃣ MongoDB Setup (3 min)
- Visit https://www.mongodb.com/cloud/atlas
- Create cluster → Create user → Whitelist IPs (0.0.0.0/0)
- Copy connection string: `mongodb+srv://user:pass@cluster.xyz...`

### 2️⃣ Deploy Backend on Render (5 min)
- Go to https://dashboard.render.com
- New → Web Service → Connect GitHub
- Name: `chatterbox-backend`
- Build: `./mvnw clean package`
- Start: `java -jar target/*.jar`
- Environment variables:
  ```
  SPRING_PROFILES_ACTIVE=production
  SPRING_DATA_MONGODB_URI=<paste your MongoDB string>
  ```
- Click Deploy → Wait 3-5 min
- Copy URL: `https://xxx.onrender.com`

### 3️⃣ Deploy Frontend on Vercel (5 min)
- Go to https://vercel.com
- Import GitHub repo
- Root Directory: `frontend`
- Environment variables:
  ```
  NEXT_PUBLIC_WS_URL=https://xxx.onrender.com/ws
  ```
- Click Deploy → Wait 2-3 min
- Copy URL: `https://xxx.vercel.app`

### 4️⃣ Add CORS on Render (2 min)
- Go to your Render backend → Environment
- Add: `CORS_ALLOWED_ORIGINS=https://xxx.vercel.app`
- Manual Deploy

---

## ✅ You're Live!
Open your Vercel URL and start chatting! 🎉

---

## Detailed Guides
- Full guide: `RENDER_VERCEL_DEPLOYMENT.md`
- Checklist: `DEPLOYMENT_CHECKLIST.md`

## Troubleshooting
- Check backend logs: Render → Logs
- Check frontend logs: Browser → DevTools → Console
- Common issues: See `RENDER_VERCEL_DEPLOYMENT.md` Troubleshooting section

