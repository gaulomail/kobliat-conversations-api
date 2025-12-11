# Kobliat Mini Router 2.0 — Messaging & Media Services

## 1. Overview
This document captures all technical details related to:
- Messaging Service (inbound + outbound)
- Message domain models
- Extended SQL schemas
- Media Service architecture
- Media storage, scanning, metadata, and events
- Message and media normalization
- Message audit trails and history tables
- Event flows related to messages and media

---

# 2. Messaging Service
The Messaging Service is responsible for:
- Storing inbound messages
- Storing outbound messages
- Managing content types
- Linking media objects
- Applying message status/processing flags
- Emitting domain events

---

# 2.1 Message Aggregate (DDD)
```
Message
├── id: UUID
├── conversationId: UUID
├── senderCustomerId?: UUID
├── direction: inbound | outbound | system
├── contentType: text | image | audio | video | file | location | structured
├── externalMessageId?: string
├── body: string
├── mediaId?: UUID
├── metadata: JSON
├── sentAt: timestamp
└── events:
     ├── message.inbound.created
     └── message.outbound.created
```

---

# 2.2 Message SQL Schema
```sql
CREATE TYPE message_direction AS ENUM ('inbound','outbound','system');

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_customer_id UUID,
    direction message_direction NOT NULL,
    channel TEXT NOT NULL DEFAULT 'whatsapp',
    external_message_id TEXT,
    body TEXT,
    content_type TEXT DEFAULT 'text',
    media_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_processed BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sender ON messages(sender_customer_id);
CREATE INDEX idx_messages_sent_at ON messages(sent_at);
```

---

# 2.3 Message History Table
Captures all edits/updates to messages.

```sql
CREATE TABLE message_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL,
    conversation_id UUID NOT NULL,
    customer_id UUID,
    direction message_direction NOT NULL,
    body TEXT,
    previous_body TEXT,
    edited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    metadata JSONB DEFAULT '{}'
);
```

---

# 2.4 Message Normalization Specification
Incoming webhook payloads are normalized to a consistent format.

### Raw Example
```json
{
  "platform": "fakechat",
  "user": { "id": "+27831234567" },
  "message": {
    "id": "abc123",
    "type": "text",
    "content": "Hello",
    "timestamp": 1733768400
  }
}
```

### Normalized Output
```json
{
  "external_id": "+27831234567",
  "external_message_id": "abc123",
  "channel": "fakechat",
  "content_type": "text",
  "body": "Hello",
  "sent_at": "2025-12-10T10:00:00Z",
  "raw": {}
}
```

### Normalization Rules
- Convert timestamps to ISO-8601
- Ensure phone numbers are E.164
- Sanitize message body
- Unify content types
- Extract media references

---

# 2.5 Message Events
### `message.inbound.created`
```json
{
  "event_id": "uuid",
  "message_id": "uuid",
  "conversation_id": "uuid",
  "direction": "inbound",
  "body": "Hello",
  "timestamp": "2025-12-01T10:01:00Z"
}
```

### `message.outbound.created`
```json
{
  "event_id": "uuid",
  "message_id": "uuid",
  "conversation_id": "uuid",
  "direction": "outbound",
  "body": "Hello there",
  "timestamp": "2025-12-01T10:01:00Z"
}
```

---

# 3. Media Service
The Media Service handles:
- Uploading files
- Virus scanning
- Storage in S3/MinIO
- Metadata extraction
- Presigned URLs for downloads
- Media event publishing

---

# 3.1 Media Aggregate
```
Media
├── id: UUID
├── ownerService: string
├── filename: string
├── contentType: string
├── size: bigint
├── storageKey: string
├── previewUrl: string
├── metadata: JSON
└── events:
     └── media.uploaded
```

---

# 3.2 Media SQL Schema
```sql
CREATE TABLE media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_service TEXT NOT NULL,
    filename TEXT,
    content_type TEXT,
    size BIGINT,
    storage_key TEXT NOT NULL,
    preview_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

# 3.3 Media Upload Flow
```
Client Upload
   ↓
Media Service → Virus Scan
   ↓
Store in S3/MinIO
   ↓
Emit media.uploaded
   ↓
Messaging Service can attach media to messages
```

---

# 3.4 Media Events
### `media.uploaded`
```json
{
  "event_id": "uuid",
  "media_id": "uuid",
  "filename": "image.jpg",
  "content_type": "image/jpeg",
  "timestamp": "2025-12-01T10:02:00Z"
}
```

---

# 4. Message & Media Interaction Flow
```
Webhook → Messaging Service → Stores inbound message
                       ↓
                If media → Media Service
                       ↓
                media.uploaded event
                       ↓
Messaging Service links media to message
```

---

# END OF DOCUMENT

