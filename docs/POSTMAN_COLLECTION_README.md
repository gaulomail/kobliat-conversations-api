# Kobliat Conversations Platform - API Collection

## Overview
This Postman collection provides access to the Kobliat microservices platform with two main approaches:

### 1. **API Gateway (Recommended)** ✅
- **Port**: 8000
- **Base URL**: `http://localhost:8000/api/v1`
- **Authentication**: Required (`X-API-Key: kobliat-secret-key`)
- **Logging**: All requests are logged in the Ops Dashboard
- **Use for**: Production-like testing, monitoring, and debugging

### 2. **Direct Service Access** ⚠️
- **Ports**: 8001-8006 (individual services)
- **Authentication**: Not required
- **Logging**: NOT logged in Ops Dashboard
- **Use for**: Development, debugging individual services

## API Gateway Endpoints

### Customer Service
- `POST /api/v1/customers` - Create a customer
- `GET /api/v1/customers/{id}` - Get customer by ID

### Conversation Service
- `POST /api/v1/conversations` - Create a conversation
- `GET /api/v1/conversations/{id}/details` - Get aggregated conversation details

### Messaging Service
- `POST /api/v1/messages` - Send a message

### Media Service
- `POST /api/v1/media/upload` - Upload media file

### API Logs
- `GET /api/v1/logs` - Get paginated API logs
- `GET /api/v1/logs/{id}` - Get specific log details

## Variables

The collection uses the following variables:

| Variable | Default Value | Description |
|----------|---------------|-------------|
| `api_gateway_url` | `http://localhost:8000` | API Gateway endpoint |
| `api_key` | `kobliat-secret-key` | API authentication key |
| `customer_phone` | `27831234567` | Test phone number |
| `customer_id` | (empty) | Set after creating customer |
| `secondary_customer_id` | (empty) | Set for conversations |
| `conversation_id` | (empty) | Set after creating conversation |
| `message_id` | (empty) | Set after sending message |
| `media_id` | (empty) | Set after uploading media |
| `log_id` | (empty) | Set for log details |

## Typical Workflow

1. **Create Customer**
   ```
   POST /api/v1/customers
   ```
   Save the returned `id` to `customer_id` variable

2. **Create Secondary Customer** (for conversations)
   ```
   POST /api/v1/customers
   ```
   Save the returned `id` to `secondary_customer_id` variable

3. **Create Conversation**
   ```
   POST /api/v1/conversations
   ```
   Save the returned `id` to `conversation_id` variable

4. **Send Message**
   ```
   POST /api/v1/messages
   ```
   Save the returned `id` to `message_id` variable

5. **View Logs**
   ```
   GET /api/v1/logs
   ```
   See all the requests you made in the Ops Dashboard

## Authentication

All API Gateway requests require the `X-API-Key` header:

```
X-API-Key: kobliat-secret-key
```

Direct service access does not require authentication.

## Monitoring

Access the Ops Dashboard at `http://localhost:5173` to:
- View all API requests made through the gateway
- Filter logs by method, status, date range
- Export logs to CSV
- Monitor service health

## Notes

- The API Gateway logs all requests except `/api/v1/logs` (to prevent recursion)
- Direct service calls bypass the gateway and won't appear in logs
- Use the API Gateway for all production-like testing
- The `api_key` variable is set to `kobliat-secret-key` by default
