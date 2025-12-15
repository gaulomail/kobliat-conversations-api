# setup-local.ps1 - Complete setup without starting services (Windows)
# This script sets up everything but doesn't start the services

$ErrorActionPreference = "Stop"

Write-Host "╔════════════════════════════════════════════════════════════════╗"
Write-Host "║   Kobliat Conversations Platform - Setup (No Auto-Start)      ║"
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

# Step 1: Infrastructure Setup (Create Databases)
Write-Host "📦 Step 1/3: Setting up infrastructure (Databases)..."
Write-Host "────────────────────────────────────────────────────────────────"

# Detect MySQL
$mysqlCmd = "mysql"
try {
    & $mysqlCmd --version | Out-Null
} catch {
    Write-Host "❌ MySQL not found in PATH. Please install MySQL first."
    exit 1
}

# Create Databases
Write-Host "📦 Creating MySQL databases..."
$dbs = @(
    if ($envVars.DB_NAME_CUSTOMER) { $envVars.DB_NAME_CUSTOMER } else { "kobliat_customers_db" },
    if ($envVars.DB_NAME_CONVERSATION) { $envVars.DB_NAME_CONVERSATION } else { "kobliat_conversation_db" },
    if ($envVars.DB_NAME_MESSAGING) { $envVars.DB_NAME_MESSAGING } else { "kobliat_messaging_db" },
    if ($envVars.DB_NAME_MEDIA) { $envVars.DB_NAME_MEDIA } else { "kobliat_media_db" },
    if ($envVars.DB_NAME_GATEWAY) { $envVars.DB_NAME_GATEWAY } else { "kobliat_gateway_db" }
)

foreach ($db in $dbs) {
    Write-Host "  Creating $db..."
    try {
        if ([string]::IsNullOrEmpty($DB_PASSWORD)) {
            & $mysqlCmd -u $DB_USER -e "CREATE DATABASE IF NOT EXISTS $db;"
        } else {
            & $mysqlCmd -u $DB_USER -p"$DB_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS $db;"
        }
    } catch {
        Write-Host "❌ Failed to create $db. Check DB credentials."
    }
}
Write-Host "✅ Databases created"

Write-Host ""
Write-Host "────────────────────────────────────────────────────────────────"

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
        "customer-service"     { if ($envVars.DB_NAME_CUSTOMER) { $envVars.DB_NAME_CUSTOMER } else { "kobliat_customers_db" } }
        "conversation-service" { if ($envVars.DB_NAME_CONVERSATION) { $envVars.DB_NAME_CONVERSATION } else { "kobliat_conversation_db" } }
        "messaging-service"    { if ($envVars.DB_NAME_MESSAGING) { $envVars.DB_NAME_MESSAGING } else { "kobliat_messaging_db" } }
        "media-service"        { if ($envVars.DB_NAME_MEDIA) { $envVars.DB_NAME_MEDIA } else { "kobliat_media_db" } }
        default                { if ($envVars.DB_NAME_GATEWAY) { $envVars.DB_NAME_GATEWAY } else { "kobliat_gateway_db" } }
    }
    
    $content = Set-EnvVar $content "DB_DATABASE" $targetDb
    
    # FIX: Ensure DB_NAME_CUSTOMER is in conversation-service .env
    if ($service -eq "conversation-service") {
        $customerDbName = if ($envVars.DB_NAME_CUSTOMER) { $envVars.DB_NAME_CUSTOMER } else { "kobliat_customers_db" }
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
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗"
Write-Host "║   Setup Complete! 🎉                                          ║"
Write-Host "╚════════════════════════════════════════════════════════════════╝"
Write-Host ""
Write-Host "ℹ️  Services are NOT started. To start them, run:"
Write-Host "   scripts\windows\start-all.bat"
