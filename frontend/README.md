# ChatterBox Frontend - Next.js

Modern Next.js frontend for ChatterBox real-time chat application.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
cd frontend
npm install
```

### Running Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

**Note:** Make sure the backend server is running on `http://localhost:8080`

### Building for Production

```bash
npm run build
npm start
```

## 📁 Project Structure

```
frontend/
├── src/
│   ├── pages/
│   │   ├── index.tsx        # Login page (/)
│   │   ├── chat.tsx         # Chat room (/chat)
│   │   ├── _app.tsx         # App wrapper
│   │   └── _document.tsx    # HTML document
│   ├── services/
│   │   └── websocket.ts     # WebSocket service
│   └── styles/
│       └── globals.css      # Global styles
├── public/                  # Static assets
├── package.json
└── next.config.js
```

## 🎨 Features

- ✅ Page-based routing with Next.js
- ✅ TypeScript for type safety
- ✅ Tailwind CSS for styling
- ✅ Dark mode support
- ✅ Real-time WebSocket chat
- ✅ File sharing (images)
- ✅ Typing indicators
- ✅ Responsive design

## 🔧 Environment Variables

Create `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_WS_URL=http://localhost:8080/ws
```

## 📦 Tech Stack

- **Framework:** Next.js 14
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **WebSocket:** SockJS + STOMP
- **Icons:** Lucide React

## 🌐 Routes

- `/` - Login page (enter username)
- `/chat?username=<name>` - Chat room
