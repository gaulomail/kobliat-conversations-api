@echo off
REM service-control.bat - Service control script for Windows

setlocal enabledelayedexpansion

set SERVICE_DIR=services
set PID_DIR=.pids

REM Create PID directory if it doesn't exist
if not exist "%PID_DIR%" mkdir "%PID_DIR%"

REM Function to get service port
if "%2"=="api-gateway" set PORT=8000
if "%2"=="customer-service" set PORT=8001
if "%2"=="conversation-service" set PORT=8002
if "%2"=="messaging-service" set PORT=8003
if "%2"=="media-service" set PORT=8004
if "%2"=="inbound-gateway" set PORT=8005
if "%2"=="chat-simulator" set PORT=8006

if "%1"=="start" goto start_service
if "%1"=="stop" goto stop_service
if "%1"=="restart" goto restart_service
if "%1"=="status" goto status_service
goto usage

:start_service
    if exist "%PID_DIR%\%2.pid" (
        set /p PID=<"%PID_DIR%\%2.pid"
        tasklist /FI "PID eq !PID!" 2>NUL | find /I /N "php.exe">NUL
        if "!ERRORLEVEL!"=="0" (
            echo Service %2 is already running (PID: !PID!)
            exit /b 0
        )
    )
    
    cd "%SERVICE_DIR%\%2"
    start /B php artisan serve --port=%PORT% > "..\..\%PID_DIR%\%2.log" 2>&1
    
    REM Get the PID of the last started process (simplified for Windows)
    for /f "tokens=2" %%a in ('tasklist /FI "IMAGENAME eq php.exe" /NH') do set LAST_PID=%%a
    echo !LAST_PID! > "..\..\%PID_DIR%\%2.pid"
    cd ..\..
    
    echo Started %2 on port %PORT%
    exit /b 0

:stop_service
    if exist "%PID_DIR%\%2.pid" (
        set /p PID=<"%PID_DIR%\%2.pid"
        taskkill /PID !PID! /F >NUL 2>&1
        del "%PID_DIR%\%2.pid"
        echo Stopped %2 (PID: !PID!)
        exit /b 0
    )
    
    REM Try to find by port
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%PORT% "') do (
        taskkill /PID %%a /F >NUL 2>&1
        echo Stopped %2 running on port %PORT% (PID: %%a)
        exit /b 0
    )
    
    echo Service %2 is not running
    exit /b 0

:restart_service
    call :stop_service
    timeout /t 1 /nobreak >NUL
    call :start_service
    exit /b 0

:status_service
    if exist "%PID_DIR%\%2.pid" (
        set /p PID=<"%PID_DIR%\%2.pid"
        tasklist /FI "PID eq !PID!" 2>NUL | find /I /N "php.exe">NUL
        if "!ERRORLEVEL!"=="0" (
            echo running:!PID!
            exit /b 0
        ) else (
            del "%PID_DIR%\%2.pid"
        )
    )
    
    REM Check if port is in use
    netstat -ano | findstr ":%PORT% " >NUL 2>&1
    if "!ERRORLEVEL!"=="0" (
        for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%PORT% "') do (
            echo running:%%a
            exit /b 0
        )
    )
    
    echo stopped
    exit /b 0

:usage
    echo Usage: %0 {start^|stop^|restart^|status} ^<service-name^>
    echo Services: api-gateway, customer-service, conversation-service, messaging-service, media-service, inbound-gateway, chat-simulator
    exit /b 1
