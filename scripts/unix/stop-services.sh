#!/bin/bash
set -e

echo "🛑 Stopping Kobliat services..."
echo ""

# Function to stop a service by PID file
stop_service() {
    local service_name=$1
    local pid_file="logs/${service_name}.pid"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p $pid > /dev/null 2>&1; then
            echo "Stopping $service_name (PID: $pid)..."
            kill $pid
            rm "$pid_file"
            echo "✅ $service_name stopped"
        else
            echo "⚠️  $service_name process not found"
            rm "$pid_file"
        fi
    else
        echo "⚠️  No PID file found for $service_name"
    fi
}

# Stop services in reverse order
stop_service "clamav"
stop_service "minio"
stop_service "kafka"
stop_service "zookeeper"

echo ""
echo "✅ All services stopped"
