# Architecture Guide

## System Architecture

The Kobliat Conversations Platform is built using a **microservices architecture** with event-driven communication patterns.

## Design Principles

### 1. Service Independence
- Each service has its own database
- Services communicate via APIs
- No direct database access between services
- Independent deployment and scaling

### 2. API Gateway Pattern
- Single entry point for clients
- Request routing and aggregation
- Centralized logging and monitoring
- Authentication and authorization

### 3. Event-Driven Communication
- Asynchronous message processing
- Loose coupling between services
- Scalable message handling
- Event sourcing ready

### 4. Database Per Service
- Each service owns its data
- SQLite for development
- MySQL/PostgreSQL for production
- Data isolation and independence

---

## Service Architecture

### API Gateway

```
┌─────────────────────────────────────────┐
│           API Gateway (8000)             │
├─────────────────────────────────────────┤
│  Controllers:                            │
│  - GatewayController                     │
│  - ApiLogController                      │
│  - ServiceHealthController               │
│                                          │
│  Middleware:                             │
│  - ApiKeyMiddleware                      │
│  - LogRequestsMiddleware                 │
│  - CORS                                  │
│                                          │
│  Features:                               │
│  - Request Routing                       │
│  - Response Aggregation                  │
│  - API Logging                           │
│  - Service Health Checks                 │
└─────────────────────────────────────────┘
```

**Responsibilities**:
- Route requests to appropriate services
- Aggregate responses from multiple services
- Log all API requests and responses
- Monitor service health
- Handle authentication

**Database Schema**:
```sql
api_logs
├── id (uuid)
├── method (string)
├── path (string)
├── query_params (json)
├── request_body (json)
├── response_body (json)
├── status_code (integer)
├── duration_ms (float)
├── ip_address (string)
└── created_at (timestamp)
```

### Customer Service

```
┌─────────────────────────────────────────┐
│        Customer Service (8001)           │
├─────────────────────────────────────────┤
│  Models:                                 │
│  - Customer                              │
│                                          │
│  Controllers:                            │
│  - CustomerController                    │
│                                          │
│  Features:                               │
│  - CRUD operations                       │
│  - External ID mapping                   │
│  - Metadata storage                      │
│  - Search and filtering                  │
└─────────────────────────────────────────┘
```

**Database Schema**:
```sql
customers
├── id (uuid)
├── external_id (string, unique)
├── external_type (string)
├── name (string)
├── metadata (json)
├── created_at (timestamp)
└── updated_at (timestamp)
```

### Conversation Service

```
┌─────────────────────────────────────────┐
│      Conversation Service (8002)         │
├─────────────────────────────────────────┤
│  Models:                                 │
│  - Conversation                          │
│  - Participant                           │
│                                          │
│  Controllers:                            │
│  - ConversationController                │
│                                          │
│  Features:                               │
│  - Conversation lifecycle                │
│  - Participant management                │
│  - Conversation types                    │
└─────────────────────────────────────────┘
```

**Database Schema**:
```sql
conversations
├── id (uuid)
├── type (enum: direct, group, channel)
├── created_at (timestamp)
└── updated_at (timestamp)

participants
├── id (uuid)
├── conversation_id (uuid, foreign)
├── customer_id (uuid)
├── role (enum: member, admin)
├── joined_at (timestamp)
└── left_at (timestamp, nullable)
```

### Messaging Service

```
┌─────────────────────────────────────────┐
│       Messaging Service (8003)           │
├─────────────────────────────────────────┤
│  Models:                                 │
│  - Message                               │
│                                          │
│  Controllers:                            │
│  - MessageController                     │
│                                          │
│  Features:                               │
│  - Message storage                       │
│  - Message retrieval                     │
│  - Message updates                       │
│  - Status tracking                       │
└─────────────────────────────────────────┘
```

**Database Schema**:
```sql
messages
├── id (uuid)
├── conversation_id (uuid)
├── sender_customer_id (uuid)
├── direction (enum: inbound, outbound)
├── body (text)
├── status (enum: sent, delivered, read)
├── metadata (json)
├── created_at (timestamp)
└── updated_at (timestamp)
```

### Media Service

```
┌─────────────────────────────────────────┐
│         Media Service (8004)             │
├─────────────────────────────────────────┤
│  Models:                                 │
│  - Media                                 │
│                                          │
│  Controllers:                            │
│  - MediaController                       │
│                                          │
│  Features:                               │
│  - File upload                           │
│  - File storage                          │
│  - File serving                          │
│  - Image processing                      │
└─────────────────────────────────────────┘
```

**Database Schema**:
```sql
media
├── id (uuid)
├── conversation_id (uuid)
├── filename (string)
├── mime_type (string)
├── size (integer)
├── path (string)
├── created_at (timestamp)
└── updated_at (timestamp)
```

### Inbound Gateway

```
┌─────────────────────────────────────────┐
│       Inbound Gateway (8005)             │
├─────────────────────────────────────────┤
│  Controllers:                            │
│  - WhatsAppWebhookController             │
│                                          │
│  Features:                               │
│  - Webhook receiver                      │
│  - Message normalization                 │
│  - Event distribution                    │
│  - Channel integration                   │
└─────────────────────────────────────────┘
```

### Chat Simulator

```
┌─────────────────────────────────────────┐
│        Chat Simulator (8006)             │
├─────────────────────────────────────────┤
│  Services:                               │
│  - GeminiService                         │
│  - ScenarioEngine                        │
│                                          │
│  Controllers:                            │
│  - SimulatorController                   │
│                                          │
│  Features:                               │
│  - AI message generation                 │
│  - Scenario-based testing                │
│  - Fallback responses                    │
└─────────────────────────────────────────┘
```

---

## Communication Patterns

### Synchronous Communication (HTTP/REST)

```
Client → API Gateway → Service → Database
                ↓
            Response
```

**Use Cases**:
- CRUD operations
- Real-time queries
- Request-response patterns

### Asynchronous Communication (Events)

```
Service A → Message Bus → Service B
                ↓
            Event Queue
```

**Use Cases**:
- Notifications
- Background processing
- Event sourcing

---

## Data Flow

### Creating a Conversation

```
1. Client → API Gateway: POST /conversations
2. API Gateway → Customer Service: Validate participants
3. API Gateway → Conversation Service: Create conversation
4. Conversation Service → Database: Insert conversation
5. Conversation Service → Database: Insert participants
6. Conversation Service → API Gateway: Return conversation
7. API Gateway → Client: Return response
```

### Sending a Message

```
1. Client → API Gateway: POST /messages
2. API Gateway → Messaging Service: Create message
3. Messaging Service → Database: Insert message
4. Messaging Service → Message Bus: Publish event
5. Message Bus → Notification Service: Send notification
6. Messaging Service → API Gateway: Return message
7. API Gateway → Client: Return response
```

### Receiving a Webhook

```
1. WhatsApp → Inbound Gateway: POST /webhooks/whatsapp
2. Inbound Gateway → Normalize message
3. Inbound Gateway → Customer Service: Get/create customer
4. Inbound Gateway → Conversation Service: Get/create conversation
5. Inbound Gateway → Messaging Service: Create message
6. Inbound Gateway → WhatsApp: Return 200 OK
```

---

## Scalability

### Horizontal Scaling

Each service can be scaled independently:

```
Load Balancer
     ├── API Gateway Instance 1
     ├── API Gateway Instance 2
     └── API Gateway Instance 3

Load Balancer
     ├── Customer Service Instance 1
     ├── Customer Service Instance 2
     └── Customer Service Instance 3
```

### Database Scaling

- **Read Replicas**: For read-heavy services
- **Sharding**: For large datasets
- **Caching**: Redis for frequently accessed data

### Message Queue

- **RabbitMQ** or **Kafka** for event distribution
- **Dead Letter Queues** for failed messages
- **Message persistence** for reliability

---

## Security

### API Authentication

- API Key authentication
- JWT tokens (future)
- OAuth 2.0 (future)

### Service-to-Service Communication

- Internal API keys
- mTLS (mutual TLS)
- Service mesh (future)

### Data Security

- Encryption at rest
- Encryption in transit (HTTPS)
- Database encryption

---

## Monitoring & Observability

### Logging

- **Centralized Logging**: All services log to central system
- **Structured Logging**: JSON format
- **Log Levels**: DEBUG, INFO, WARNING, ERROR, CRITICAL

### Metrics

- **Service Health**: Uptime, response time
- **API Metrics**: Request count, error rate
- **Business Metrics**: Messages sent, conversations created

### Tracing

- **Distributed Tracing**: Track requests across services
- **Correlation IDs**: Link related requests
- **Performance Profiling**: Identify bottlenecks

---

## Deployment Architecture

### Development

```
Local Machine
├── Service 1 (PHP artisan serve)
├── Service 2 (PHP artisan serve)
├── ...
└── Frontend (npm run dev)
```

### Production

```
Load Balancer (Nginx)
     ↓
┌─────────────────────────────────────┐
│         Application Servers          │
│  ├── API Gateway (PM2)              │
│  ├── Customer Service (PM2)         │
│  ├── Conversation Service (PM2)     │
│  └── ...                            │
└─────────────────────────────────────┘
     ↓
┌─────────────────────────────────────┐
│         Database Cluster             │
│  ├── Primary (Read/Write)           │
│  └── Replicas (Read)                │
└─────────────────────────────────────┘
```

---

## Technology Decisions

### Why Laravel?

- ✅ Mature PHP framework
- ✅ Built-in API support
- ✅ Excellent ORM (Eloquent)
- ✅ Strong ecosystem
- ✅ Easy testing

### Why Microservices?

- ✅ Independent scaling
- ✅ Technology flexibility
- ✅ Fault isolation
- ✅ Team autonomy
- ✅ Easier maintenance

### Why SQLite (Development)?

- ✅ Zero configuration
- ✅ Fast setup
- ✅ No external dependencies
- ✅ Easy testing
- ✅ Portable

### Why React?

- ✅ Component-based
- ✅ Large ecosystem
- ✅ Strong TypeScript support
- ✅ Excellent tooling
- ✅ Active community

---

## Future Enhancements

### Planned Features

1. **WebSocket Support** - Real-time message delivery
2. **GraphQL API** - Flexible data querying
3. **Service Mesh** - Advanced service communication
4. **Event Sourcing** - Complete event history
5. **CQRS** - Command Query Responsibility Segregation
6. **Kubernetes** - Container orchestration
7. **Monitoring Dashboard** - Grafana + Prometheus
8. **API Rate Limiting** - Advanced throttling
9. **Multi-tenancy** - Support multiple organizations
10. **Advanced Analytics** - Business intelligence

---

## Best Practices

### Code Organization

- Follow PSR-12 coding standards
- Use dependency injection
- Write testable code
- Document public APIs

### Database

- Use migrations for schema changes
- Index frequently queried columns
- Avoid N+1 queries
- Use transactions for data integrity

### API Design

- RESTful conventions
- Consistent error responses
- Versioning
- Pagination for lists

### Testing

- Unit tests for business logic
- Feature tests for APIs
- Integration tests for services
- End-to-end tests for workflows

---

For more information, see:
- [API Documentation](API.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Testing Guide](TESTING.md)
