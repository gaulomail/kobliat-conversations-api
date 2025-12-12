# Kobliat Setup Script (Windows PowerShell)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Setting up Kobliat Conversations..."
Write-Host "========================================"

# Detect DB Password
$DB_PASSWORD = ""
Write-Host "Checking MySQL connection..."
try {
    # Try empty
    mysql -u root -e "SELECT 1" *>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ MySQL Connection successful (No Password)"
    } else {
        # Try Blessmore@1
        mysql -u root -p"Blessmore@1" -e "SELECT 1" *>$null
        if ($LASTEXITCODE -eq 0) {
             Write-Host "✅ MySQL Connection successful (Password: Blessmore@1)"
             $DB_PASSWORD = "Blessmore@1"
        } else {
             Write-Host "❌ Cannot connect to MySQL as root."
             exit 1
        }
    }
} catch {
    Write-Host "❌ MySQL check failed. Ensure 'mysql' is in PATH."
    exit 1
}

# Create DBs
$dbs = @(
    "kobliat_gateway",
    "kobliat_conversations",
    "kobliat_customers",
    "kobliat_inbound",
    "kobliat_media",
    "kobliat_messaging",
    "kobliat_simulator"
)

Write-Host ""
Write-Host "🗄️  Creating Databases..."
foreach ($db in $dbs) {
    if ([string]::IsNullOrEmpty($DB_PASSWORD)) {
        mysql -u root -e "CREATE DATABASE IF NOT EXISTS $db;"
    } else {
        mysql -u root -p"$DB_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS $db;"
    }
}

# Services
$services = @(
    "services/api-gateway",
    "services/conversation-service",
    "services/customer-service",
    "services/inbound-gateway",
    "services/media-service",
    "services/messaging-service",
    "services/chat-simulator"
)
    
Write-Host ""
Write-Host "📦 Installing Dependencies & Configuring..."
foreach ($dir in $services) {
    Write-Host "   Processing $dir..."
    Push-Location $dir
    
    # Composer
    cmd /c composer install --quiet
    
    # Env
    if (-not (Test-Path .env)) {
        Copy-Item .env.example .env
        php artisan key:generate
    }
    
    # Set Password
    if (-not [string]::IsNullOrEmpty($DB_PASSWORD)) {
         (Get-Content .env) | 
         ForEach-Object { $_ -replace "DB_PASSWORD=.*", "DB_PASSWORD=$DB_PASSWORD" } |
         Set-Content .env -Encoding UTF8
    }
    
    # Migrate
    php artisan config:clear | Out-Null
    php artisan migrate --force --quiet
    
    Pop-Location
}

# Frontend
Write-Host ""
Write-Host "🎨 Setting up Frontend..."
Push-Location frontends/ops-dashboard
cmd /c npm install --silent
Pop-Location

Write-Host ""
Write-Host "✅ Setup Complete!"
