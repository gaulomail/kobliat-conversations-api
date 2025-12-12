# seed-all.ps1 - Seed detailed demo data for all microservices (Windows)

$ErrorActionPreference = "Stop"

Write-Host "╔════════════════════════════════════════════════════════════════╗"
Write-Host "║   Seeding All Microservices with Demo Data (Windows)          ║"
Write-Host "╚════════════════════════════════════════════════════════════════╝"
Write-Host ""

$services = @("customer-service", "conversation-service", "messaging-service")

foreach ($service in $services) {
    Write-Host "📦 Seeding $service..."
    Push-Location "services/$service"
    
    if ($service -eq "conversation-service") {
        # Ensure DB_NAME_CUSTOMER is set for cross-database queries
        if (Test-Path .env) {
            $envContent = Get-Content .env -Raw
            if ($envContent -notmatch "DB_NAME_CUSTOMER") {
                Add-Content .env "`nDB_NAME_CUSTOMER=kobliat_customer_db"
                Write-Host "  Added DB_NAME_CUSTOMER to .env"
            }
        }
    }
    
    php artisan db:seed --force
    
    Pop-Location
    Write-Host "  ✅ $service seeded"
    Write-Host "-----------------------------------"
}

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗"
Write-Host "║   All Services Seeded Successfully! 🎉                        ║"
Write-Host "╚════════════════════════════════════════════════════════════════╝"
Write-Host ""
Write-Host "Demo data created:"
Write-Host "  • 4 Customers (3 users + 1 AI assistant)"
Write-Host "  • 3 Conversations"
Write-Host "  • 12 Messages"
