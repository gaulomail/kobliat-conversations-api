#!/bin/bash
# setup-local.sh - Complete setup without starting services
# This script sets up everything but doesn't start the services

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║   Kobliat Conversations Platform - Setup (No Auto-Start)      ║"
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

# Load configuration from .env
set -a
source .env
set +a

# Step 1: Infrastructure Setup (MySQL, Kafka, MinIO) - Optional
echo "📦 Step 1/3: Setting up infrastructure (MySQL, Kafka, MinIO)..."
echo "────────────────────────────────────────────────────────────────"

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    echo "❌ Homebrew is not installed. Please install it first:"
    echo "   /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
    exit 1
fi

echo "✅ Homebrew found"
echo ""

# Update Homebrew
echo "📦 Updating Homebrew..."
brew update

# Install MySQL
echo ""
echo "📦 Checking MySQL..."
if ! command -v mysql &> /dev/null; then
    echo "📦 Installing MySQL..."
    brew install mysql
    brew services start mysql
    echo "✅ MySQL installed and started"
else
    echo "✅ MySQL already installed"
    brew services start mysql 2>/dev/null || echo "MySQL already running"
fi

# Install Kafka (includes Zookeeper)
echo ""
echo "📦 Installing Kafka..."
if ! command -v kafka-server-start &> /dev/null; then
    brew install kafka
    echo "✅ Kafka installed"
else
    echo "✅ Kafka already installed"
fi

# Install MinIO
echo ""
echo "📦 Installing MinIO..."
if ! command -v minio &> /dev/null; then
    brew install minio/stable/minio
    echo "✅ MinIO installed"
else
    echo "✅ MinIO already installed"
fi

# Install MinIO Client
echo ""
echo "📦 Installing MinIO Client (mc)..."
if ! command -v mc &> /dev/null; then
    brew install minio/stable/mc
    echo "✅ MinIO Client installed"
else
    echo "✅ MinIO Client already installed"
fi

# Create MySQL databases
echo ""
echo "📦 Creating MySQL databases..."

# Use DB_PASSWORD from .env (or DB_ROOT_PASSWORD for backward compatibility)
DB_ROOT_PASSWORD=${DB_ROOT_PASSWORD:-$DB_PASSWORD}

if [ -z "$DB_ROOT_PASSWORD" ]; then
    echo "⚠️  DB_PASSWORD not set in .env, assuming empty password for MySQL root."
    MYSQL_CMD="mysql -u root"
else
    MYSQL_CMD="mysql -u root -p$DB_ROOT_PASSWORD"
fi

# Function to create db
create_db() {
    local dbname=$1
    echo "  Creating $dbname..."
    if ! $MYSQL_CMD -e "CREATE DATABASE IF NOT EXISTS $dbname;"; then
        echo "❌ Failed to create $dbname. Check your DB_PASSWORD in .env."
        exit 1
    fi
}

create_db "${DB_NAME_CUSTOMER:-kobliat_customers}"
create_db "${DB_NAME_CONVERSATION:-kobliat_conversations}"
create_db "${DB_NAME_MESSAGING:-kobliat_messaging}"
create_db "${DB_NAME_MEDIA:-kobliat_media}"
create_db "${DB_NAME_GATEWAY:-kobliat_gateway}"

echo "✅ Databases created"

# Create MinIO data directory
echo ""
echo "📁 Creating MinIO data directory..."
mkdir -p ~/.minio/data
echo "✅ MinIO data directory created"

echo ""
echo "────────────────────────────────────────────────────────────────"

# Step 2: Application Setup (Dependencies & Migrations)
echo "📦 Step 2/3: Setting up application (Dependencies & Migrations)..."
echo "────────────────────────────────────────────────────────────────"

# Services list
services=("api-gateway" "customer-service" "conversation-service" "messaging-service" "media-service" "inbound-gateway" "chat-simulator")

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
        "customer-service") TARGET_DB=${DB_NAME_CUSTOMER:-kobliat_customers} ;;
        "conversation-service") TARGET_DB=${DB_NAME_CONVERSATION:-kobliat_conversations} ;;
        "messaging-service") TARGET_DB=${DB_NAME_MESSAGING:-kobliat_messaging} ;;
        "media-service") TARGET_DB=${DB_NAME_MEDIA:-kobliat_media} ;;
        *) TARGET_DB=${DB_NAME_GATEWAY:-kobliat_gateway} ;;
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

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║   Setup Complete! 🎉                                          ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "ℹ️  Services are NOT started. To start them, run:"
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
