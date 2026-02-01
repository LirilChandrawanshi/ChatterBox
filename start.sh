#!/bin/bash

# ChatterBox - Start Script
# Starts both Backend (Spring Boot) and Frontend (Next.js)

echo "🚀 Starting ChatterBox Application..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Load environment variables from .env if it exists
if [ -f ".env" ]; then
    echo -e "${BLUE}📋 Loading environment variables from .env${NC}"
    export $(grep -v '^#' .env | xargs)
fi

# Check if frontend dependencies are installed
if [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
    cd frontend
    npm install
    cd ..
    echo ""
fi

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Shutting down ChatterBox...${NC}"
    kill $(jobs -p) 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM

# Start Backend (Spring Boot)
echo -e "${BLUE}🔧 Starting Backend (Spring Boot) on port 8080...${NC}"
./mvnw spring-boot:run > backend.log 2>&1 &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 3

# Start Frontend (Next.js)
echo -e "${GREEN}🎨 Starting Frontend (Next.js) on port 3000...${NC}"
cd frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

echo ""
echo -e "${GREEN}✅ ChatterBox is starting!${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "  Backend:  ${BLUE}http://localhost:8080${NC}"
echo -e "  Frontend: ${GREEN}http://localhost:3000${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 Open your browser at: http://localhost:3000"
echo "📝 Logs: backend.log and frontend.log"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop both services${NC}"
echo ""

# Wait for both processes
wait
