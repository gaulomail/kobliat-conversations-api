@echo off
REM stop-services.bat - Stop all running services on Windows

echo Stopping all services...

REM Stop services by port
for %%p in (8000 8001 8002 8003 8004 8005 8006) do (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%%p "') do (
        echo Stopping service on port %%p (PID: %%a)
        taskkill /PID %%a /F >NUL 2>&1
    )
)

REM Stop frontend (usually on port 5173 or 5174)
for %%p in (5173 5174) do (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%%p "') do (
        echo Stopping frontend on port %%p (PID: %%a)
        taskkill /PID %%a /F >NUL 2>&1
    )
)

REM Clean up PID files
if exist ".pids" (
    del /Q .pids\*.pid 2>NUL
    echo Cleaned up PID files
)

echo All services stopped
