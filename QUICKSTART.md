# Quick Start Guide

Get the Kobliat Conversations Platform running in **5 minutes**!

---

## Prerequisites

Before you begin, ensure you have:

- ✅ **PHP 8.1+** - `php --version`
- ✅ **Composer** - `composer --version`
- ✅ **Node.js 18+** - `node --version`
- ✅ **npm** - `npm --version`

---

## Installation

### Option 1: Automated Setup (Recommended)

#### macOS/Linux

```bash
# 1. Clone the repository
git clone <repository-url>
cd kobliat-conversations

# 2. Run setup script
./scripts/unix/setup-local.sh

# 3. Start all services
./scripts/unix/start-all.sh
```

#### Windows

```cmd
REM 1. Clone the repository
git clone <repository-url>
cd kobliat-conversations

REM 2. Run setup script
scripts\windows\setup-local.bat

REM 3. Start all services
scripts\windows\start-all.bat
```

### Option 2: Manual Setup

```bash
# 1. Install backend dependencies
cd services/api-gateway && composer install && cd ../..
cd services/customer-service && composer install && cd ../..
cd services/conversation-service && composer install && cd ../..
cd services/messaging-service && composer install && cd ../..
cd services/media-service && composer install && cd ../..
cd services/inbound-gateway && composer install && cd ../..
cd services/chat-simulator && composer install && cd ../..

# 2. Setup environment files
for service in api-gateway customer-service conversation-service messaging-service media-service inbound-gateway chat-simulator; do
    cp services/$service/.env.example services/$service/.env
    cd services/$service && php artisan key:generate && cd ../..
done

# 3. Run migrations
for service in api-gateway customer-service conversation-service messaging-service media-service inbound-gateway chat-simulator; do
    cd services/$service && php artisan migrate && cd ../..
done

# 4. Install frontend dependencies
cd frontends/ops-dashboard && npm install && cd ../..

# 5. Start all services
./scripts/unix/start-all.sh
```

---

## Access the Application

Once services are running:

### Ops Dashboard
```
http://localhost:5174
```

**Login Credentials**:
- Email: `admin@kobliat.com`
- Password: `password`

### API Gateway
```
http://localhost:8000
```

### Individual Services
- Customer Service: `http://localhost:8001`
- Conversation Service: `http://localhost:8002`
- Messaging Service: `http://localhost:8003`
- Media Service: `http://localhost:8004`
- Inbound Gateway: `http://localhost:8005`
- Chat Simulator: `http://localhost:8006`

---

## Test the API

### Using cURL

```bash
# Health check
curl http://localhost:8000/api/v1/services/health \
  -H "X-API-Key: kobliat-secret-key"

# Create a customer
curl -X POST http://localhost:8000/api/v1/customers \
  -H "X-API-Key: kobliat-secret-key" \
  -H "Content-Type: application/json" \
  -d '{"external_id":"test123","external_type":"web","name":"Test User"}'
```

### Using Postman

1. Import the collection from `postman/Kobliat-Conversations.postman_collection.json`
2. Set the API key in the collection variables
3. Run the requests

---

## Explore the Dashboard

### 1. Service Health
Navigate to **Services** to see:
- Real-time service status
- Response times
- Service versions
- Port information

### 2. API Logs
Navigate to **API Logs** to view:
- All API requests
- Request/response details
- Performance metrics
- Filter and search

### 3. Service Logs
Navigate to **Service Logs** to:
- View individual service logs
- Filter by log level
- Search log content

### 4. AI Chat
Navigate to **AI Chat** to:
- Start a conversation
- Test AI responses
- Run simulator scenarios

---

## Common Tasks

### Stop All Services

**macOS/Linux**:
```bash
./scripts/unix/stop-services.sh
```

**Windows**:
```cmd
scripts\windows\stop-services.bat
```

### Restart a Single Service

**macOS/Linux**:
```bash
./scripts/unix/service-control.sh restart customer-service
```

**Windows**:
```cmd
scripts\windows\service-control.bat restart customer-service
```

### Reset Databases

**macOS/Linux**:
```bash
./scripts/unix/init-databases.sh
```

**Windows**:
```cmd
scripts\windows\init-databases.bat
```

### View Service Logs

```bash
# View API Gateway logs
tail -f .pids/api-gateway.log

# View Customer Service logs
tail -f .pids/customer-service.log
```

---

## Troubleshooting

### Port Already in Use

**macOS/Linux**:
```bash
# Find process using port 8000
lsof -ti :8000

# Kill the process
kill $(lsof -ti :8000)
```

**Windows**:
```cmd
REM Find process using port 8000
netstat -ano | findstr ":8000"

REM Kill the process (replace PID)
taskkill /PID <PID> /F
```

### Services Won't Start

1. Check PHP is installed: `php --version`
2. Check Composer is installed: `composer --version`
3. Check npm is installed: `npm --version`
4. Ensure ports 8000-8006 and 5174 are available
5. Check service logs in `.pids/` directory

### Frontend Won't Load

1. Check if frontend is running: `http://localhost:5174`
2. Check browser console for errors
3. Verify npm dependencies: `cd frontends/ops-dashboard && npm install`
4. Restart frontend: `cd frontends/ops-dashboard && npm run dev`

### Database Errors

```bash
# Reset all databases
cd services/api-gateway && php artisan migrate:fresh
cd services/customer-service && php artisan migrate:fresh
# ... repeat for other services
```

---

## Next Steps

1. **Read the Documentation**
   - [API Documentation](docs/API.md)
   - [Architecture Guide](docs/ARCHITECTURE.md)
   - [Full README](README.md)

2. **Test the API**
   - Use the Postman collection
   - Try the cURL examples
   - Explore the endpoints

3. **Explore the Dashboard**
   - Monitor service health
   - View API logs
   - Test the AI chat

4. **Run the Tests**
   ```bash
   cd services/api-gateway && php artisan test
   ```

---

## Need Help?

- 📖 **Documentation**: See `docs/` directory
- 🐛 **Issues**: Check service logs in `.pids/`
- 💬 **Questions**: Review the [README](README.md)

---

**You're all set! Enjoy exploring the platform!** 🎉
