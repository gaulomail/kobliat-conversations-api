# Start Kobliat Infrastructure Services (Windows PowerShell)

Write-Host "🚀 Starting Kobliat Infrastructure Services..."
Write-Host "============================================="

# Configuration
# Please update KAFKA_HOME to point to your Kafka installation or set env var KAFKA_HOME
if ($env:KAFKA_HOME) { 
    $KAFKA_HOME = $env:KAFKA_HOME 
} else {
    $KAFKA_HOME = "C:\kafka" 
}

$ZOOKEEPER_CONF = "$KAFKA_HOME\config\zookeeper.properties"
$KAFKA_CONF = "$KAFKA_HOME\config\server.properties"
$MINIO_DATA = "$PSScriptRoot\..\..\minio-data"

# Check Kafka Configs
if (-not (Test-Path $ZOOKEEPER_CONF)) {
    Write-Warning "⚠️  Zookeeper config not found at $ZOOKEEPER_CONF"
    Write-Warning "   Please set KAFKA_HOME environment variable or edit this script."
}

# Zookeeper
Write-Host "Starting Zookeeper..."
Start-Process cmd -ArgumentList "/k title Zookeeper && zookeeper-server-start.bat $ZOOKEEPER_CONF"

# Kafka
Write-Host "Starting Kafka..."
Start-Process cmd -ArgumentList "/k title Kafka && kafka-server-start.bat $KAFKA_CONF"
Start-Sleep -Seconds 5

# MinIO
Write-Host "Starting MinIO..."
if (-not (Get-Command minio -ErrorAction SilentlyContinue)) {
    Write-Warning "⚠️  MinIO executable 'minio' not found in PATH."
} else {
    New-Item -ItemType Directory -Force -Path $MINIO_DATA | Out-Null
    Start-Process cmd -ArgumentList "/k title MinIO && minio server $MINIO_DATA --console-address :9001"
}

# Configure MinIO (Wait a bit)
# Start-Sleep -Seconds 5
# mc alias set local http://localhost:9000 minio minio123

Write-Host ""
Write-Host "✅ Services launched in separate windows."
Write-Host "Service URLs:"
Write-Host "  - Kafka: localhost:9092"
Write-Host "  - MinIO Console: http://localhost:9001"
Write-Host "  - PostgreSQL: localhost:5432 (Managed by Windows Service)"
Write-Host ""
Write-Host "To stop services, close the opened windows."
