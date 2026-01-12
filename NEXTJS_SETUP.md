# 🚀 ChatterBox - Next.js Frontend Setup

Your ChatterBox application has been converted to use **Next.js** for the frontend!

## 📁 Project Structure

```
ChatterBox/
├── frontend/              # ✨ NEW Next.js Frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── index.tsx       # Login page (/)
│   │   │   ├── chat.tsx        # Chat room (/chat)
│   │   │   ├── _app.tsx
│   │   │   └── _document.tsx
│   │   ├── services/
│   │   │   └── websocket.ts    # WebSocket connection
│   │   └── styles/
│   │       └── globals.css
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── next.config.js
│
└── src/                   # Backend (Spring Boot)
    └── main/java/...
```

## 🎯 What Changed

### ✅ Added
- ✨ **Next.js 14** with TypeScript
- 📄 **Page-based routing** (`/` and `/chat`)
- 🎨 **Tailwind CSS** for styling
- 🌓 **Dark mode** with persistence
- 🔌 **WebSocket service** class
- 📦 **Modern React components**

### ❌ Removed
- ❌ Old `index.html` (single file frontend)
- ❌ Empty `javascript/` folder

### 🔧 Updated
- ✅ Backend CORS to allow `localhost:3000` (Next.js dev server)
- ✅ WebSocket config with allowed origins

## 🚀 How to Run

### Step 1: Start Backend (Spring Boot)

```bash
# Terminal 1 - In project root
./mvnw spring-boot:run
```

Backend will run on: **http://localhost:8080**

### Step 2: Install Frontend Dependencies

```bash
# Terminal 2 - Only first time
cd frontend
npm install
```

### Step 3: Start Frontend (Next.js)

```bash
# In frontend directory
npm run dev
```

Frontend will run on: **http://localhost:3000**

### Step 4: Open in Browser

```
http://localhost:3000
```

## 🌐 Routes

| Route | Description |
|-------|-------------|
| `/` | Login page - Enter username |
| `/chat?username=YourName` | Chat room (automatically redirected after login) |

## ✨ Features

### Login Page (`/`)
- Enter username
- Form validation (2-50 characters)
- Responsive design
- Dark mode toggle

### Chat Page (`/chat`)
- Real-time messaging
- File sharing (images up to 5MB)
- Typing indicators
- User avatars with colors
- Message timestamps
- Dark mode support
- Back to login button
- Auto-scroll to latest messages

## 🎨 Tech Stack

**Frontend:**
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- SockJS + STOMP
- Lucide Icons

**Backend:**
- Spring Boot 2.7.18
- WebSocket/STOMP
- Java 17

## 🔧 Configuration

### Environment Variables (Optional)

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_WS_URL=http://localhost:8080/ws
```

Default values are already set in `next.config.js`.

## 📦 Building for Production

### Build Frontend

```bash
cd frontend
npm run build
npm start
```

Frontend will run on port 3000 in production mode.

### Build Backend

```bash
./mvnw clean package
java -jar target/chatterbox-0.0.1-SNAPSHOT.jar
```

## 🐳 Docker (Optional)

You can containerize the Next.js frontend:

```bash
cd frontend

# Create Dockerfile
cat > Dockerfile << 'EOF'
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
EOF

# Build and run
docker build -t chatterbox-frontend .
docker run -p 3000:3000 chatterbox-frontend
```

## 🧪 Testing

### Test Manually

1. Open **3-4 browser tabs** at `http://localhost:3000`
2. Enter **different usernames** in each
3. Send messages and see them appear in all tabs
4. Try file upload, typing indicators, dark mode

### Check Connection

- Backend logs: Watch terminal running Spring Boot
- Frontend logs: Check browser console (F12)
- WebSocket: Should connect automatically on chat page

## 🛠️ Development

### Hot Reload

Both frontend and backend support hot reload:
- **Next.js**: Automatically reloads on file changes
- **Spring Boot**: DevTools reloads on Java file changes

### Customization

**Change colors:**
Edit `frontend/tailwind.config.js`

**Add features:**
Edit `frontend/src/pages/chat.tsx`

**Modify API:**
Edit `frontend/src/services/websocket.ts`

## ⚠️ Troubleshooting

### Port Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

### CORS Errors

- Make sure backend is running on port 8080
- Check `WebSecurityConfig.java` allows `localhost:3000`

### WebSocket Connection Failed

- Verify backend is running
- Check browser console for errors
- Ensure `NEXT_PUBLIC_WS_URL` is correct

### Cannot Connect to Backend

- Backend must be running first
- Check firewall settings
- Try `http://127.0.0.1:8080` instead of `localhost`

## 📝 Next Steps

1. **Styling**: Customize colors in `tailwind.config.js`
2. **Features**: Add emoji picker, private messages, rooms
3. **Auth**: Add user authentication
4. **Database**: Store message history
5. **Deploy**: Deploy to Vercel (frontend) + Cloud (backend)

## 🎉 You're All Set!

Your ChatterBox now has a modern Next.js frontend with:
- ✅ TypeScript type safety
- ✅ Page-based routing
- ✅ Component reusability
- ✅ Better performance
- ✅ SEO ready
- ✅ Production ready

**Happy Chatting! 💬**
