@echo off
REM setup-local.bat - Setup local development environment on Windows

echo ========================================
echo Kobliat Conversations - Local Setup
echo ========================================
echo.

REM Check for required tools
where php >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: PHP is not installed or not in PATH
    exit /b 1
)

where composer >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Composer is not installed or not in PATH
    exit /b 1
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: npm is not installed or not in PATH
    exit /b 1
)

echo [1/5] Installing backend dependencies...
for %%s in (api-gateway customer-service conversation-service messaging-service media-service inbound-gateway chat-simulator) do (
    echo   - Installing %%s dependencies...
    cd services\%%s
    call composer install --quiet
    cd ..\..
)

echo.
echo [2/5] Setting up environment files...
for %%s in (api-gateway customer-service conversation-service messaging-service media-service inbound-gateway chat-simulator) do (
    if not exist "services\%%s\.env" (
        echo   - Creating .env for %%s
        copy "services\%%s\.env.example" "services\%%s\.env" >nul
    )
)

echo.
echo [3/5] Generating application keys...
for %%s in (api-gateway customer-service conversation-service messaging-service media-service inbound-gateway chat-simulator) do (
    echo   - Generating key for %%s
    cd services\%%s
    php artisan key:generate --quiet
    cd ..\..
)

echo.
echo [4/5] Running database migrations...
for %%s in (api-gateway customer-service conversation-service messaging-service media-service inbound-gateway chat-simulator) do (
    echo   - Migrating %%s database
    cd services\%%s
    php artisan migrate --force --quiet
    cd ..\..
)

echo.
echo [5/5] Installing frontend dependencies...
cd frontends\ops-dashboard
call npm install --silent
cd ..\..

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo To start all services, run:
echo   scripts\windows\start-all.bat
echo.
echo Or start services individually:
echo   cd services\api-gateway
echo   php artisan serve --port=8000
echo.
