# Service Logs Feature

## Overview
The Ops Dashboard now includes a **Service Logs** page that allows you to view error logs from all microservices in real-time.

## Features

### ✅ What's Included:

1. **Service Selection**
   - View logs from any of the 7 microservices
   - Visual service cards with port numbers
   - Color-coded for easy identification

2. **Log Filtering**
   - **All Logs** - View everything
   - **Errors Only** - Filter for ERROR entries
   - **Warnings Only** - Filter for WARNING entries

3. **Auto-Refresh**
   - Toggle auto-refresh to monitor logs in real-time
   - Refreshes every 5 seconds when enabled

4. **Download Logs**
   - Export logs as `.txt` files
   - Timestamped filenames

5. **Real-Time Data**
   - Fetches actual log files from each service
   - Shows last 500 lines by default
   - Displays file size and existence status

## API Endpoints

### List All Services
```
GET /api/v1/service-logs
Headers: X-API-Key: kobliat-secret-key
```

Response:
```json
[
  {
    "key": "api-gateway",
    "name": "Api Gateway",
    "path": "services/api-gateway/storage/logs/laravel.log",
    "exists": true,
    "size": 1063395,
    "size_human": "1.01 MB"
  },
  ...
]
```

### Get Service Logs
```
GET /api/v1/service-logs/{service}?lines=500&filter=all
Headers: X-API-Key: kobliat-secret-key
```

Parameters:
- `service`: Service key (e.g., `api-gateway`, `customer-service`)
- `lines`: Number of lines to return (default: 500)
- `filter`: Filter type - `all`, `error`, or `warning`

Response:
```json
{
  "service": "api-gateway",
  "logs": "[2025-12-11 14:36:38] local.ERROR: ...",
  "exists": true,
  "lines_returned": 10,
  "filter": "all"
}
```

## Services Monitored

1. **API Gateway** (Port 8000)
2. **Customer Service** (Port 8001)
3. **Conversation Service** (Port 8002)
4. **Messaging Service** (Port 8003)
5. **Media Service** (Port 8004)
6. **Inbound Gateway** (Port 8005)
7. **Chat Simulator** (Port 8006)

## Usage

### Access the Page
Navigate to **Service Logs** in the sidebar or visit:
```
http://localhost:5173/service-logs
```

### View Logs
1. Click on a service card to select it
2. Logs will automatically load
3. Use filter buttons to show only errors or warnings
4. Enable auto-refresh for real-time monitoring

### Download Logs
Click the "Download" button to export current logs as a text file.

## Technical Implementation

### Frontend
- **Component**: `/frontends/ops-dashboard/src/pages/ServiceLogs.tsx`
- **Route**: `/service-logs`
- **API Client**: Fetches from API Gateway

### Backend
- **Controller**: `/services/api-gateway/app/Http/Controllers/ServiceLogController.php`
- **Routes**: Added to `/services/api-gateway/routes/api.php`
- **Authentication**: Requires API key

### Log File Paths
All services store logs in:
```
services/{service-name}/storage/logs/laravel.log
```

## Future Enhancements

Potential improvements:
- WebSocket streaming for real-time updates
- Search functionality within logs
- Date range filtering
- Log level statistics
- Export to different formats (JSON, CSV)
- Tail mode (follow logs as they're written)

## Troubleshooting

### Logs Not Showing
1. Ensure the service is running
2. Check if log files exist in `storage/logs/`
3. Verify API Gateway is accessible
4. Confirm API key is correct

### Empty Logs
- Service may not have generated any logs yet
- Trigger some requests to generate log entries
- Check file permissions on log directories

## Command Line Alternative

To view logs directly from terminal:
```bash
# View last 50 lines
tail -n 50 services/api-gateway/storage/logs/laravel.log

# Follow logs in real-time
tail -f services/api-gateway/storage/logs/laravel.log

# Filter for errors only
grep "ERROR" services/api-gateway/storage/logs/laravel.log
```
