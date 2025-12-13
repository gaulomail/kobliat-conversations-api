# setup.ps1 - Smart Setup Script for Kobliat Conversations Platform (Windows)
# Detects current state and only performs necessary actions.

$ErrorActionPreference = "Stop"

# Colors (simulated for PowerShell)
function Write-Green($text) { Write-Host $text -ForegroundColor Green }
function Write-Yellow($text) { Write-Host $text -ForegroundColor Yellow }
function Write-Red($text) { Write-Host $text -ForegroundColor Red }

Write-Host "╔════════════════════════════════════════════════════════════════╗"
Write-Host "║   Kobliat Smart Setup - Auto-Detection Mode (Windows)         ║"
Write-Host "╚════════════════════════════════════════════════════════════════╝"
Write-Host ""

$NEEDS_MIGRATIONS = $false
$NEEDS_DEPENDENCIES = $false
$SERVICES_RUNNING = $false

# -----------------------------------------------------------------------------
# 1. Environment Configuration
# -----------------------------------------------------------------------------
Write-Host "🔍 Checking Environment..."
if (Test-Path .env) {
    Write-Green "✅ .env file exists."
} else {
    Write-Yellow "⚠️  .env file missing."
    if (Test-Path .env.example) {
        Copy-Item .env.example .env
        Write-Green "✅ Created .env from .env.example"
        Write-Host "ℹ️  Please configure your database credentials in .env now."
        Read-Host "Press Enter to continue..."
    } else {
        Write-Red "❌ .env.example missing! Cannot proceed."
        exit 1
    }
}

# Load .env variables manually since we can't 'source' it easily
$envVars = @{}
Get-Content .env | ForEach-Object {
    if ($_ -match "^([^#=]+)=(.*)$") {
        $key = $Matches[1]
        $val = $Matches[2]
        $envVars[$key] = $val
    }
}

$DB_HOST = if ($envVars.containsKey("DB_HOST")) { $envVars["DB_HOST"] } else { "127.0.0.1" }
$DB_PORT = if ($envVars.containsKey("DB_PORT")) { $envVars["DB_PORT"] } else { "3306" }

# -----------------------------------------------------------------------------
# 2. Database Connectivity Check
# -----------------------------------------------------------------------------
Write-Host ""
Write-Host "🔍 Checking Database Connection ($DB_HOST:$DB_PORT)..."
$conn = Test-NetConnection -ComputerName $DB_HOST -Port $DB_PORT -WarningAction SilentlyContinue

if ($conn.TcpTestSucceeded) {
    Write-Green "✅ Database server is reachable."
} else {
    Write-Red "❌ Database server NOT detected at $DB_HOST:$DB_PORT."
    Write-Host "   Please ensure your MySQL/PostgreSQL server is running."
    # Continue? Maybe, but migrations will fail.
}

# -----------------------------------------------------------------------------
# 3. Backend Services (Dependencies & Configurations)
# -----------------------------------------------------------------------------
Write-Host ""
Write-Host "🔍 Checking Backend Services..."
$services = @("api-gateway", "customer-service", "conversation-service", "messaging-service", "media-service", "inbound-gateway", "chat-simulator")

foreach ($service in $services) {
    Write-Host "👉 Checking $service..."
    Push-Location "services/$service"

    # A. Config
    if (-not (Test-Path .env)) {
        Copy-Item .env.example .env
        php artisan key:generate
        Write-Green "   Created .env header."
    }

    # B. Dependencies
    if (Test-Path "vendor") {
        Write-Green "   Dependencies already installed."
    } else {
        Write-Yellow "   Dependencies missing. Installing..."
        composer install --quiet
        $NEEDS_DEPENDENCIES = $true
    }

    # C. Migrations
    Write-Host "   Running migrations check..."
    # Capture output/error to check status
    try {
        $null = php artisan migrate --force *>&1
        Write-Green "   Database schema is up to date."
    } catch {
        Write-Red "   Migration failed! Check DB credentials or logs."
        $NEEDS_MIGRATIONS = $true
    }

    Pop-Location
}

# -----------------------------------------------------------------------------
# 4. Frontend Setup
# -----------------------------------------------------------------------------
Write-Host ""
Write-Host "🔍 Checking Frontend..."
Push-Location "frontends/ops-dashboard"
if (Test-Path "node_modules") {
    Write-Green "✅ Frontend dependencies installed."
} else {
    Write-Yellow "⚠️  Installing frontend dependencies..."
    npm install
}
Pop-Location

# -----------------------------------------------------------------------------
# 5. Service Status Check
# -----------------------------------------------------------------------------
Write-Host ""
Write-Host "🔍 Checking Service Status..."

# Check API Gateway Port 8000
$portCheck = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue
if ($portCheck) {
    $SERVICES_RUNNING = $true
    Write-Green "✅ Services appear to be RUNNING (Port 8000 active)."
} else {
    $SERVICES_RUNNING = $false
    Write-Yellow "⚠️  Services are STOPPED."
}

# -----------------------------------------------------------------------------
# 6. Actions
# -----------------------------------------------------------------------------
Write-Host ""
Write-Host "────────────────────────────────────────────────────────────────"
Write-Host "   Status Summary"
Write-Host "────────────────────────────────────────────────────────────────"

if ($SERVICES_RUNNING) {
    Write-Host "✅ Application is already running."
    Write-Host "   Dashboard: http://localhost:5173"
    
    $runSeed = Read-Host "❓ Do you want to run the data seeder again? [y/N]"
    if ($runSeed -match "^[Yy]$") {
        & "$PSScriptRoot/seed-demo-data.ps1"
    }

} else {
    Write-Host "🚀 Starting services..."
    
    # Starting detached process in PS is tricky. Usually "Start-Process" or just running the bat file.
    # We can use the start-all.bat
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c scripts\windows\start-all.bat" -WindowStyle Minimized
    
    Write-Host "⏳ Waiting for services to initialize..."
    Start-Sleep -Seconds 10
    
    # Determine seeding
    if (-not (Test-Path ".setup_seeded_lock")) {
        Write-Host ""
        Write-Host "🌱 Detected fresh run. Seeding demo data..."
        try {
            & "$PSScriptRoot/seed-demo-data.ps1"
            New-Item -ItemType File -Path ".setup_seeded_lock" -Force | Out-Null
        } catch {
            Write-Yellow "⚠️  Seeding had issues. You can try running seed-demo-data.ps1 manually."
        }
    } else {
        Write-Host "✅ Data already seeded previously (lockfile found)."
    }

    Write-Host ""
    Write-Green "🎉 Kobliat Platform is LIVE!"
    Write-Host "   • Dashboard: http://localhost:5173"
    Write-Host "   • API:       http://localhost:8000"
}
