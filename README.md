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
| **API Gateway** | 8000 | Request routing, logging, aggregation | MySQL |
| **Customer Service** | 8001 | Customer management, profiles | MySQL |
| **Conversation Service** | 8002 | Conversation lifecycle, participants | MySQL |
| **Messaging Service** | 8003 | Message storage, retrieval | MySQL |
| **Media Service** | 8004 | File uploads, media handling | MySQL |
| **Inbound Gateway** | 8005 | Webhook receiver, channel integration | MySQL |
| **Chat Simulator** | 8006 | AI-powered chat simulation (Gemini) | MySQL |

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

- **PHP** 8.1 or higher
- **Composer** 2.x
- **Node.js** 18+ and npm
- **MySQL** 8.0+
- **Git**

### Installation

#### Option 1: Automated Setup (Recommended)

**Unix/macOS:**
```bash
# Clone the repository
git clone <repository-url>
cd kobliat-conversations

# Run setup script
# Run the complete setup and start services
./scripts/unix/install-and-run.sh
```

**Windows (PowerShell):**
```powershell
# Clone the repository
git clone <repository-url>
cd kobliat-conversations

# Run the complete setup and start services
.\scripts\windows\install-and-run.ps1
```

#### Option 2: Manual Setup

```bash
# 1. Install backend dependencies
for service in api-gateway customer-service conversation-service messaging-service media-service inbound-gateway chat-simulator; do
    cd services/$service
    composer install
    cp .env.example .env
    php artisan key:generate
    php artisan migrate
    cd ../..
done

# 2. Install frontend dependencies
cd frontends/ops-dashboard
npm install
cd ../..

# 3. Start services (use concurrently or individual terminals)
./scripts/unix/start-all.sh
```

### Access the Application

Once all services are running:

- **Ops Dashboard**: http://localhost:5174
- **API Gateway**: http://localhost:8000
- **API Documentation**: See `docs/API.md`

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
- **Database**: MySQL (dev/prod)
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
