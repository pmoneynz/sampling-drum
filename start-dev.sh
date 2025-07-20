#!/bin/bash

# YouTube Cue Point Player - Development Startup Script

echo "🎥 Starting YouTube Cue Point Player in Development Mode"
echo "========================================================="

# Check if yt-dlp is installed
if ! command -v yt-dlp &> /dev/null; then
    echo "❌ yt-dlp is not installed or not in PATH"
    echo "Please install it with: pip install yt-dlp --break-system-packages"
    echo "Or follow the backend setup instructions in backend/README.md"
    exit 1
fi

echo "✅ yt-dlp found"

# Check if Node.js dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

echo "🚀 Starting services..."

# Function to cleanup background processes
cleanup() {
    echo "🛑 Shutting down services..."
    kill $(jobs -p) 2>/dev/null
    exit
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM EXIT

# Start backend server
echo "🔧 Starting backend server on port 3001..."
cd backend && npm run dev &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend development server
echo "🎨 Starting frontend development server..."
cd .. && npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Services started successfully!"
echo "📱 Frontend: http://localhost:5173"
echo "🔧 Backend:  http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for any background job to finish
wait