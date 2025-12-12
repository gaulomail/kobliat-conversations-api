#!/bin/bash
set -e

echo "🚀 Setting up Kobliat Conversations..."
echo "========================================"

# Detect DB Password
DB_PASSWORD=""
echo "Checking MySQL connection..."
if mysql -u root -e "SELECT 1" &> /dev/null; then
    echo "✅ MySQL Connection successful (No Password)"
elif mysql -u root -p'Blessmore@1' -e "SELECT 1" &> /dev/null; then
    echo "✅ MySQL Connection successful (Password: Blessmore@1)"
    DB_PASSWORD="Blessmore@1"
else
    echo "❌ Cannot connect to MySQL as root (empty or Blessmore@1)."
    echo "   Please create databases manually or update setup script."
    exit 1
fi

# Create Databases
dbs=(
    "kobliat_gateway"
    "kobliat_conversations"
    "kobliat_customers"
    "kobliat_inbound"
    "kobliat_media"
    "kobliat_messaging"
    "kobliat_simulator"
)

echo ""
echo "🗄️  Creating Databases..."
for db in "${dbs[@]}"; do
    if [ -z "$DB_PASSWORD" ]; then
        mysql -u root -e "CREATE DATABASE IF NOT EXISTS $db;"
    else
        mysql -u root -p"$DB_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS $db;"
    fi
done
echo "✅ Databases ready"

# Services Setup
services=(
    "services/api-gateway"
    "services/conversation-service"
    "services/customer-service"
    "services/inbound-gateway"
    "services/media-service"
    "services/messaging-service"
    "services/chat-simulator"
)

echo ""
echo "📦 Installing Dependencies & configuring..."
for dir in "${services[@]}"; do
    echo "   Processing $dir..."
    cd "$dir"
    
    # Composer
    composer install --quiet
    
    # Environment
    if [ ! -f .env ]; then
        cp .env.example .env
        php artisan key:generate
    fi
    
    # Set DB Password in .env if needed
    if [ -n "$DB_PASSWORD" ]; then
        # Enforce the detected password
        sed -i '' "s/DB_PASSWORD=.*/DB_PASSWORD=$DB_PASSWORD/" .env
    fi

    # Migrate
    # Ensure config is cleared before migration
    php artisan config:clear > /dev/null
    php artisan migrate --force --quiet
    
    cd - > /dev/null
done

# Frontend
echo ""
echo "🎨 Setting up Frontend..."
cd frontends/ops-dashboard
npm install --silent
cd - > /dev/null

echo ""
echo "✅ Setup Complete!"
echo "Run ./scripts/unix/start-all.sh to start services."
