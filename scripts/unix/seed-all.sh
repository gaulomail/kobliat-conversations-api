#!/bin/bash
# seed-all.sh - Seed all microservices with demo data

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║   Seeding All Microservices with Demo Data                    ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Services list (in dependency order)
services=("customer-service" "conversation-service" "messaging-service")

for service in "${services[@]}"; do
    echo "📦 Seeding $service..."
    cd "services/$service"
    
    if [ "$service" = "conversation-service" ]; then
        # Ensure DB_NAME_CUSTOMER is set for cross-database queries
        if ! grep -q "DB_NAME_CUSTOMER" .env; then
            echo "DB_NAME_CUSTOMER=kobliat_customers_db" >> .env
        fi
    fi
    
    php artisan db:seed --force
    
    cd ../..
    echo "  ✅ $service seeded"
    echo "-----------------------------------"
done

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║   All Services Seeded Successfully! 🎉                        ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "Demo data created:"
echo "  • 4 Customers (3 users + 1 AI assistant)"
echo "  • 3 Conversations"
echo "  • 12 Messages"
echo ""
