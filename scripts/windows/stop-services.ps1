# stop-services.ps1 - Robustly stop all Kobliat processes (Windows)
$ErrorActionPreference = "SilentlyContinue" # Don't error if process not found

Write-Host "🛑 Stopping Kobliat Services..."
Write-Host "────────────────────────────────────────────────────────────────"

# 1. Stop Application Services by Port
$Ports = @(8000, 8001, 8002, 8003, 8004, 8005, 8006, 5173, 5174)

Write-Host "🔍 Checking application ports..."
foreach ($port in $Ports) {
    # Get Process ID listening on port
    $connection = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if ($connection) {
        $pidTarget = $connection.OwningProcess
        Write-Host "   Killing process on port $port (PID: $pidTarget)..."
        Stop-Process -Id $pidTarget -Force -ErrorAction SilentlyContinue
    }
}

# 2. Kill "php" process running artisan serve? 
# This is risky on a developer machine as it might kill other PHPs.
# But ports should be enough.
# However, `concurrently` (Node) might keep running.
# Let's try to find Node processes that look like our parents.
# Hard to distinguish on Windows without WMI query matching command line.
# For now, ports is the safest and most effective method for the actual services.

# 3. Legacy PID file cleanup
Write-Host "🔍 Checking infrastructure..."

function Stop-PidService {
    param($serviceName)
    $pidFile = "logs\$serviceName.pid"
    if (Test-Path $pidFile) {
        $id = Get-Content $pidFile
        if (Get-Process -Id $id -ErrorAction SilentlyContinue) {
            Write-Host "   Stopping $serviceName (PID: $id)..."
            Stop-Process -Id $id -Force
        }
        Remove-Item $pidFile -Force
    }
}

Stop-PidService "clamav"
Stop-PidService "minio"
Stop-PidService "kafka"
Stop-PidService "zookeeper"

Write-Host ""
Write-Host "✅ All services stopped."
