@echo off
REM start-all.bat - Start all Laravel services and frontend concurrently on Windows

where npx >nul 2>nul
if %errorlevel% neq 0 (
    echo npx is required but not installed. Please install Node.js.
    exit /b 1
)

echo Starting all microservices...
npx concurrently ^
  --names "GATEWAY,CUSTOMER,CONVO,MSG,MEDIA,INBOUND,SIM,FRONTEND" ^
  --prefix-colors "blue,green,magenta,yellow,cyan,red,white,orange" ^
  "cd services/api-gateway && php artisan serve --port=8000" ^
  "cd services/customer-service && php artisan serve --port=8001" ^
  "cd services/conversation-service && php artisan serve --port=8002" ^
  "cd services/messaging-service && php artisan serve --port=8003" ^
  "cd services/media-service && php artisan serve --port=8004" ^
  "cd services/inbound-gateway && php artisan serve --port=8005" ^
  "cd services/chat-simulator && php artisan serve --port=8006" ^
  "cd frontends/ops-dashboard && npm run dev"
