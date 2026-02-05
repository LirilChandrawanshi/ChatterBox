# Environment Variables Configuration Reference

## Backend (Render)

### Required Variables

```bash
# Spring Boot Profile (use 'production' for Render)
SPRING_PROFILES_ACTIVE=production

# MongoDB Connection String (from MongoDB Atlas)
# Format: mongodb+srv://username:password@cluster-name.xxxxx.mongodb.net/?appName=ClusterName
SPRING_DATA_MONGODB_URI=mongodb+srv://liril625_db_user:NRCXvUuWi7GiNKdj@cluster0.iky5ejj.mongodb.net/?appName=Cluster0
```

### Optional Variables

```bash
# CORS Allowed Origins (set to your Vercel frontend URL)
# Default: allows localhost, vercel.app, onrender.com, railway.app, netlify.app
CORS_ALLOWED_ORIGINS=https://chatterbox.vercel.app,https://*.vercel.app

# Server Port (Render sets this automatically, usually 8080)
PORT=8080
```

---

## Frontend (Vercel)

### Required Variables

```bash
# WebSocket URL pointing to your Render backend
# IMPORTANT: Must use HTTPS in production (Vercel uses HTTPS)
NEXT_PUBLIC_WS_URL=https://chatterbox-backend.onrender.com/ws
```

### For Local Development

Create `frontend/.env.local` (not committed to git):
```bash
# Local development uses HTTP
NEXT_PUBLIC_WS_URL=http://localhost:8080/ws
```

---

## How to Set on Each Platform

### Render (Backend)

1. Log in to https://dashboard.render.com
2. Select your service (e.g., "chatterbox-backend")
3. Click "Environment" tab
4. Click "Add Environment Variable"
5. Enter each variable one by one:
   - Key: `SPRING_PROFILES_ACTIVE`
   - Value: `production`
6. Click "Add"
7. Repeat for `SPRING_DATA_MONGODB_URI` and `CORS_ALLOWED_ORIGINS`
8. Render automatically redeploys when variables are saved

### Vercel (Frontend)

1. Log in to https://vercel.com/dashboard
2. Select your project
3. Click "Settings" tab
4. Select "Environment Variables"
5. Add `NEXT_PUBLIC_WS_URL`
6. Redeploy from "Deployments" tab for changes to take effect

---

## Variable Breakdown

### SPRING_PROFILES_ACTIVE

- **What it does**: Tells Spring Boot which configuration file to use
- **Values**: 
  - `local` - Uses `application-local.properties` (development)
  - `production` - Uses `application-production.properties` (Render)
- **Default**: `local`
- **Set on**: Render (backend)

### SPRING_DATA_MONGODB_URI

- **What it does**: MongoDB connection string
- **Format**: `mongodb+srv://username:password@host/database`
- **Get it from**: MongoDB Atlas → Cluster → Connect → Connection String
- **Set on**: Render (backend)
- **Security**: Never put this in code, always use environment variable

### CORS_ALLOWED_ORIGINS

- **What it does**: Allows your frontend to communicate with backend (prevents CORS errors)
- **Value**: Your Vercel frontend URL (e.g., `https://chatterbox.vercel.app`)
- **Can include**: Multiple URLs separated by commas
- **Set on**: Render (backend)
- **If not set**: Uses default patterns that include Vercel

### NEXT_PUBLIC_WS_URL

- **What it does**: Tells frontend where the WebSocket server is
- **Format**: `https://your-render-backend.onrender.com/ws` (production)
- **Production requirement**: Must use `https://` (not `http://`)
- **Local development**: Can use `http://localhost:8080/ws`
- **Set on**: Vercel (frontend)
- **Important**: Must start with `NEXT_PUBLIC_` to be available in browser

---

## MongoDB Atlas Connection String Explained

Example: `mongodb+srv://liril625_db_user:NRCXvUuWi7GiNKdj@cluster0.iky5ejj.mongodb.net/?appName=Cluster0`

- `mongodb+srv://` - Protocol (secure connection)
- `liril625_db_user` - Database username
- `:` - Separator
- `NRCXvUuWi7GiNKdj` - Database password
- `@` - Separator
- `cluster0.iky5ejj.mongodb.net` - MongoDB server address
- `/?appName=Cluster0` - Query parameter

---

## Variable Validation Checklist

Before deploying, verify:

- [ ] `SPRING_PROFILES_ACTIVE` = `production` (exactly)
- [ ] `SPRING_DATA_MONGODB_URI` starts with `mongodb+srv://`
- [ ] MongoDB password is URL-encoded (if it contains special characters)
- [ ] `CORS_ALLOWED_ORIGINS` includes your exact Vercel domain
- [ ] `NEXT_PUBLIC_WS_URL` uses `https://` for production
- [ ] `NEXT_PUBLIC_WS_URL` ends with `/ws`
- [ ] All URLs use HTTPS (not HTTP) in production
- [ ] No extra spaces or quotes in values

---

## Troubleshooting Variable Issues

### Backend won't start
- ❌ Check all required variables are set
- ❌ Verify `SPRING_DATA_MONGODB_URI` is complete
- ✅ Check Render logs: Dashboard → Logs tab

### WebSocket connection fails
- ❌ Verify `NEXT_PUBLIC_WS_URL` is correct
- ❌ Ensure it includes the `/ws` path
- ❌ Use HTTPS in production (not HTTP)
- ✅ Check browser console for error details

### CORS error
- ❌ Verify `CORS_ALLOWED_ORIGINS` includes your frontend domain
- ❌ No extra spaces in domain name
- ✅ Restart Render service after changing variable

### Can't connect to MongoDB
- ❌ Verify MongoDB Atlas IP whitelist (should be 0.0.0.0/0 or include Render IPs)
- ❌ Check username and password are correct
- ❌ Verify cluster name in connection string
- ✅ Test connection locally first

