@echo off
REM init-databases.bat - Initialize all service databases on Windows

echo Initializing databases for all services...

for %%s in (api-gateway customer-service conversation-service messaging-service media-service inbound-gateway chat-simulator) do (
    echo.
    echo [%%s] Running migrations...
    cd services\%%s
    php artisan migrate:fresh --seed
    cd ..\..
)

echo.
echo All databases initialized successfully!
