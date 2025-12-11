# Scripts Directory

This directory contains scripts to manage the Kobliat Conversations microservices platform.

## Directory Structure

```
scripts/
├── unix/          # Scripts for Unix-based systems (Linux, macOS)
│   ├── start-all.sh
│   ├── stop-services.sh
│   ├── service-control.sh
│   ├── setup-local.sh
│   └── init-databases.sh
│
└── windows/       # Scripts for Windows systems
    ├── start-all.bat
    ├── stop-services.bat
    ├── service-control.bat
    ├── setup-local.bat
    └── init-databases.bat
```

## Available Scripts

### 1. Setup Scripts

#### Unix/macOS
```bash
# Initial setup - install dependencies, configure environment
./scripts/unix/setup-local.sh
```

#### Windows
```cmd
REM Initial setup - install dependencies, configure environment
scripts\windows\setup-local.bat
```

### 2. Start All Services

#### Unix/macOS
```bash
# Start all microservices and frontend
./scripts/unix/start-all.sh
```

#### Windows
```cmd
REM Start all microservices and frontend
scripts\windows\start-all.bat
```

### 3. Stop All Services

#### Unix/macOS
```bash
# Stop all running services
./scripts/unix/stop-services.sh
```

#### Windows
```cmd
REM Stop all running services
scripts\windows\stop-services.bat
```

### 4. Service Control (Individual Services)

#### Unix/macOS
```bash
# Start a service
./scripts/unix/service-control.sh start customer-service

# Stop a service
./scripts/unix/service-control.sh stop customer-service

# Restart a service
./scripts/unix/service-control.sh restart customer-service

# Check service status
./scripts/unix/service-control.sh status customer-service
```

#### Windows
```cmd
REM Start a service
scripts\windows\service-control.bat start customer-service

REM Stop a service
scripts\windows\service-control.bat stop customer-service

REM Restart a service
scripts\windows\service-control.bat restart customer-service

REM Check service status
scripts\windows\service-control.bat status customer-service
```

### 5. Database Initialization

#### Unix/macOS
```bash
# Initialize all databases (fresh migration with seeds)
./scripts/unix/init-databases.sh
```

#### Windows
```cmd
REM Initialize all databases (fresh migration with seeds)
scripts\windows\init-databases.bat
```

## Services

The following services are managed by these scripts:

| Service | Port | Description |
|---------|------|-------------|
| api-gateway | 8000 | Main API Gateway |
| customer-service | 8001 | Customer management |
| conversation-service | 8002 | Conversation management |
| messaging-service | 8003 | Message handling |
| media-service | 8004 | Media file management |
| inbound-gateway | 8005 | Webhook receiver |
| chat-simulator | 8006 | Chat simulation & testing |
| ops-dashboard | 5174 | Frontend dashboard |

## Prerequisites

### All Platforms
- PHP 8.1 or higher
- Composer
- Node.js 18+ and npm
- SQLite (for local development)

### Unix/macOS Additional
- Bash shell
- `lsof` command (usually pre-installed)

### Windows Additional
- PowerShell or Command Prompt
- `netstat` command (usually pre-installed)

## Quick Start

### Unix/macOS

```bash
# 1. Setup environment
./scripts/unix/setup-local.sh

# 2. Start all services
./scripts/unix/start-all.sh

# 3. Access dashboard
# Open http://localhost:5174
```

### Windows

```cmd
REM 1. Setup environment
scripts\windows\setup-local.bat

REM 2. Start all services
scripts\windows\start-all.bat

REM 3. Access dashboard
REM Open http://localhost:5174
```

## Troubleshooting

### Port Already in Use

**Unix/macOS:**
```bash
# Find process using port 8000
lsof -ti :8000

# Kill process
kill $(lsof -ti :8000)
```

**Windows:**
```cmd
REM Find process using port 8000
netstat -ano | findstr ":8000"

REM Kill process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Services Won't Start

1. Check PHP is installed: `php --version`
2. Check Composer is installed: `composer --version`
3. Check npm is installed: `npm --version`
4. Ensure ports 8000-8006 and 5174 are available
5. Check service logs in `.pids/` directory

### Permission Denied (Unix/macOS)

```bash
# Make scripts executable
chmod +x scripts/unix/*.sh
```

## Development Workflow

### Starting Development

```bash
# Unix/macOS
./scripts/unix/start-all.sh

# Windows
scripts\windows\start-all.bat
```

### Stopping Development

```bash
# Unix/macOS
./scripts/unix/stop-services.sh

# Windows
scripts\windows\stop-services.bat
```

### Restarting a Single Service

```bash
# Unix/macOS
./scripts/unix/service-control.sh restart customer-service

# Windows
scripts\windows\service-control.bat restart customer-service
```

### Resetting Databases

```bash
# Unix/macOS
./scripts/unix/init-databases.sh

# Windows
scripts\windows\init-databases.bat
```

## Notes

- **Unix scripts** use `.sh` extension and require bash
- **Windows scripts** use `.bat` extension and run in Command Prompt
- All scripts should be run from the project root directory
- PID files are stored in `.pids/` directory
- Service logs are stored in `.pids/<service>.log`

## Support

For issues or questions:
1. Check the main project README
2. Review service-specific documentation
3. Check the troubleshooting section above
