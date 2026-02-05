# Render + Vercel Deployment Guide for ChatterBox

## Backend Deployment (Render)

### Step 1: Prepare Backend for Production

Your backend is already configured. Ensure you have:
- ✅ `application.properties` - Default configuration
- ✅ `application-production.properties` - Production-specific settings
- ✅ `application-local.properties` - Local development with MongoDB Atlas
- ✅ `WebSecurityConfig.java` - CORS configuration with environment variable support

### Step 2: Deploy on Render

1. **Connect GitHub Repository**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

2. **Configure Build & Deploy Settings**
   - **Build Command**: `./mvnw clean package`
   - **Start Command**: `java -jar target/*.jar`
   - **Runtime**: Java 17

3. **Set Environment Variables** (in Render Dashboard → Environment)

   **Required:**
   ```
   SPRING_PROFILES_ACTIVE=production
   SPRING_DATA_MONGODB_URI=mongodb+srv://username:password@cluster.xyz.mongodb.net/?appName=Cluster0
   ```

   **Optional:**
   ```
   CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app
   PORT=8080 (Usually auto-set by Render)
   ```

4. **Create MongoDB Atlas Database**
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a free cluster
   - Create a database user
   - Get connection string and use as `SPRING_DATA_MONGODB_URI`

5. **Deploy**
   - Click "Create Web Service"
   - Render will automatically deploy on git push

### Step 3: Get Your Backend URL
After deployment, you'll get a URL like: `https://chatterbox-backend.onrender.com`

---

## Frontend Deployment (Vercel)

### Step 1: Configure Frontend Environment

1. **Create `frontend/.env.local` for local testing:**
   ```
   NEXT_PUBLIC_WS_URL=http://localhost:8080/ws
   ```

2. **Update for Render backend:**
   ```
   NEXT_PUBLIC_WS_URL=https://chatterbox-backend.onrender.com/ws
   ```

### Step 2: Deploy on Vercel

1. **Connect GitHub Repository**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New" → "Project"
   - Import your GitHub repository

2. **Configure Project**
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./frontend`

3. **Set Environment Variables** (Vercel Dashboard → Settings → Environment Variables)
   ```
   NEXT_PUBLIC_WS_URL=https://chatterbox-backend.onrender.com/ws
   ```

4. **Deploy**
   - Click "Deploy"
   - Vercel will automatically deploy on git push

### Step 3: Get Your Frontend URL
After deployment, you'll get a URL like: `https://chatterbox.vercel.app`

---

## Post-Deployment Checklist

- [ ] Backend deployed on Render
- [ ] MongoDB Atlas configured with connection string
- [ ] Frontend deployed on Vercel
- [ ] `CORS_ALLOWED_ORIGINS` on Render set to your Vercel URL
- [ ] `NEXT_PUBLIC_WS_URL` on Vercel set to your Render backend URL
- [ ] Test chat functionality in production
- [ ] Monitor logs for errors

### Testing Connection

1. Open your Vercel frontend URL in browser
2. Enter a username and start chatting
3. Check browser console for WebSocket connection logs
4. If connection fails, check:
   - Backend is running on Render
   - `NEXT_PUBLIC_WS_URL` is correct in frontend
   - CORS is properly configured on backend

---

## Troubleshooting

### "WebSocket connection refused"
- Check if Render backend is running
- Verify `NEXT_PUBLIC_WS_URL` is correct
- Check browser console for HTTPS/HTTP mixing errors

### "CORS error"
- Verify `CORS_ALLOWED_ORIGINS` includes your Vercel domain
- Restart Render service after changing environment variables

### "MongoDB connection error"
- Check `SPRING_DATA_MONGODB_URI` is correct
- Verify MongoDB Atlas IP whitelist includes Render IPs (set to 0.0.0.0/0 for open access)

### "Application fails to start"
- Check Render logs: Dashboard → Your Service → Logs
- Verify all required environment variables are set
- Check Java version is 17+

---

## Environment Variable Reference

### Backend (Render)
| Variable | Required | Example |
|----------|----------|---------|
| `SPRING_PROFILES_ACTIVE` | Yes | `production` |
| `SPRING_DATA_MONGODB_URI` | Yes | `mongodb+srv://user:pass@cluster0.xyz...` |
| `CORS_ALLOWED_ORIGINS` | No | `https://your-frontend.vercel.app` |
| `PORT` | No | `8080` |

### Frontend (Vercel)
| Variable | Required | Example |
|----------|----------|---------|
| `NEXT_PUBLIC_WS_URL` | Yes | `https://your-backend.onrender.com/ws` |

---

## Important Notes

1. **HTTPS Requirement**: Production Vercel site (HTTPS) can only connect to HTTPS WebSocket servers. Render provides HTTPS by default.

2. **WebSocket Configuration**: Frontend is already configured to handle WebSocket connections with SockJS and STOMP protocol.

3. **Development vs Production**:
   - Local: Use `http://localhost:8080/ws`
   - Production: Use `https://your-render-domain/ws`

4. **MongoDB Atlas Free Tier**: Includes 512MB storage - sufficient for testing.

5. **Render Free Tier**: Services spin down after 15 minutes of inactivity. Upgrade to paid for always-on service.

