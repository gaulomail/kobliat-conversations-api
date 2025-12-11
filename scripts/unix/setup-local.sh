#!/bin/bash
set -e

echo "🚀 Setting up Kobliat Mini Router 2.0 - Native macOS Installation"
echo "=================================================================="
echo ""

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

# Install PostgreSQL
echo ""
echo "📦 Installing PostgreSQL..."
if ! command -v psql &> /dev/null; then
    brew install postgresql@15
    brew services start postgresql@15
    echo "✅ PostgreSQL installed and started"
else
    echo "✅ PostgreSQL already installed"
    brew services start postgresql@15 2>/dev/null || echo "PostgreSQL already running"
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

# Install ClamAV (optional, for virus scanning)
echo ""
echo "📦 Installing ClamAV (optional - for virus scanning)..."
if ! command -v clamscan &> /dev/null; then
    brew install clamav
    echo "✅ ClamAV installed"
    echo "⚠️  Note: You'll need to update virus definitions with 'freshclam' before first use"
else
    echo "✅ ClamAV already installed"
fi

# Create PostgreSQL databases
echo ""
echo "🗄️  Creating PostgreSQL databases..."
createdb customer_db 2>/dev/null || echo "  customer_db already exists"
createdb conversation_db 2>/dev/null || echo "  conversation_db already exists"
createdb messaging_db 2>/dev/null || echo "  messaging_db already exists"
createdb media_db 2>/dev/null || echo "  media_db already exists"
createdb gateway_db 2>/dev/null || echo "  gateway_db already exists"
echo "✅ Databases created"

# Create MinIO data directory
echo ""
echo "📁 Creating MinIO data directory..."
mkdir -p ~/.minio/data
echo "✅ MinIO data directory created"

# Create environment file
echo ""
echo "📝 Creating .env file..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ .env file created from .env.example"
    echo "⚠️  Please update .env with your configuration (especially GEMINI_API_KEY)"
else
    echo "✅ .env file already exists"
fi

echo ""
echo "=================================================================="
echo "✅ Installation complete!"
echo ""
echo "Next steps:"
echo "1. Start the services with: ./scripts/start-services.sh"
echo "2. Install Node.js dependencies: npm install"
echo "3. Run database migrations: npm run migrate"
echo "4. Start the microservices: npm run dev"
echo ""
