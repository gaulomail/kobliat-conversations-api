#!/bin/bash

# Service Control Script
# This script manages individual microservices

SERVICE_DIR="services"
PID_DIR=".pids"

# Create PID directory if it doesn't exist
mkdir -p "$PID_DIR"

# Function to get service port
get_port() {
    case $1 in
        "api-gateway") echo "8000" ;;
        "customer-service") echo "8001" ;;
        "conversation-service") echo "8002" ;;
        "messaging-service") echo "8003" ;;
        "media-service") echo "8004" ;;
        "inbound-gateway") echo "8005" ;;
        "chat-simulator") echo "8006" ;;
        *) echo "" ;;
    esac
}

# Function to start a service
start_service() {
    local service=$1
    local port=$(get_port "$service")
    
    if [ -z "$port" ]; then
        echo "Unknown service: $service"
        exit 1
    fi
    
    # Check if already running
    if [ -f "$PID_DIR/$service.pid" ]; then
        local pid=$(cat "$PID_DIR/$service.pid")
        if ps -p $pid > /dev/null 2>&1; then
            echo "Service $service is already running (PID: $pid)"
            exit 0
        fi
    fi
    
    # Start the service
    cd "$SERVICE_DIR/$service"
    nohup php artisan serve --port=$port > "../../$PID_DIR/$service.log" 2>&1 &
    local pid=$!
    echo $pid > "../../$PID_DIR/$service.pid"
    cd ../..
    
    echo "Started $service on port $port (PID: $pid)"
}

# Function to stop a service
stop_service() {
    local service=$1
    local port=$(get_port "$service")
    
    # First, try to stop using PID file
    if [ -f "$PID_DIR/$service.pid" ]; then
        local pid=$(cat "$PID_DIR/$service.pid")
        
        if ps -p $pid > /dev/null 2>&1; then
            kill $pid
            rm "$PID_DIR/$service.pid"
            echo "Stopped $service (PID: $pid)"
            return 0
        else
            rm "$PID_DIR/$service.pid"
        fi
    fi
    
    # If no PID file or process not found, try to find by port
    if [ -n "$port" ]; then
        local pid=$(lsof -ti :$port 2>/dev/null)
        
        if [ -n "$pid" ]; then
            kill $pid
            echo "Stopped $service running on port $port (PID: $pid)"
            return 0
        fi
    fi
    
    # Last resort: find by process name
    local pid=$(ps aux | grep "php artisan serve --port=$port" | grep -v grep | awk '{print $2}' | head -1)
    
    if [ -n "$pid" ]; then
        kill $pid
        echo "Stopped $service (PID: $pid)"
        return 0
    fi
    
    echo "Service $service is not running"
    return 0
}

# Function to get service status
status_service() {
    local service=$1
    local port=$(get_port "$service")
    
    # First check PID file
    if [ -f "$PID_DIR/$service.pid" ]; then
        local pid=$(cat "$PID_DIR/$service.pid")
        
        if ps -p $pid > /dev/null 2>&1; then
            echo "running:$pid"
            return 0
        else
            # Clean up stale PID file
            rm "$PID_DIR/$service.pid"
        fi
    fi
    
    # Check if service is running on its port
    if [ -n "$port" ]; then
        local pid=$(lsof -ti :$port 2>/dev/null)
        
        if [ -n "$pid" ]; then
            echo "running:$pid"
            return 0
        fi
    fi
    
    echo "stopped"
    return 0
}

# Function to restart a service
restart_service() {
    local service=$1
    stop_service "$service"
    sleep 1
    start_service "$service"
}

# Main command handler
case $1 in
    start)
        start_service "$2"
        ;;
    stop)
        stop_service "$2"
        ;;
    restart)
        restart_service "$2"
        ;;
    status)
        status_service "$2"
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status} <service-name>"
        echo "Services: api-gateway, customer-service, conversation-service, messaging-service, media-service, inbound-gateway, chat-simulator"
        exit 1
        ;;
esac
