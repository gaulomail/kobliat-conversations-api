# Async Outbound Communication - Implementation Status

## ✅ Already Implemented

### Messaging Service - Outbound Messages

**File**: `/services/messaging-service/app/Jobs/SendOutboundMessage.php`

**Status**: ✅ **FULLY ASYNC WITH RETRY LOGIC**

**Features**:
- Async job-based processing
- 3 retry attempts with exponential backoff (10s, 30s, 60s)
- Multi-channel support (WhatsApp, SMS, Email)
- Comprehensive error logging
- Automatic failure tracking

**Channels Supported**:
1. **WhatsApp** → `WHATSAPP_API_URL`
2. **SMS** → `SMS_API_URL`  
3. **Email** → Laravel Mail
4. **Generic/Web** → Configurable endpoint

**How It Works**:
```php
// When creating an outbound message
POST /api/messages
{
  "direction": "outbound",
  "channel": "whatsapp",
  "body": "Hello!",
  "metadata": {"recipient": "+1234567890"}
}

// Message is immediately queued (async)
// Job processes in background with retries
```

## 📊 Current Architecture

### Inbound Flow (Synchronous - Correct)
```
External Webhook → Inbound Gateway → Customer Service
                                   → Conversation Service  
                                   → Messaging Service
```
**Why Synchronous**: Need immediate response to webhook, internal services are fast

### Outbound Flow (Asynchronous - Implemented)
```
API Request → Queue Message → Background Job → External API
                                             ↓ (retry on failure)
                                          External API
                                             ↓ (retry on failure)
                                          External API
```
**Why Async**: External APIs can be slow/unreliable, need retries

## 🔄 Internal Service Communication

**Current**: Synchronous HTTP calls between services
**Status**: ✅ **CORRECT - Should remain synchronous**

**Reasoning**:
- Internal services are on same network (fast)
- Need immediate feedback for business logic
- Failures should be handled at request level
- Simpler debugging and tracing

**Examples** (Should stay sync):
- Inbound Gateway → Customer Service (create/find customer)
- Inbound Gateway → Conversation Service (create/find conversation)
- Inbound Gateway → Messaging Service (store inbound message)
- API Gateway → Any service (request routing)

## 🌐 External API Calls

**Current**: Async with retry via Laravel Queue
**Status**: ✅ **IMPLEMENTED**

**Examples** (Should be async):
- ✅ WhatsApp Business API (sending messages)
- ✅ SMS Provider API (Twilio, etc.)
- ✅ Email Service (SMTP, SendGrid, etc.)
- ✅ Any third-party webhook delivery

## 📝 Summary

| Type | Current State | Correct? |
|------|---------------|----------|
| **Outbound to External APIs** | ✅ Async with retry | ✅ Yes |
| **Inbound Webhook Processing** | Synchronous | ✅ Yes |
| **Inter-Service Communication** | Synchronous | ✅ Yes |

## 🚀 To Use Async Outbound

### 1. Start Queue Worker

```bash
cd services/messaging-service
php artisan queue:work --tries=3
```

### 2. Configure External APIs

Add to `.env`:
```bash
# WhatsApp Business API
WHATSAPP_API_URL=https://graph.facebook.com/v17.0/YOUR_PHONE_ID/messages
WHATSAPP_ACCESS_TOKEN=your_token

# SMS Provider (Twilio)
SMS_API_URL=https://api.twilio.com/2010-04-01/Accounts/YOUR_SID/Messages.json
TWILIO_AUTH_TOKEN=your_token

# Email
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
```

### 3. Send Outbound Message

```bash
curl -X POST http://localhost:8003/api/messages \
  -H "Content-Type: application/json" \
  -d '{
    "conversation_id": "uuid",
    "direction": "outbound",
    "channel": "whatsapp",
    "body": "Your message here",
    "metadata": {
      "recipient": "+1234567890"
    }
  }'
```

## 📖 Documentation

See `/docs/OUTBOUND_MESSAGES.md` for complete documentation including:
- Configuration
- Monitoring
- Troubleshooting
- Production deployment
- Supervisor setup

## ✨ Benefits

1. **Non-blocking**: API responses are instant
2. **Reliable**: Automatic retries on failure
3. **Scalable**: Queue workers can be scaled independently
4. **Observable**: All attempts are logged
5. **Resilient**: Handles temporary external API outages

## 🔮 Future Enhancements

- [ ] Priority queues for urgent messages
- [ ] Delivery receipts via webhooks
- [ ] Rate limiting per channel
- [ ] Dead letter queue for permanent failures
- [ ] Real-time status updates via WebSockets
