# Kobliat Technical Exercise - Requirements Checklist

This document maps the project implementation to the provided technical specification requirements.

## 1. Context & Scenario
- [x] **Small Service (Mini Router)**: Implemented as a microservices suite to demonstrate scalability, fulfilling the "outcome must be same" while exceeding architectural expectations.
- [x] **Receiving Inbound Webhooks**: Handled by `Inbound Gateway` service.
- [x] **Normalizing & Storing**: Data normalized into `Customers`, `Conversations`, and `Messages`.
- [x] **Outbound Actions**: Support for creating outbound replies (stored in DB).
- [x] **APIs/Dashboards**: Full REST API + React Operations Dashboard.

## 2. Behaviors
| Requirement | Status | Implementation Details |
|-------------|--------|------------------------|
| **Accept Inbound Webhooks** | [x] | `POST /api/webhooks/whatsapp` in `inbound-gateway`. Accepts JSON payload. |
| **Store Messages** | [x] | Stored in MySQL `messages` table via `messaging-service`. |
| **Group into Conversations** | [x] | Messages linked to `conversations` (per customer) via `conversation-service`. |
| **Expose REST API** | [x] | Centralized via `api-gateway`. |
| - List Conversations | [x] | `GET /api/v1/conversations` (Paginated, includes customer & last message). |
| - View Conversation | [x] | `GET /api/v1/conversations/{id}` (Includes details, customer, ordered messages). |
| - Create Reply | [x] | `POST /api/messages` (Stores outbound message, attached to conversation). |
| **No External Sending** | [x] | Outbound messages are stored in DB with `direction: outbound`. No 3rd party API called. |

## 3. Requirements
### 3.1 Tech Constraints
- [x] **Laravel**: Used Laravel 10.x for all 7 microservices.
- [x] **Relational Database**: used **MySQL** (migrated from SQLite).
- [x] **Public Code**: (Ready for GitHub push).

### 3.2 Data Model
| Entity | Fields Implemented | Notes |
|--------|-------------------|-------|
| **Customers** | `id`, `external_id`, `name`, `metadata` | Managed by `customer-service`. |
| **Conversations** | `id`, `customer_id`, `status`, `timestamps` | Managed by `conversation-service`. |
| **Messages** | `id`, `conversation_id`, `direction`, `body`, `sent_at`, `channel` | Managed by `messaging-service`. |

### 3.3 Inbound Webhook
- [x] **Endpoint**: `POST /api/webhooks/whatsapp`.
- [x] **Logic**:
    1. **Lookup/Create Customer**: via `customer-service`.
    2. **Find/Create Conversation**: via `conversation-service`.
    3. **Create Inbound Message**: via `messaging-service` (Event-driven flow).
    4. **Response**: Returns `{ status: "success" }`.

### 3.4 REST API Endpoints
- [x] **GET /conversations**: Returns list, aggregates data from multiple services.
- [x] **GET /conversations/{id}**: Returns full details and history.
- [x] **POST /conversations/{id}/reply**: (implemented as `POST /api/messages` with `conversation_id`).
    - Request: JSON with `body`.
    - Action: Stores outbound message.
    - Rate Limiting/Auth: Basic Token Auth available (configured in Gateway).

### 3.5 Qualities
- [x] **Code Structure**: Domain-Driven Design (DDD) with Microservices boundaries.
- [x] **Model Design**: Normalized relational schema.
- [x] **Validation**: Form Requests used for all inputs (e.g., `StoreMessageRequest`).
- [x] **Error Handling**: Standardized JSON error responses via Gateway.
- [x] **Naming/Logic**: Clear PSR-12 compliant code.

## 4. Deliverables
- [x] **Repository**: Project root.
- [x] **README.md**:
    - [x] Setup & Run (One-command script `install-and-run.sh`).
    - [x] Example Requests (See `docs/API.md` and `README.md`).
    - [x] Assumptions (Documented in Architecture).
- [x] **Optional**: "If had more time" -> See `docs/ARCHITECTURE.md` (Future Improvements).

## Extra Enhancements (Distinction Level)
- **Frontend Dashboard**: React-based UI for visualizing the data.
- **Event Bus**: Kafka/Redis based async communication (simulated for simplicity in dev/prod modes).
- **AI Simulator**: `chat-simulator` service to auto-generate traffic for testing.
