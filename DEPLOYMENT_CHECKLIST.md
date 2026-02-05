# ChatterBox Deployment Checklist

## Pre-Deployment

### Backend Preparation
- [ ] Verify Java version in pom.xml (should be 17)
- [ ] Run `./mvnw clean package` locally to test build
- [ ] Verify `application-production.properties` is configured
- [ ] Check that sensitive data is NOT in any properties files

### Frontend Preparation
- [ ] Run `npm run build` in frontend directory
- [ ] Verify `.env.local` has correct URLs
- [ ] Test WebSocket connection locally
- [ ] Remove any console.log statements (optional)

## Render Setup (Backend)

### Create MongoDB Atlas Database
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up/Login
3. Create Free Cluster
4. Create database user with password
5. Add IP address to whitelist (use 0.0.0.0/0 for open access)
6. Get connection string

### Deploy on Render
1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: chatterbox-backend (or your choice)
   - **Build Command**: `./mvnw clean package`
   - **Start Command**: `java -jar target/*.jar`
   - **Runtime**: Java 17
5. Add Environment Variables:
   - `SPRING_PROFILES_ACTIVE` = `production`
   - `SPRING_DATA_MONGODB_URI` = `your-mongodb-atlas-connection-string`
6. Click "Create Web Service"
7. Wait for deployment (3-5 minutes)
8. Copy the backend URL (e.g., https://chatterbox-backend.onrender.com)

## Vercel Setup (Frontend)

### Deploy on Vercel
1. Go to https://vercel.com
2. Sign up/Login
3. Import your GitHub repository
4. Configure:
   - **Framework**: Next.js (auto-detected)
   - **Root Directory**: `frontend`
5. Add Environment Variables:
   - `NEXT_PUBLIC_WS_URL` = `https://chatterbox-backend.onrender.com/ws`
6. Click "Deploy"
7. Wait for deployment (2-3 minutes)
8. Copy the frontend URL (e.g., https://chatterbox.vercel.app)

## Post-Deployment

### Update Backend CORS
1. Go to Render Dashboard → Your Backend Service
2. Go to Environment → Add/Update Variable:
   - `CORS_ALLOWED_ORIGINS` = `https://chatterbox.vercel.app`
3. Manual Deploy (Environment tab → Deploy)

### Verify Deployment
1. Open frontend URL in browser
2. Enter a username
3. Open DevTools → Console
4. Check for WebSocket connection messages
5. Send a message and verify it appears

### Monitor Logs
- **Backend (Render)**: Dashboard → Logs tab
- **Frontend (Vercel)**: Dashboard → Deployments → Logs tab

## Important URLs & Credentials

```
Backend Service URL: https://chatterbox-backend.onrender.com
Frontend URL: https://chatterbox.vercel.app
Backend WebSocket: https://chatterbox-backend.onrender.com/ws

MongoDB Atlas Cluster: (save your credentials securely)
```

## Quick Reference

### If Chat Not Working:
1. Check Render logs for errors
2. Verify `SPRING_PROFILES_ACTIVE=production` in Render
3. Verify `NEXT_PUBLIC_WS_URL` in Vercel matches your backend
4. Verify CORS is set correctly
5. Restart backend service on Render

### If Connection Timeout:
1. Render might have spun down (free tier)
2. Click in browser to wake it up
3. Or upgrade to Render paid tier

### To Make Changes:
1. Edit code locally
2. Push to GitHub
3. Render/Vercel will automatically redeploy
4. Takes 3-5 minutes typically

