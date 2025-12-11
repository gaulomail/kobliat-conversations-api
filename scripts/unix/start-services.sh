#!/bin/bash
set -e

echo "🚀 Starting Kobliat services..."
echo ""

# Start Zookeeper
echo "Starting Zookeeper..."
zookeeper-server-start /opt/homebrew/etc/kafka/zookeeper.properties > logs/zookeeper.log 2>&1 &
ZOOKEEPER_PID=$!
echo "✅ Zookeeper started (PID: $ZOOKEEPER_PID)"

# Wait for Zookeeper to be ready
sleep 3

# Start Kafka
echo "Starting Kafka..."
kafka-server-start /opt/homebrew/etc/kafka/server.properties > logs/kafka.log 2>&1 &
KAFKA_PID=$!
echo "✅ Kafka started (PID: $KAFKA_PID)"

# Wait for Kafka to be ready
sleep 5

# Start MinIO
echo "Starting MinIO..."
mkdir -p ~/.minio/data
minio server ~/.minio/data --console-address ":9001" > logs/minio.log 2>&1 &
MINIO_PID=$!
echo "✅ MinIO started (PID: $MINIO_PID)"

# Wait for MinIO to be ready
sleep 3

# Configure MinIO
echo "Configuring MinIO..."
mc alias set local http://localhost:9000 minio minio123 2>/dev/null || true
mc mb local/kobliat-media --ignore-existing 2>/dev/null || true
mc anonymous set download local/kobliat-media 2>/dev/null || true
echo "✅ MinIO configured"

# Start ClamAV daemon (optional)
if command -v clamd &> /dev/null; then
    echo "Starting ClamAV daemon..."
    clamd > logs/clamav.log 2>&1 &
    CLAMAV_PID=$!
    echo "✅ ClamAV started (PID: $CLAMAV_PID)"
fi

# Save PIDs to file for cleanup
echo $ZOOKEEPER_PID > logs/zookeeper.pid
echo $KAFKA_PID > logs/kafka.pid
echo $MINIO_PID > logs/minio.pid
[ ! -z "$CLAMAV_PID" ] && echo $CLAMAV_PID > logs/clamav.pid

echo ""
echo "=================================================================="
echo "✅ All services started!"
echo ""
echo "Service URLs:"
echo "  - Kafka: localhost:9092"
echo "  - MinIO Console: http://localhost:9001 (minio/minio123)"
echo "  - MinIO API: http://localhost:9000"
echo "  - PostgreSQL: localhost:5432"
echo ""
echo "To stop services, run: ./scripts/stop-services.sh"
echo "To view logs, check the logs/ directory"
echo ""
