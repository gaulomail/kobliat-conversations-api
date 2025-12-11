# Kobliat Mini Router 2.0 — Gateways & Simulator (Part 1)

This document is the first half of the split from the original Gateway/Simulator/Infrastructure document. It includes:
- Inbound Gateway Service
- API Gateway / BFF
- Chat Simulator (Gemini-powered)
- Event Bus & Topics
- Logging, Monitoring & Tracing (Service-Level)
- Security (Service-Level)

---

# 1. Inbound Gateway Service
## Purpose
Receives webhooks, normalizes payloads, enforces idempotency, and publishes events.

## Responsibilities
- Handle `/webhooks/messages`
- Persist raw payloads
- Normalize inbound messages
- Enforce idempotency
- Publish `webhook.inbound.received`

## Raw Webhook SQL
```sql
CREATE TABLE inbound_webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform TEXT NOT NULL,
    raw_payload JSONB,
    received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    external_message_id TEXT,
    channel TEXT,
    processed BOOLEAN NOT NULL DEFAULT FALSE,
    processed_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX uniq_inbound_external ON inbound_webhooks(channel, external_message_id) WHERE external_message_id IS NOT NULL;
```

## Example Flow
1. Receive webhook → store raw
2. Normalize → internal structure
3. Check idempotency
4. Publish event

---

# 2. API Gateway / Backend-for-Frontend
## Purpose
Unified external API surface.

## Responsibilities
- Public routes `/v1/*`
- Aggregate multiple microservices
- Host OpenAPI
- Auth, CORS, throttling

## Example Routes
- `GET /v1/conversations`
- `POST /v1/conversations/{id}/reply`
- `POST /v1/media/upload`

---

# 3. Chat Simulator (Gemini-powered)
## Purpose
Simulates inbound messages using LLMs.

## Features
- Personas and scenarios
- Multimedia simulation
- Controlled delays
- Batch mode

## Example Scenario
```json
{
  "name": "angry_group",
  "personas": [
    {"name":"Zola","tone":"angry"},
    {"name":"Thabo","tone":"calm"}
  ],
  "messages": [
    {"from":"Zola","type":"text","prompt":"Where is my order?"},
    {"from":"Thabo","type":"text","prompt":"Please hold on."}
  ]
}
```

---

# 4. Event Bus & Topics
## Topics
- `webhook.inbound.received`
- `customer.upserted`
- `conversation.opened`
- `conversation.participant.added`
- `message.inbound.created`
- `message.outbound.created`
- `media.uploaded`
- `error.critical`

## Event Envelope
```json
{
  "event_id": "uuid",
  "trace_id": "uuid",
  "occurred_at": "2025-12-10T10:00:00Z",
  "source_service": "inbound-gateway",
  "topic": "webhook.inbound.received",
  "payload": {}
}
```

---

# 5. Logging, Monitoring & Tracing (Service-Level)
## OpenTelemetry
- OTLP tracing
- Spans across services

## Logging Fields
- timestamp
- service
- trace_id
- span_id
- endpoint
- status_code

## Metrics
- HTTP request count
- Latency histograms
- Message ingestion counters

---

# 6. Security (Service-Level)
## Authentication
- API Keys / JWT at Gateway
- mTLS or service JWT for internal calls

## Secrets
- Stored via Vault/KMS
- K8s secrets for runtime

## Data Protection
- Mask sensitive fields
- Encrypt PII at rest

---

# END OF PART 1

