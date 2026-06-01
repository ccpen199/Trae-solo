#!/bin/bash
cd "$(dirname "$0")"

echo "Starting ESG Assessment System..."

# Start backend
echo "Starting backend..."
cd backend
npm start < /dev/null > ../backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

cd ..

# Wait for backend
sleep 3

# Start frontend
echo "Starting frontend..."
cd frontend
npm run dev < /dev/null > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

cd ..

# Wait and verify
sleep 6

echo ""
echo "========================================"
echo "Service Status:"
echo "========================================"

# Check backend
if lsof -nP -iTCP:56896 -sTCP:LISTEN > /dev/null 2>&1; then
    echo "✅ Backend:  http://127.0.0.1:56896"
else
    echo "❌ Backend:  FAILED"
fi

# Check frontend
if lsof -nP -iTCP:46896 -sTCP:LISTEN > /dev/null 2>&1; then
    echo "✅ Frontend: http://127.0.0.1:46896"
else
    echo "❌ Frontend: FAILED"
fi

echo "========================================"
