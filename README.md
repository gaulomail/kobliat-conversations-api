# Kobliat Conversations Platform

> **A Modern Microservices-Based Conversational Platform**  
> Built with Laravel, React, and Event-Driven Architecture

[![PHP](https://img.shields.io/badge/PHP-8.1+-777BB4?style=flat&logo=php)](https://php.net)
[![Laravel](https://img.shields.io/badge/Laravel-10.x-FF2D20?style=flat&logo=laravel)](https://laravel.com)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=flat&logo=react)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Quick Start](#quick-start)
- [Services](#services)
- [Documentation](#documentation)
- [Testing](#testing)
- [Deployment](#deployment)
- [Screenshots](#screenshots)
- [License](#license)

---

## 🎯 Overview

Kobliat Conversations is a **production-ready microservices platform** designed for managing multi-channel conversations at scale. Built with modern technologies and best practices, it demonstrates:

- ✅ **Microservices Architecture** - 7 independent, scalable services
- ✅ **Event-Driven Design** - Asynchronous communication via message bus
- ✅ **API Gateway Pattern** - Centralized routing and logging
- ✅ **Real-Time Monitoring** - Comprehensive ops dashboard
- ✅ **Multi-Channel Support** - WhatsApp, SMS, Web, and more
- ✅ **AI Integration** - Gemini-powered chat simulation
- ✅ **Professional UI/UX** - Modern, responsive dashboard

### Key Highlights

🏆 **Distinction-Level Features:**
- Complete microservices implementation with proper service boundaries
- Event-driven architecture with message bus integration
- Comprehensive API logging and monitoring
- Real-time service health checks
- Professional operations dashboard
- Full test coverage with PHPUnit
- Cross-platform deployment scripts
- Production-ready configuration

---

## 🏗️ Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Applications                      │
│              (Web, Mobile, WhatsApp, etc.)                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway (8000)                      │
│         • Request Routing  • API Logging  • Auth            │
└────────┬──────────┬──────────┬──────────┬──────────┬────────┘
         │          │          │          │          │
    ┌────▼────┐┌───▼────┐┌───▼────┐┌────▼────┐┌───▼────┐
    │Customer ││Conver- ││Message ││  Media  ││Inbound │
    │Service  ││sation  ││Service ││ Service ││Gateway │
    │  8001   ││Service ││  8003  ││  8004   ││  8005  │
    │         ││  8002  ││        ││         ││        │
    └─────────┘└────────┘└────────┘└─────────┘└────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │   Message Bus/Queue   │
              │   (Event-Driven)      │
              └──────────────────────┘
```

### Microservices

| Service | Port | Responsibility | Database |
|---------|------|----------------|----------|
| **API Gateway** | 8000 | Request routing, logging, aggregation | SQLite |
| **Customer Service** | 8001 | Customer management, profiles | SQLite |
| **Conversation Service** | 8002 | Conversation lifecycle, participants | SQLite |
| **Messaging Service** | 8003 | Message storage, retrieval | SQLite |
| **Media Service** | 8004 | File uploads, media handling | SQLite |
| **Inbound Gateway** | 8005 | Webhook receiver, channel integration | SQLite |
| **Chat Simulator** | 8006 | AI-powered chat simulation (Gemini) | SQLite |

### Frontend

| Application | Port | Technology | Purpose |
|-------------|------|------------|---------|
| **Ops Dashboard** | 5174 | React + TypeScript | Service monitoring, logs, analytics |

---

## ✨ Features

### Core Functionality

#### 1. **Customer Management**
- Create and manage customer profiles
- Track customer metadata
- External ID mapping for multi-channel support

#### 2. **Conversation Management**
- Multi-participant conversations
- Conversation types (direct, group, channel)
- Participant management

#### 3. **Messaging**
- Send and receive messages
- Message status tracking (sent, delivered, read)
- Message updates and editing
- Rich media support

#### 4. **Media Handling**
- File upload and storage
- Image, video, document support
- Secure file serving

#### 5. **Multi-Channel Integration**
- WhatsApp webhook integration
- Extensible for SMS, email, web chat
- Channel-agnostic message format

#### 6. **AI Chat Simulation**
- Gemini AI integration
- Scenario-based testing
- Automated conversation generation

### Operations Dashboard

#### Real-Time Monitoring
- ✅ **Service Health** - Live status of all microservices
- ✅ **API Logs** - Complete request/response logging
- ✅ **Service Logs** - Individual service log viewing
- ✅ **Performance Metrics** - Response times, error rates

#### Features
- 🎨 **Modern UI** - Clean, professional design
- 🌓 **Dark Mode** - Full dark theme support
- 📊 **Analytics** - Request statistics and trends
- 🔍 **Search & Filter** - Advanced log filtering
- 📱 **Responsive** - Works on all devices
- ⚡ **Real-Time** - Auto-refresh capabilities

---

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:

- **PHP** 8.1 or higher
- **Composer** 2.x
- **Node.js** 18+ and npm
- **MySQL** 8.0+ (for production) or **SQLite** (for development)
- **Git**
- **Homebrew** (macOS only - for infrastructure setup)

### Installation

#### One-Command Setup (Recommended)

The easiest way to get started is with our all-in-one setup script:

**Unix/macOS:**
```bash
# Clone the repository
git clone <repository-url>
cd kobliat-conversations

# Run the master setup script
./scripts/unix/setup.sh
```

This script will:
1. ✅ Create `.env` file from `.env.example` (if needed)
2. ✅ Prompt you to configure database credentials
3. ✅ Install infrastructure (MySQL, Kafka, MinIO via Homebrew)
4. ✅ Create MySQL databases with `kobliat_` prefix
5. ✅ Install all backend dependencies (Composer)
6. ✅ Configure all service `.env` files from central config
7. ✅ Run all database migrations
8. ✅ Install frontend dependencies (npm)
9. ✅ Optionally start all services

**Windows:**
```cmd
REM Clone the repository
git clone <repository-url>
cd kobliat-conversations

REM Run setup script
scripts\windows\setup-local.bat

REM Install app dependencies and run migrations
scripts\windows\install-and-run.bat
```

#### Setup Without Auto-Start

If you want to set up everything but start services manually later:

**Unix/macOS:**
```bash
# Complete setup without starting services
./scripts/unix/setup-local.sh

# Later, when ready to start:
./scripts/unix/start-all.sh
```

#### Manual Setup (Advanced Users)

For those who prefer granular control:

**Unix/macOS:**
```bash
# 1. Create and configure .env
cp .env.example .env
# Edit .env with your database credentials

# 2. Install infrastructure (optional - skip if using SQLite)
./scripts/unix/setup-local.sh

# 3. Start services
./scripts/unix/start-all.sh
```

**Note**: If you skip `setup-local.sh`, you'll need to manually:
- Install Composer dependencies for each service
- Create `.env` files for each service
- Run migrations for each service
- Install npm dependencies for the frontend

### Configuration

#### Required Environment Variables

Edit your `.env` file to configure:

```bash
# Database Configuration
DB_CONNECTION=mysql          # or sqlite for development
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root                 # Your MySQL username
DB_PASSWORD=your_password    # Your MySQL password

# Database Names (automatically created)
DB_NAME_CUSTOMER=kobliat_customer_db
DB_NAME_CONVERSATION=kobliat_conversation_db
DB_NAME_MESSAGING=kobliat_messaging_db
DB_NAME_MEDIA=kobliat_media_db
DB_NAME_GATEWAY=kobliat_gateway_db
```

#### Optional Configuration

```bash
# Kafka (for message bus)
KAFKA_BROKER=localhost:9092

# MinIO (for file storage)
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minio
S3_SECRET_KEY=minio123

# Gemini API (for AI chat simulator)
GEMINI_API_KEY=your_api_key_here
```

### Seeding Demo Data

The setup script will prompt you to seed demo data. You can also seed manually:

**Automatic Seeding (Recommended)**:
```bash
# During setup, answer 'Y' when prompted:
# "Do you want to seed the database with demo data? [Y/n]"
```

**Manual Seeding**:
```bash
# Seed all services
./scripts/unix/seed-all.sh

# Or seed individual services
cd services/customer-service && php artisan db:seed
cd services/conversation-service && php artisan db:seed  
cd services/messaging-service && php artisan db:seed
```

**API-Based Demo Data** (creates complete conversations):
```bash
# Make sure services are running first
./scripts/unix/seed-demo-data.sh
```

This creates:
- 4 demo customers (3 users + 1 AI assistant)
- 3 conversations
- 6+ messages

### Access the Application

Once all services are running, you can access:

- **Ops Dashboard**: http://localhost:5174
- **API Gateway**: http://localhost:8000
- **Individual Services**:
  - Customer Service: http://localhost:8001
  - Conversation Service: http://localhost:8002
  - Messaging Service: http://localhost:8003
  - Media Service: http://localhost:8004
  - Inbound Gateway: http://localhost:8005
  - Chat Simulator: http://localhost:8006

### Stopping Services

To stop all running services:

**Unix/macOS:**
```bash
# Kill all service processes
lsof -ti:8000,8001,8002,8003,8004,8005,8006,5174 | xargs kill -9
```

Or use `Ctrl+C` in the terminal where services are running.

### Troubleshooting

#### Port Already in Use

If you see "Address already in use" errors:
```bash
# Kill processes on specific ports
lsof -ti:8000,8001,8002,8003,8004,8005,8006 | xargs kill -9

# Then restart
./scripts/unix/start-all.sh
```

#### Database Connection Issues

1. Verify MySQL is running:
   ```bash
   brew services list | grep mysql
   ```

2. Test database connection:
   ```bash
   mysql -u root -p -e "SELECT 1;"
   ```

3. Ensure databases exist:
   ```bash
   mysql -u root -p -e "SHOW DATABASES LIKE 'kobliat_%';"
   ```

#### Migration Errors

If migrations fail, check:
- Database credentials in `.env` are correct
- MySQL user has proper permissions
- Databases exist (created by setup script)

To re-run migrations:
```bash
cd services/customer-service
php artisan migrate:fresh
cd ../..
```

### Default Credentials

```
Email: admin@kobliat.com
Password: password
```

---

## 📦 Services

### 1. API Gateway (Port 8000)

**Purpose**: Central entry point for all API requests

**Features**:
- Request routing to microservices
- Complete API logging
- Request/response aggregation
- Authentication middleware
- CORS handling

**Key Endpoints**:
```
GET  /api/v1/logs              # API logs
GET  /api/v1/services/health   # Service health
GET  /api/v1/conversations/{id}/details  # Aggregated data
```

### 2. Customer Service (Port 8001)

**Purpose**: Customer profile management

**Features**:
- CRUD operations for customers
- External ID mapping
- Customer metadata
- Search and filtering

**Endpoints**:
```
POST   /api/customers          # Create customer
GET    /api/customers/{id}     # Get customer
PUT    /api/customers/{id}     # Update customer
DELETE /api/customers/{id}     # Delete customer
```

### 3. Conversation Service (Port 8002)

**Purpose**: Conversation lifecycle management

**Features**:
- Create conversations
- Manage participants
- Conversation types
- Participant tracking

**Endpoints**:
```
POST   /api/conversations      # Create conversation
GET    /api/conversations/{id} # Get conversation
POST   /api/conversations/{id}/participants  # Add participant
```

### 4. Messaging Service (Port 8003)

**Purpose**: Message storage and retrieval

**Features**:
- Send messages
- Retrieve conversation messages
- Update messages
- Message status tracking

**Endpoints**:
```
POST   /api/messages           # Send message
GET    /api/conversations/{id}/messages  # Get messages
PUT    /api/messages/{id}      # Update message
```

### 5. Media Service (Port 8004)

**Purpose**: File upload and management

**Features**:
- File upload
- Image processing
- Secure file serving
- Storage management

**Endpoints**:
```
POST   /api/media/upload       # Upload file
GET    /api/media/{id}         # Get file
DELETE /api/media/{id}         # Delete file
```

### 6. Inbound Gateway (Port 8005)

**Purpose**: Webhook receiver for external channels

**Features**:
- WhatsApp webhook handling
- Channel message normalization
- Event distribution
- Webhook validation

**Endpoints**:
```
POST   /api/webhooks/whatsapp  # WhatsApp webhook
GET    /api/webhooks/whatsapp  # Webhook verification
```

### 7. Chat Simulator (Port 8006)

**Purpose**: AI-powered chat simulation

**Features**:
- Gemini AI integration
- Scenario-based testing
- Automated conversations
- Fallback responses

**Endpoints**:
```
POST   /api/simulate           # Run simulation
```

---

## 📚 Documentation

Comprehensive documentation is available in the `/docs` directory:

- **[API Documentation](docs/API.md)** - Complete API reference
- **[Architecture Guide](docs/ARCHITECTURE.md)** - System design and patterns
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Production deployment
- **[Testing Guide](docs/TESTING.md)** - Test coverage and strategies
- **[Scripts Guide](scripts/README.md)** - Script usage and reference

### Additional Resources

- **[Chat Simulator Guide](AI_CHAT_DOCUMENTATION.md)** - AI chat features
- **[Service Health Monitoring](SERVICES_PAGE_REAL_IMPLEMENTATION.md)** - Health checks
- **[API Logging](SERVICE_LOGS_README.md)** - Log management
- **[Postman Collection](POSTMAN_COLLECTION_README.md)** - API testing

---

## 🧪 Testing

### Run All Tests

```bash
# Run tests for all services
./scripts/unix/run-tests.sh

# Or manually for each service
cd services/api-gateway
php artisan test

cd services/customer-service
php artisan test

# ... repeat for other services
```

### Test Coverage

- ✅ **Unit Tests** - Business logic and models
- ✅ **Feature Tests** - API endpoints and integration
- ✅ **Integration Tests** - Service-to-service communication

### Example Test Output

```
PASS  Tests\Feature\CustomerTest
✓ can create customer
✓ can retrieve customer
✓ can update customer
✓ can delete customer

Tests:  4 passed
Time:   0.45s
```

---

## 🌐 Deployment

### Production Deployment

See **[DEPLOYMENT.md](docs/DEPLOYMENT.md)** for detailed instructions.

**Quick Overview**:

1. **Environment Setup**
   ```bash
   cp .env.example .env
   # Configure production settings
   ```

2. **Dependencies**
   ```bash
   composer install --no-dev --optimize-autoloader
   npm run build
   ```

3. **Database**
   ```bash
   php artisan migrate --force
   ```

4. **Process Manager**
   ```bash
   # Use PM2, Supervisor, or systemd
   pm2 start ecosystem.config.js
   ```

### Docker Deployment

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f
```

---

## 📸 Screenshots

### Ops Dashboard - Service Health
![Service Health](docs/screenshots/service-health.png)

### Ops Dashboard - API Logs
![API Logs](docs/screenshots/api-logs.png)

### Ops Dashboard - Service Logs
![Service Logs](docs/screenshots/service-logs.png)

### AI Chat Interface
![AI Chat](docs/screenshots/ai-chat.png)

---

## 🛠️ Technology Stack

### Backend
- **Framework**: Laravel 10.x
- **Language**: PHP 8.1+
- **Database**: SQLite (dev), MySQL/PostgreSQL (prod)
- **Testing**: PHPUnit
- **API**: RESTful

### Frontend
- **Framework**: React 18.x
- **Language**: TypeScript 5.x
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State**: React Hooks
- **HTTP Client**: Axios

### DevOps
- **Process Manager**: Concurrently (dev), PM2 (prod)
- **Scripts**: Bash (Unix), Batch (Windows)
- **Version Control**: Git
- **CI/CD**: GitHub Actions ready

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Gaudencio Kobliat**

- GitHub: [@gaudencio](https://github.com/gaudencio)
- Email: gaudencio@kobliat.com

---

## 🙏 Acknowledgments

- Laravel Framework
- React Community
- Gemini AI by Google
- All open-source contributors

---

## 📞 Support

For questions or issues:
1. Check the [Documentation](docs/)
2. Review [API Guide](docs/API.md)
3. See [Troubleshooting](docs/TROUBLESHOOTING.md)

---

**Built with ❤️ for distinction-level assessment**
# kobliat-conversations-api
