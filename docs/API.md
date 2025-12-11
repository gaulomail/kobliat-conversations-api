# API Documentation

## Overview

The Kobliat Conversations Platform provides a comprehensive RESTful API for managing multi-channel conversations. All requests go through the API Gateway which routes to appropriate microservices.

## Base URL

```
http://localhost:8000/api/v1
```

## Authentication

All API requests require an API key in the header:

```http
X-API-Key: kobliat-secret-key
```

---

## Customer Service API

### Create Customer

**Endpoint**: `POST /customers`

**Request**:
```json
{
  "external_id": "whatsapp_1234567890",
  "external_type": "whatsapp",
  "name": "John Doe",
  "metadata": {
    "phone": "+1234567890",
    "country": "US"
  }
}
```

**Response**: `201 Created`
```json
{
  "id": "uuid-here",
  "external_id": "whatsapp_1234567890",
  "external_type": "whatsapp",
  "name": "John Doe",
  "metadata": {
    "phone": "+1234567890",
    "country": "US"
  },
  "created_at": "2025-12-11T10:00:00Z",
  "updated_at": "2025-12-11T10:00:00Z"
}
```

### Get Customer

**Endpoint**: `GET /customers/{id}`

**Response**: `200 OK`
```json
{
  "id": "uuid-here",
  "external_id": "whatsapp_1234567890",
  "external_type": "whatsapp",
  "name": "John Doe",
  "metadata": {...},
  "created_at": "2025-12-11T10:00:00Z",
  "updated_at": "2025-12-11T10:00:00Z"
}
```

---

## Conversation Service API

### Create Conversation

**Endpoint**: `POST /conversations`

**Request**:
```json
{
  "type": "direct",
  "participants": [
    "customer-uuid-1",
    "customer-uuid-2"
  ]
}
```

**Response**: `201 Created`
```json
{
  "id": "conversation-uuid",
  "type": "direct",
  "created_at": "2025-12-11T10:00:00Z",
  "updated_at": "2025-12-11T10:00:00Z"
}
```

### Get Conversation

**Endpoint**: `GET /conversations/{id}`

**Response**: `200 OK`
```json
{
  "id": "conversation-uuid",
  "type": "direct",
  "participants": [
    {
      "id": "participant-uuid-1",
      "customer_id": "customer-uuid-1",
      "role": "member"
    },
    {
      "id": "participant-uuid-2",
      "customer_id": "customer-uuid-2",
      "role": "member"
    }
  ],
  "created_at": "2025-12-11T10:00:00Z",
  "updated_at": "2025-12-11T10:00:00Z"
}
```

---

## Messaging Service API

### Send Message

**Endpoint**: `POST /messages`

**Request**:
```json
{
  "conversation_id": "conversation-uuid",
  "sender_customer_id": "customer-uuid",
  "direction": "inbound",
  "body": "Hello, how can I help you?",
  "metadata": {
    "channel": "whatsapp",
    "message_type": "text"
  }
}
```

**Response**: `201 Created`
```json
{
  "id": "message-uuid",
  "conversation_id": "conversation-uuid",
  "sender_customer_id": "customer-uuid",
  "direction": "inbound",
  "body": "Hello, how can I help you?",
  "status": "sent",
  "metadata": {...},
  "created_at": "2025-12-11T10:00:00Z",
  "updated_at": "2025-12-11T10:00:00Z"
}
```

### Get Conversation Messages

**Endpoint**: `GET /conversations/{id}/messages`

**Query Parameters**:
- `limit` (optional): Number of messages to return (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response**: `200 OK`
```json
{
  "data": [
    {
      "id": "message-uuid",
      "conversation_id": "conversation-uuid",
      "sender_customer_id": "customer-uuid",
      "direction": "inbound",
      "body": "Hello!",
      "status": "sent",
      "created_at": "2025-12-11T10:00:00Z"
    }
  ],
  "meta": {
    "total": 1,
    "limit": 50,
    "offset": 0
  }
}
```

### Update Message

**Endpoint**: `PUT /messages/{id}`

**Request**:
```json
{
  "body": "Updated message text",
  "status": "delivered"
}
```

**Response**: `200 OK`
```json
{
  "id": "message-uuid",
  "body": "Updated message text",
  "status": "delivered",
  "updated_at": "2025-12-11T10:05:00Z"
}
```

---

## Media Service API

### Upload Media

**Endpoint**: `POST /media/upload`

**Request**: `multipart/form-data`
```
file: [binary file data]
conversation_id: "conversation-uuid"
```

**Response**: `201 Created`
```json
{
  "id": "media-uuid",
  "filename": "image.jpg",
  "mime_type": "image/jpeg",
  "size": 102400,
  "url": "http://localhost:8004/storage/media/image.jpg",
  "created_at": "2025-12-11T10:00:00Z"
}
```

---

## API Gateway Endpoints

### Get Conversation Details (Aggregated)

**Endpoint**: `GET /conversations/{id}/details`

**Description**: Aggregates data from multiple services

**Response**: `200 OK`
```json
{
  "conversation": {
    "id": "conversation-uuid",
    "type": "direct",
    "created_at": "2025-12-11T10:00:00Z"
  },
  "participants": [
    {
      "id": "customer-uuid-1",
      "name": "John Doe",
      "external_type": "whatsapp"
    }
  ],
  "messages": [
    {
      "id": "message-uuid",
      "body": "Hello!",
      "sender_name": "John Doe",
      "created_at": "2025-12-11T10:00:00Z"
    }
  ],
  "message_count": 5
}
```

### Get API Logs

**Endpoint**: `GET /logs`

**Query Parameters**:
- `method` (optional): Filter by HTTP method
- `status_code` (optional): Filter by status code
- `path` (optional): Filter by request path
- `limit` (optional): Number of logs (default: 50)

**Response**: `200 OK`
```json
{
  "data": [
    {
      "id": "log-uuid",
      "method": "POST",
      "path": "/api/v1/messages",
      "status_code": 201,
      "duration_ms": 45.23,
      "created_at": "2025-12-11T10:00:00Z"
    }
  ],
  "meta": {
    "total": 100,
    "limit": 50
  }
}
```

### Get Service Health

**Endpoint**: `GET /services/health`

**Response**: `200 OK`
```json
{
  "services": {
    "customer-service": {
      "name": "Customer Service",
      "status": "healthy",
      "port": 8001,
      "response_time": 7.3,
      "version": "1.0.0",
      "last_checked": "2025-12-11T10:00:00Z"
    },
    "conversation-service": {...},
    "messaging-service": {...}
  },
  "checked_at": "2025-12-11T10:00:00Z"
}
```

---

## Inbound Gateway API

### WhatsApp Webhook

**Endpoint**: `POST /webhooks/whatsapp`

**Description**: Receives WhatsApp webhook events

**Request**:
```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "business-account-id",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "messages": [
              {
                "from": "1234567890",
                "id": "wamid.xxx",
                "timestamp": "1702300000",
                "type": "text",
                "text": {
                  "body": "Hello!"
                }
              }
            ]
          }
        }
      ]
    }
  ]
}
```

**Response**: `200 OK`
```json
{
  "status": "received",
  "processed": true
}
```

---

## Chat Simulator API

### Run Simulation

**Endpoint**: `POST /simulate`

**Request**:
```json
{
  "scenario": "curious_shopper"
}
```

**Available Scenarios**:
- `curious_shopper` - Polite customer inquiries
- `angry_customer` - Complaint scenarios

**Response**: `200 OK`
```json
{
  "status": "success",
  "generated_message": "Hi, I'm interested in your products...",
  "gateway_response": {...}
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Validation failed",
  "message": "The name field is required.",
  "errors": {
    "name": ["The name field is required."]
  }
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Invalid API key"
}
```

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

---

## Rate Limiting

- **Limit**: 1000 requests per hour per API key
- **Headers**:
  - `X-RateLimit-Limit`: Maximum requests
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset timestamp

---

## Postman Collection

A complete Postman collection is available at:
```
/postman/Kobliat-Conversations.postman_collection.json
```

Import this collection to test all API endpoints.

---

## Examples

### Complete Conversation Flow

```bash
# 1. Create customers
curl -X POST http://localhost:8000/api/v1/customers \
  -H "X-API-Key: kobliat-secret-key" \
  -H "Content-Type: application/json" \
  -d '{"external_id":"user1","external_type":"web","name":"Alice"}'

# 2. Create conversation
curl -X POST http://localhost:8000/api/v1/conversations \
  -H "X-API-Key: kobliat-secret-key" \
  -H "Content-Type: application/json" \
  -d '{"type":"direct","participants":["customer-uuid-1","customer-uuid-2"]}'

# 3. Send message
curl -X POST http://localhost:8000/api/v1/messages \
  -H "X-API-Key: kobliat-secret-key" \
  -H "Content-Type: application/json" \
  -d '{"conversation_id":"conv-uuid","sender_customer_id":"customer-uuid-1","direction":"outbound","body":"Hello!"}'

# 4. Get conversation details
curl http://localhost:8000/api/v1/conversations/conv-uuid/details \
  -H "X-API-Key: kobliat-secret-key"
```

---

## WebSocket Support (Future)

Real-time message delivery via WebSockets is planned for future releases.

---

## Versioning

The API uses URL versioning:
- Current version: `v1`
- Base path: `/api/v1`

---

For more information, see the [main README](../README.md).
