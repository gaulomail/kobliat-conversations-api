#!/bin/bash
# stop-services.sh - robustly stop all Kobliat processes

echo "🛑 Stopping Kobliat Services..."
echo "────────────────────────────────────────────────────────────────"

# 1. Stop Application Services by Port
PORTS=(8000 8001 8002 8003 8004 8005 8006 5173 5174)

echo "🔍 Checking application ports..."
for PORT in "${PORTS[@]}"; do
  # Find PID using lsof (standard on macOS/Unix)
  PID=$(lsof -ti :$PORT 2>/dev/null)
  
  if [ ! -z "$PID" ]; then
    echo "   killing process on port $PORT (PID: $PID)..."
    kill -9 $PID 2>/dev/null || true
  fi
done

# 2. Kill "concurrently" if running (heuristic)
# This cleans up the parent runner if it's detached
echo "🔍 Cleaning up runners..."
pkill -f "concurrently" || true
pkill -f "artisan serve" || true

# 3. Stop Infrastructure (Legacy PID check)
# In case they were started via setup-local.sh backgrounding
echo "🔍 Checking infrastructure..."

stop_pid_service() {
    local service_name=$1
    local pid_file="logs/${service_name}.pid"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p $pid > /dev/null 2>&1; then
            echo "   Stopping $service_name (PID: $pid)..."
            kill $pid 2>/dev/null || true
            rm "$pid_file"
        else
            rm "$pid_file"
        fi
    fi
}

stop_pid_service "clamav"
stop_pid_service "minio"
stop_pid_service "kafka"
stop_pid_service "zookeeper"

echo ""
echo "✅ All services stopped."
