#!/bin/bash
# setup.sh - Smart Setup Script for Kobliat Conversations Platform
# Detects current state and only performs necessary actions.

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║   Kobliat Smart Setup - Auto-Detection Mode                   ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Global Status Flags
NEEDS_MIGRATIONS=false
NEEDS_DEPENDENCIES=false
SERVICES_RUNNING=false

# -----------------------------------------------------------------------------
# 1. Environment Configuration
# -----------------------------------------------------------------------------
echo "🔍 Checking Environment..."
if [ -f .env ]; then
    echo -e "${GREEN}✅ .env file exists.${NC}"
else
    echo -e "${YELLOW}⚠️  .env file missing.${NC}"
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${GREEN}✅ Created .env from .env.example${NC}"
        echo "ℹ️  Please configure your database credentials in .env now."
        read -p "Press Enter to continue..."
    else
        echo -e "${RED}❌ .env.example missing! Cannot proceed.${NC}"
        exit 1
    fi
fi

# Load Environment
set -a
source .env
set +a

# Defaults
DB_HOST=${DB_HOST:-127.0.0.1}
DB_PORT=${DB_PORT:-3306}

# -----------------------------------------------------------------------------
# 2. Database Connectivity Check
# -----------------------------------------------------------------------------
echo ""
echo "🔍 Checking Database Connection ($DB_HOST:$DB_PORT)..."
if nc -z "$DB_HOST" "$DB_PORT"; then
    echo -e "${GREEN}✅ Database server is reachable.${NC}"
else
    echo -e "${RED}❌ Database server NOT detected at $DB_HOST:$DB_PORT.${NC}"
    echo "   Please ensure your MySQL/PostgreSQL server is running."
    # We continue, but migrations will likely fail
fi

# -----------------------------------------------------------------------------
# 3. Backend Services (Dependencies & Configurations)
# -----------------------------------------------------------------------------
echo ""
echo "🔍 Checking Backend Services..."
services=("api-gateway" "customer-service" "conversation-service" "messaging-service" "media-service" "inbound-gateway" "chat-simulator")

for service in "${services[@]}"; do
    echo "👉 Checking $service..."
    cd "services/$service"

    # A. Config (.env) - Always ensure it matches root .env logic, or at least exists
    if [ ! -f .env ]; then
        cp .env.example .env
        php artisan key:generate
        echo -e "   ${GREEN}Created .env header.${NC}"
    fi

    # B. Dependencies
    if [ -d "vendor" ]; then
        echo -e "   ${GREEN}Dependencies already installed.${NC}"
    else
        echo -e "   ${YELLOW}Dependencies missing. Installing...${NC}"
        composer install --quiet
        NEEDS_DEPENDENCIES=true
    fi

    # C. Migrations (Idempotent: "migrate --force" does nothing if up to date)
    # We treat standard output as success, but if it says "Nothing to migrate", that's good.
    # We assume DB is up.
    echo "   Running migrations check..."
    if php artisan migrate --force > /dev/null 2>&1; then
         echo -e "   ${GREEN}Database schema is up to date.${NC}"
    else
         echo -e "   ${RED}Migration failed! Check DB credentials or logs.${NC}"
         NEEDS_MIGRATIONS=true
    fi

    cd ../..
done

# -----------------------------------------------------------------------------
# 4. Frontend Setup
# -----------------------------------------------------------------------------
echo ""
echo "🔍 Checking Frontend..."
cd frontends/ops-dashboard
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✅ Frontend dependencies installed.${NC}"
else
    echo -e "${YELLOW}⚠️  Installing frontend dependencies...${NC}"
    npm install
fi
cd ../..

# -----------------------------------------------------------------------------
# 5. Service Status Check
# -----------------------------------------------------------------------------
echo ""
echo "🔍 Checking Service Status..."

# Check if API Gateway port (8000) is in use
if lsof -i :8000 -t >/dev/null ; then
    SERVICES_RUNNING=true
    echo -e "${GREEN}✅ Services appear to be RUNNING (Port 8000 active).${NC}"
else
    SERVICES_RUNNING=false
    echo -e "${YELLOW}⚠️  Services are STOPPED.${NC}"
fi

# -----------------------------------------------------------------------------
# 6. Actions
# -----------------------------------------------------------------------------
echo ""
echo "────────────────────────────────────────────────────────────────"
echo "   Status Summary"
echo "────────────────────────────────────────────────────────────────"

if $SERVICES_RUNNING; then
    echo "✅ Application is already running."
    echo "   Dashboard: http://localhost:5173"
    
    # Optional: Check if we need to seed
    read -p "❓ Do you want to run the data seeder again? [y/N] " RUN_SEED
    if [[ "$RUN_SEED" =~ ^[Yy]$ ]]; then
        ./scripts/unix/seed-demo-data.sh
    fi
    
else
    echo "🚀 Starting services..."
    ./scripts/unix/start-all.sh &
    
    # Wait for start
    echo "⏳ Waiting for services to initialize..."
    sleep 10
    
    # Determine if we should seed (New setup usually needs seed)
    if [ ! -f .setup_seeded_lock ]; then
        echo ""
        echo "🌱 Detected fresh run. Seeding demo data..."
        if ./scripts/unix/seed-demo-data.sh; then
            touch .setup_seeded_lock
        fi
    else
        echo "✅ Data already seeded previously (lockfile found)."
    fi

    echo ""
    echo -e "${GREEN}🎉 Kobliat Platform is LIVE!${NC}"
    echo "   • Dashboard: http://localhost:5173"
    echo "   • API:       http://localhost:8000"
fi

exit 0
