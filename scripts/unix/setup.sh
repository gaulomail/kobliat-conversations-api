#!/bin/bash
# setup.sh - Master setup script for Kobliat Conversations Platform
# This script sets up everything needed to run the platform

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║   Kobliat Conversations Platform - Complete Setup             ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Check for .env file at root
if [ ! -f .env ]; then
    echo "⚠️  .env file not found at project root."
    echo "❓ Do you want to create .env from .env.example? [Y/n]"
    read -r CREATE_ENV
    
    if [[ "$CREATE_ENV" =~ ^[Yy]$ ]] || [[ -z "$CREATE_ENV" ]]; then
        if [ -f .env.example ]; then
            cp .env.example .env
            echo "✅ Created .env file from .env.example"
        else
            echo "❌ .env.example not found! Cannot create .env."
            exit 1
        fi
    else
        echo "❌ .env file is required to proceed. Please create it manually."
        exit 1
    fi
fi

echo ""
echo "ℹ️  Please review/edit the .env file now if you need to configure:"
echo "   • Database credentials (DB_USER, DB_PASSWORD)"
echo "   • Service ports"
echo "   • API keys (optional)"
echo ""
echo "❓ Press 'y' to continue when ready... [y/N]"
read -r PROCEED
if [[ ! "$PROCEED" =~ ^[Yy]$ ]]; then
    echo "❌ Setup cancelled. Run this script again when ready."
    exit 1
fi

echo ""
echo "────────────────────────────────────────────────────────────────"

# Step 1: Infrastructure Setup (MySQL, Kafka, MinIO) - Optional
echo "📦 Step 1/3: Setting up infrastructure (MySQL, Kafka, MinIO)..."
echo "────────────────────────────────────────────────────────────────"
if [ -f "./scripts/unix/setup-local.sh" ]; then
    ./scripts/unix/setup-local.sh
else
    echo "⚠️  setup-local.sh not found, skipping infrastructure setup"
fi

echo ""
echo "────────────────────────────────────────────────────────────────"

# Step 2: Application Setup (Dependencies & Migrations)
echo "📦 Step 2/3: Setting up application (Dependencies & Migrations)..."
echo "────────────────────────────────────────────────────────────────"

# Services list
services=("api-gateway" "customer-service" "conversation-service" "messaging-service" "media-service" "inbound-gateway" "chat-simulator")

# Source root .env to get central configuration
echo "📥 Loading configuration from root .env..."
set -a
source .env
set +a

# Default values if not set in .env
DB_CONNECTION=${DB_CONNECTION:-mysql}
DB_HOST=${DB_HOST:-127.0.0.1}
DB_PORT=${DB_PORT:-3306}
DB_USER=${DB_USER:-root}
DB_PASSWORD=${DB_PASSWORD:-}

echo "✅ Using Database Config: $DB_CONNECTION://$DB_HOST:$DB_PORT (User: $DB_USER)"

echo ""
echo "📦 Installing Backend Dependencies & Running Migrations..."

for service in "${services[@]}"; do
    echo "Processing $service..."
    cd "services/$service"
    
    # Install dependencies
    if [ ! -f "vendor/autoload.php" ]; then
        echo "  Running composer install..."
        composer install --quiet
    else
        echo "  Vendor exists, skipping composer install"
    fi
    
    # Environment Setup
    if [ ! -f .env ]; then
        cp .env.example .env
        echo "  Created .env from .env.example"
        
        # Key generation
        php artisan key:generate
    fi
    
    # Apply Central Configuration to Service .env
    echo "  Applying central configuration..."
    
    # Basic DB Config
    sed -i '' "s/^DB_CONNECTION=.*/DB_CONNECTION=${DB_CONNECTION}/" .env || echo "DB_CONNECTION not found"
    sed -i '' "s/^# DB_HOST=.*/DB_HOST=${DB_HOST}/" .env
    sed -i '' "s/^DB_HOST=.*/DB_HOST=${DB_HOST}/" .env
    sed -i '' "s/^# DB_PORT=.*/DB_PORT=${DB_PORT}/" .env
    sed -i '' "s/^DB_PORT=.*/DB_PORT=${DB_PORT}/" .env
    sed -i '' "s/^# DB_USERNAME=.*/DB_USERNAME=${DB_USER}/" .env
    sed -i '' "s/^DB_USERNAME=.*/DB_USERNAME=${DB_USER}/" .env
    sed -i '' "s/^# DB_PASSWORD=.*/DB_PASSWORD=${DB_PASSWORD}/" .env
    sed -i '' "s/^DB_PASSWORD=.*/DB_PASSWORD=${DB_PASSWORD}/" .env

    # Determine DB Name based on service
    case $service in
        "customer-service") TARGET_DB=${DB_NAME_CUSTOMER:-kobliat_customer_db} ;;
        "conversation-service") TARGET_DB=${DB_NAME_CONVERSATION:-kobliat_conversation_db} ;;
        "messaging-service") TARGET_DB=${DB_NAME_MESSAGING:-kobliat_messaging_db} ;;
        "media-service") TARGET_DB=${DB_NAME_MEDIA:-kobliat_media_db} ;;
        *) TARGET_DB=${DB_NAME_GATEWAY:-kobliat_gateway_db} ;;
    esac
             
    sed -i '' "s/^# DB_DATABASE=.*/DB_DATABASE=${TARGET_DB}/" .env
    sed -i '' "s/^DB_DATABASE=.*/DB_DATABASE=${TARGET_DB}/" .env
    
    # Migrations
    echo "  Migrating..."
    php artisan migrate --force
    
    cd ../..
    echo "  $service done."
    echo "-----------------------------------"
done

# Frontend
echo "📦 Installing Frontend Dependencies..."
cd frontends/ops-dashboard
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "  node_modules exists, skipping npm install"
fi
cd ../..

echo ""
echo "────────────────────────────────────────────────────────────────"

# Step 3: Seed Demo Data
echo "📦 Step 3/4: Seeding demo data..."
echo "────────────────────────────────────────────────────────────────"
echo ""
echo "❓ Do you want to seed the database with demo data? [Y/n]"
read -r SEED_DATA

if [[ -z "$SEED_DATA" ]] || [[ "$SEED_DATA" =~ ^[Yy]$ ]]; then
    echo "  Seeding customer service..."
    cd services/customer-service
    php artisan db:seed --force
    cd ../..
    echo "  ✅ Demo data seeded"
else
    echo "  ⏭️  Skipping demo data seeding"
fi

echo ""
echo "────────────────────────────────────────────────────────────────"

echo ""
echo "────────────────────────────────────────────────────────────────"

# Step 4: Ask if user wants to start services
echo "✅ Setup complete!"
echo ""
echo "❓ Do you want to start all services now? [Y/n]"
read -r START_SERVICES

if [[ -z "$START_SERVICES" ]] || [[ "$START_SERVICES" =~ ^[Yy]$ ]]; then
    echo ""
    echo "🚀 Step 4/4: Starting all services..."
    echo "────────────────────────────────────────────────────────────────"
    ./scripts/unix/start-all.sh
else
    echo ""
    echo "ℹ️  Services not started. To start them manually, run:"
    echo "   ./scripts/unix/start-all.sh"
    echo ""
    echo "📋 Available services:"
    echo "   • API Gateway:          http://localhost:8000"
    echo "   • Customer Service:     http://localhost:8001"
    echo "   • Conversation Service: http://localhost:8002"
    echo "   • Messaging Service:    http://localhost:8003"
    echo "   • Media Service:        http://localhost:8004"
    echo "   • Inbound Gateway:      http://localhost:8005"
    echo "   • Chat Simulator:       http://localhost:8006"
    echo "   • Ops Dashboard:        http://localhost:5174"
fi

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║   Setup Complete! 🎉                                          ║"
echo "╚════════════════════════════════════════════════════════════════╝"
