# setup.ps1 - Master setup script for Kobliat Conversations Platform (Windows)
# This script sets up everything needed to run the platform

$ErrorActionPreference = "Stop"

Write-Host "╔════════════════════════════════════════════════════════════════╗"
Write-Host "║   Kobliat Conversations Platform - Complete Setup             ║"
Write-Host "║   (Windows PowerShell)                                        ║"
Write-Host "╚════════════════════════════════════════════════════════════════╝"
Write-Host ""

# Check for .env file at root
if (-not (Test-Path .env)) {
    Write-Host "⚠️  .env file not found at project root."
    $createEnv = Read-Host "❓ Do you want to create .env from .env.example? [Y/n]"
    
    if ($createEnv -match "^[Yy]$" -or [string]::IsNullOrWhiteSpace($createEnv)) {
        if (Test-Path .env.example) {
            Copy-Item .env.example .env
            Write-Host "✅ Created .env file from .env.example"
        } else {
            Write-Host "❌ .env.example not found! Cannot create .env."
            exit 1
        }
    } else {
        Write-Host "❌ .env file is required to proceed. Please create it manually."
        exit 1
    }
}

Write-Host ""
Write-Host "ℹ️  Please review/edit the .env file now if you need to configure:"
Write-Host "   • Database credentials (DB_USER, DB_PASSWORD)"
Write-Host "   • Service ports"
Write-Host "   • API keys (optional)"
Write-Host ""
$proceed = Read-Host "❓ Press 'y' to continue when ready... [y/N]"
if ($proceed -notmatch "^[Yy]$") {
    Write-Host "❌ Setup cancelled. Run this script again when ready."
    exit 1
}

Write-Host ""
Write-Host "────────────────────────────────────────────────────────────────"

# Step 1: Infrastructure Setup
Write-Host "📦 Step 1/3: Checking infrastructure (Databases)..."
Write-Host "────────────────────────────────────────────────────────────────"

# Run setup-local.ps1 if it exists, for DB creation logic
if (Test-Path "scripts/windows/setup-local.ps1") {
    # We call setup-local.ps1 but we need to pass a flag or handle it such that it doesn't double-do things?
    # Actually, setup-local.ps1 usually does the heavy lifting of app setup too.
    # Let's align with Unix: setup.sh calls setup-local.sh ONLY for infra if available, OR setup.sh duplicates the logic?
    # In Unix setup.sh:
    # if [ -f "./scripts/unix/setup-local.sh" ]; then ./scripts/unix/setup-local.sh; fi
    # But wait, Unix setup-local.sh ALSO installs backend dependencies and migrates.
    # If setup.sh calls setup-local.sh, and then setup.sh loops over services AGAIN, it's redundant.
    
    # In Step 1082 (Unix setup.sh), lines 48-55 call setup-local.sh.
    # But then lines 60-140 perform Application Setup (composer install, env setup, migrate).
    # And Step 1084 (Unix setup-local.sh) lines 53-151 do Infra + App setup.
    # So if setup.sh calls setup-local.sh, it runs everything twice!
    
    # Actually, looking at the logs of `setup.sh` execution earlier (Step 162 in previous turn? No, I don't see it).
    # But reading the code: `setup.sh` calls `setup-local.sh`. `setup-local.sh` installs deps and migrates.
    # Then `setup.sh` continues and... installs deps and migrates AGAIN.
    # This seems like a slight inefficiency in the current Unix scripts, but it works (idempotent composer/migrate).
    
    # For Windows, let's make `setup.ps1` clean.
    # I will inline the DB creation logic here or call a specific db-setup script if available.
    # `scripts/windows/init-databases.bat` likely exists.
    
    if (Test-Path "scripts/windows/init-databases.bat") {
        # Check if we should run it. Often users on Windows manually install MySQL.
        # We'll assume MySQL is running.
        Write-Host "ℹ️  Attempting to create databases using init-databases.bat..."
        cmd /c "scripts\windows\init-databases.bat"
    }
}

Write-Host ""
Write-Host "────────────────────────────────────────────────────────────────"

# Load .env variables
$envContent = Get-Content .env
$envVars = @{}
foreach ($line in $envContent) {
    if ($line -match "^([^#=]+)=(.*)$") {
        $envVars[$Matches[1]] = $Matches[2]
    }
}

# Defaults
$DB_CONNECTION = if ($envVars.DB_CONNECTION) { $envVars.DB_CONNECTION } else { "mysql" }
$DB_HOST = if ($envVars.DB_HOST) { $envVars.DB_HOST } else { "127.0.0.1" }
$DB_PORT = if ($envVars.DB_PORT) { $envVars.DB_PORT } else { "3306" }
$DB_USER = if ($envVars.DB_USER) { $envVars.DB_USER } else { "root" }
$DB_PASSWORD = if ($envVars.DB_PASSWORD) { $envVars.DB_PASSWORD } else { "" }

Write-Host "✅ Using Database Config: $DB_CONNECTION://$DB_HOST:$DB_PORT (User: $DB_USER)"

# Step 2: Application Setup
Write-Host "📦 Step 2/3: Setting up application (Dependencies & Migrations)..."
Write-Host "────────────────────────────────────────────────────────────────"

$services = @("api-gateway", "customer-service", "conversation-service", "messaging-service", "media-service", "inbound-gateway", "chat-simulator")

foreach ($service in $services) {
    Write-Host "Processing $service..."
    Push-Location "services/$service"
    
    # Install dependencies
    if (-not (Test-Path "vendor/autoload.php")) {
        Write-Host "  Running composer install..."
        composer install --quiet
    } else {
        Write-Host "  Vendor exists, skipping composer install"
    }
    
    # Environment Setup
    if (-not (Test-Path .env)) {
        Copy-Item .env.example .env
        Write-Host "  Created .env from .env.example"
        php artisan key:generate
    }
    
    # Apply Central Configuration
    Write-Host "  Applying central configuration..."
    
    $content = Get-Content .env -Raw
    
    # Helper to replace or append
    function Set-EnvVar {
        param($content, $key, $val)
        if ($content -match "(?m)^$key=.*") {
            return $content -replace "(?m)^$key=.*", "$key=$val"
        } else {
            return $content + "`n$key=$val"
        }
    }
    
    $content = Set-EnvVar $content "DB_CONNECTION" $DB_CONNECTION
    $content = Set-EnvVar $content "DB_HOST" $DB_HOST
    $content = Set-EnvVar $content "DB_PORT" $DB_PORT
    $content = Set-EnvVar $content "DB_USERNAME" $DB_USER
    $content = Set-EnvVar $content "DB_PASSWORD" $DB_PASSWORD
    
    $targetDb = switch ($service) {
        "customer-service"     { if ($envVars.DB_NAME_CUSTOMER) { $envVars.DB_NAME_CUSTOMER } else { "kobliat_customer_db" } }
        "conversation-service" { if ($envVars.DB_NAME_CONVERSATION) { $envVars.DB_NAME_CONVERSATION } else { "kobliat_conversation_db" } }
        "messaging-service"    { if ($envVars.DB_NAME_MESSAGING) { $envVars.DB_NAME_MESSAGING } else { "kobliat_messaging_db" } }
        "media-service"        { if ($envVars.DB_NAME_MEDIA) { $envVars.DB_NAME_MEDIA } else { "kobliat_media_db" } }
        default                { if ($envVars.DB_NAME_GATEWAY) { $envVars.DB_NAME_GATEWAY } else { "kobliat_gateway_db" } }
    }
    
    $content = Set-EnvVar $content "DB_DATABASE" $targetDb
    
    # FIX: Ensure DB_NAME_CUSTOMER is in conversation-service .env for seeder
    if ($service -eq "conversation-service") {
        $customerDbName = if ($envVars.DB_NAME_CUSTOMER) { $envVars.DB_NAME_CUSTOMER } else { "kobliat_customer_db" }
        $content = Set-EnvVar $content "DB_NAME_CUSTOMER" $customerDbName
    }
    
    Set-Content .env $content -NoNewline
    
    # Migrations
    Write-Host "  Migrating..."
    php artisan migrate --force
    
    Pop-Location
    Write-Host "  $service done."
    Write-Host "-----------------------------------"
}

# Frontend
Write-Host "📦 Installing Frontend Dependencies..."
Push-Location "frontends/ops-dashboard"
if (-not (Test-Path "node_modules")) {
    npm install
} else {
    Write-Host "  node_modules exists, skipping npm install"
}
Pop-Location

Write-Host ""
Write-Host "────────────────────────────────────────────────────────────────"

# Step 3: Seed Demo Data
Write-Host "📦 Step 3/4: Seeding demo data..."
Write-Host "────────────────────────────────────────────────────────────────"
Write-Host ""
$seedData = Read-Host "❓ Do you want to seed the database with demo data? [Y/n]"

if ($seedData -match "^[Yy]$" -or [string]::IsNullOrWhiteSpace($seedData)) {
    # Check if seed-all.ps1 exists, if so use it, otherwise inline logic
    if (Test-Path "scripts/windows/seed-all.ps1") {
        & ./scripts/windows/seed-all.ps1
    } else {
        # Fallback inline seeding if script not ready yet (though we plan to create it)
        Write-Host "  Seeding customer service..."
        Push-Location "services/customer-service"
        php artisan db:seed --force
        Pop-Location
        
        Write-Host "  Seeding conversation service..."
        Push-Location "services/conversation-service"
        php artisan db:seed --force
        Pop-Location
        
        Write-Host "  Seeding messaging service..."
        Push-Location "services/messaging-service"
        php artisan db:seed --force
        Pop-Location
    }
    Write-Host "  ✅ Demo data seeded"
} else {
    Write-Host "  ⏭️  Skipping demo data seeding"
}

Write-Host ""
Write-Host "────────────────────────────────────────────────────────────────"

Write-Host "✅ Setup complete!"
Write-Host ""
$startServices = Read-Host "❓ Do you want to start all services now? [Y/n]"

if ($startServices -match "^[Yy]$" -or [string]::IsNullOrWhiteSpace($startServices)) {
    Write-Host ""
    Write-Host "🚀 Step 4/4: Starting all services..."
    Write-Host "────────────────────────────────────────────────────────────────"
    if (Test-Path "scripts/windows/start-all.bat") {
        cmd /c "scripts\windows\start-all.bat"
    } else {
        Write-Host "❌ start-all.bat not found!"
    }
} else {
    Write-Host ""
    Write-Host "ℹ️  Services not started. To start them manually, run:"
    Write-Host "   scripts\windows\start-all.bat"
    Write-Host ""
    Write-Host "📋 Available services:"
    Write-Host "   • API Gateway:          http://localhost:8000"
    Write-Host "   • Customer Service:     http://localhost:8001"
    Write-Host "   • Conversation Service: http://localhost:8002"
    Write-Host "   • Messaging Service:    http://localhost:8003"
    Write-Host "   • Media Service:        http://localhost:8004"
    Write-Host "   • Inbound Gateway:      http://localhost:8005"
    Write-Host "   • Chat Simulator:       http://localhost:8006"
    Write-Host "   • Ops Dashboard:        http://localhost:5174"
}

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗"
Write-Host "║   Setup Complete! 🎉                                          ║"
Write-Host "╚════════════════════════════════════════════════════════════════╝"
