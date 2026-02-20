#!/bin/bash

# Ensure we are in the project root
cd "$(dirname "$0")"

echo "🚀 Starting Full Work Station Environment..."

# 1. Check Python Requirements
echo "📦 Installing Python dependencies..."
pip install -r python_pipeline/requirements.txt || echo "⚠️ Python dependencies failed to install (check manually if needed)"

# 2. Check Node Requirements
echo "📦 Installing Node dependencies..."
npm install

# 3. Start Backend Server (Background)
echo "🌐 Starting Backend Server (Port 3001)..."
node server.js > server.log 2>&1 &
SERVER_PID=$!
echo "✅ Backend running with PID $SERVER_PID"

# 4. Start Frontend (Background)
echo "💻 Starting Frontend Editor..."
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!
echo "✅ Frontend running with PID $FRONTEND_PID"

echo "---------------------------------------------------"
echo "🎉 Work Station Ready!"
echo "👉 Access Editor: http://localhost:5173"
echo "👉 Backend API:   http://localhost:3001"
echo "---------------------------------------------------"
echo "Press CTRL+C to stop all services."

# Trap CTRL+C to kill background processes
trap "kill $SERVER_PID $FRONTEND_PID; exit" INT

# Keep script running to maintain processes
wait
