# Kobliat Mini Router 2.0 — Customer & Conversation Services

## 1. Overview
This document contains all sections related to the **Customer Service** and **Conversation Service**, including DDD models, microservice responsibilities, SQL schemas, API endpoints, and event flows.

---

# 2. Customer Service
The Customer Service is responsible for:
- Managing customer identities
- Resolving external platform identifiers
- Storing metadata
- Emitting customer-related events

## 2.1 Customer Aggregate
```
Customer
├── id: UUID
├── externalId: ExternalId
├── externalType: ChannelType
├── name: string
├── metadata: JSON
└── events:
     └── customer.created
```

## 2.2 SQL Schema
```sql
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id TEXT NOT NULL,
    external_type TEXT NOT NULL DEFAULT 'whatsapp',
    name TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (external_type, external_id)
);
```

## 2.3 Customer Identification Flow
1. Receive inbound webhook
2. Extract external_id
3. Search for matching customer
4. If not found → create
5. Emit `customer.created`

---

# 3. Conversation Service
This service manages:
- Direct conversations
- Multi-party conversations
- Group conversations with metadata
- Conversation lifecycle (open/close)
- Conversation participants

## 3.1 Conversation Aggregate
```
Conversation
├── id: UUID
├── type: direct | multi | group
├── status: open | closed | pending
├── groupName?: string
├── groupAvatar?: string
├── participants: Customer[]
├── lastMessageAt: timestamp
└── events:
     ├── conversation.opened
     ├── conversation.closed
     └── conversation.participant.added
```

---

# 3.2 Conversation SQL Schema
```sql
CREATE TYPE conversation_type AS ENUM ('direct','multi','group');
CREATE TYPE conversation_status AS ENUM ('open','closed','pending');

CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type conversation_type NOT NULL DEFAULT 'direct',
    group_name TEXT,
    group_avatar TEXT,
    group_metadata JSONB DEFAULT '{}'::jsonb,
    status conversation_status NOT NULL DEFAULT 'open',
    last_message_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

# 3.3 Conversation Participants
```sql
CREATE TABLE conversation_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL,
    role TEXT DEFAULT 'member',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE (conversation_id, customer_id)
);
```

---

# 3.4 Conversation Rules
### Direct Conversations
- Exactly 2 participants

### Multi Conversations
- 2+ participants

### Group Conversations
- `group_name` required
- roles: owner / admin / member

---

# 3.5 Conversation Events
### Event: `conversation.opened`
```json
{
  "event_id": "uuid",
  "conversation_id": "uuid",
  "type": "group",
  "participants": ["uuid1", "uuid2"],
  "timestamp": "2025-12-01T10:00:00Z"
}
```

### Event: `conversation.participant.added`
```json
{
  "conversation_id": "uuid",
  "customer_id": "uuid",
  "role": "member",
  "timestamp": "2025-12-01T10:05:00Z"
}
```

---

# 4. Customer & Conversation API Endpoints
## GET /conversations
Returns paginated conversations.

## GET /conversations/{id}
Returns conversation with participant list and latest messages.

## POST /conversations/{id}/participants
Adds a participant.

---

# 5. Customer–Conversation Interaction Flow
```
Inbound Webhook
   ↓
Customer Service → Finds/Creates customer
   ↓
Conversation Service → Finds or opens appropriate conversation
   ↓
Message Service → Stores message
   ↓
Events Emitted
```

---

# END OF DOCUMENT

