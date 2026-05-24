#!/bin/bash

# Terminate background processes on exit
trap "kill 0" EXIT

echo "Starting Backend FastAPI server..."
cd backend
source venv/bin/activate
uvicorn main:app --host 127.0.0.1 --port 8005 --reload &
BACKEND_PID=$!
cd ..

echo "Starting Frontend React server..."
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

# Keep the script running
wait
