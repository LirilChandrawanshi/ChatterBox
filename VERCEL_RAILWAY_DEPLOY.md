# Deploy ChatterBox: Vercel (Frontend) + Railway (Backend)

This checklist gets the app live with **frontend on Vercel** and **backend on Railway**.

---

## Prerequisites

- [ ] Code pushed to **GitHub**
- [ ] **MongoDB** for production (e.g. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) free tier)
- [ ] Accounts: [Vercel](https://vercel.com), [Railway](https://railway.app)

---

## 1. Deploy backend on Railway

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**.
2. Select this repo. Railway will create **one service** from the repo root (backend).
3. **Root Directory**: leave **empty** (backend is at repo root).
4. Build/start are read from **`railway.toml`** in the repo:
   - Build: `./mvnw clean package -DskipTests`
   - Start: `java -jar target/chatterbox-0.0.1-SNAPSHOT.jar`
5. In the service → **Variables**, add:
   - `SPRING_PROFILES_ACTIVE` = `production`
   - `SPRING_DATA_MONGODB_URI` = your MongoDB connection string (e.g. from Atlas)
6. Deploy. When it’s up, open **Settings** → **Networking** → **Generate Domain** and copy the URL, e.g. `https://chatterbox-production-xxxx.up.railway.app`.

**Backend URL** (save it): `https://chatterbox-production-b299.up.railway.app`  
**WebSocket URL**: `wss://chatterbox-production-b299.up.railway.app/ws`

---

## 2. Deploy frontend on Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project** → import this GitHub repo.
2. **Root Directory**: set to **`frontend`** (required for monorepo).
3. **Framework Preset**: Next.js (auto-detected).
4. **Environment variables** (Project Settings → Environment Variables):
   - `NEXT_PUBLIC_API_URL` = `https://chatterbox-production-b299.up.railway.app`
   - `NEXT_PUBLIC_WS_URL` = `wss://chatterbox-production-b299.up.railway.app/ws`
5. Deploy. Your app will be at e.g. `https://your-project.vercel.app`.

---

## 3. Verify

- [ ] Open the Vercel URL and join the chat with a username.
- [ ] Open the same URL in another tab/browser and send messages; they should appear in both.
- [ ] Check browser console for WebSocket errors; there should be none.

---

## Project config summary

| Item | Location | Purpose |
|------|----------|--------|
| Backend port | `application.properties` / `application-production.properties` | Uses `PORT` from Railway (fallback 8080) |
| CORS | `WebSecurityConfig.java` | Allows `*.vercel.app` and `*.railway.app` |
| Railway | `railway.toml` | Build and start commands for backend |
| Vercel | `vercel.json` (root) | Next.js build; set **Root Directory** to `frontend` in dashboard |

---

## Troubleshooting

- **Backend won’t start on Railway**  
  Ensure `SPRING_DATA_MONGODB_URI` is set and valid. Check logs in Railway.

- **Frontend can’t reach backend**  
  Confirm `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_WS_URL` use the **exact** Railway URL (https / wss, no trailing slash except path).

- **WebSocket fails (CORS / mixed content)**  
  Use `https` and `wss` in production. CORS already allows `*.vercel.app` and `*.railway.app` in `WebSecurityConfig.java`.

- **Build fails on Vercel**  
  Ensure **Root Directory** is `frontend` so `package.json` and `next.config.js` are used.
