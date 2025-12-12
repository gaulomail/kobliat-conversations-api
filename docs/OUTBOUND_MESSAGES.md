# Outbound Message Processing

## Overview

Outbound messages in the Kobliat platform are processed **asynchronously** with **automatic retry logic** to ensure reliable delivery even when external services are temporarily unavailable.

## Features

### ✅ Async Processing
- Outbound messages are queued immediately and processed in the background
- HTTP responses are returned instantly without waiting for delivery
- Non-blocking architecture ensures high throughput

### ✅ Automatic Retries
- **3 retry attempts** if sending fails
- **Exponential backoff**: 10s → 30s → 60s between retries
- Failed messages are logged and marked in the database

### ✅ Multi-Channel Support
- WhatsApp
- SMS
- Email
- Web/Generic

## How It Works

### 1. Message Creation (Synchronous)

When an outbound message is created via the API:

```bash
POST /api/messages
{
  "conversation_id": "uuid",
  "direction": "outbound",
  "body": "Hello, this is a test message",
  "channel": "whatsapp",
  "metadata": {
    "recipient": "+1234567890"
  }
}
```

The message is:
1. Saved to the database with `is_processed = false`
2. Queued for async processing
3. HTTP 201 response returned immediately

### 2. Background Processing (Async)

The `SendOutboundMessage` job:
1. Picks up the message from the queue
2. Attempts to send via the specified channel
3. Updates message status on success
4. Retries on failure (up to 3 times)

### 3. Retry Logic

```
Attempt 1: Immediate
   ↓ (fails)
Wait 10 seconds
   ↓
Attempt 2: After 10s
   ↓ (fails)
Wait 30 seconds
   ↓
Attempt 3: After 30s
   ↓ (fails)
Wait 60 seconds
   ↓
Final Attempt: After 60s
   ↓ (fails)
Mark as permanently failed
```

## Configuration

### Queue Connection

Set in `.env`:
```bash
QUEUE_CONNECTION=database  # or redis, sqs, etc.
```

### Channel Endpoints

Configure external service URLs:
```bash
# WhatsApp API
WHATSAPP_API_URL=https://api.whatsapp.com/send

# SMS Provider (Twilio, etc.)
SMS_API_URL=https://api.twilio.com/sms/send

# Email Service
MAIL_MAILER=smtp
```

## Running the Queue Worker

To process outbound messages, you must run a queue worker:

```bash
# Development
php artisan queue:work --tries=3

# Production (with supervisor)
php artisan queue:work --tries=3 --timeout=90 --sleep=3
```

### Supervisor Configuration

For production, use Supervisor to keep the queue worker running:

```ini
[program:kobliat-messaging-queue]
process_name=%(program_name)s_%(process_num)02d
command=php /path/to/kobliat/services/messaging-service/artisan queue:work --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=/var/log/kobliat/messaging-queue.log
stopwaitsecs=3600
```

## Monitoring

### Check Queue Status

```bash
# View pending jobs
php artisan queue:monitor

# View failed jobs
php artisan queue:failed
```

### Retry Failed Jobs

```bash
# Retry all failed jobs
php artisan queue:retry all

# Retry specific job
php artisan queue:retry <job-id>
```

### Clear Failed Jobs

```bash
php artisan queue:flush
```

## Message States

| State | `is_processed` | `sent_at` | Description |
|-------|----------------|-----------|-------------|
| **Queued** | `false` | `null` | Message created, waiting in queue |
| **Sending** | `false` | `null` | Job picked up, attempting to send |
| **Sent** | `true` | `timestamp` | Successfully delivered |
| **Failed** | `false` | `null` | Permanently failed after retries |

## Logging

All outbound message attempts are logged:

```php
// Success
Log::info("Successfully sent outbound message", [
    'message_id' => $message->id,
]);

// Retry
Log::error("Error sending outbound message", [
    'message_id' => $message->id,
    'attempt' => 2,
    'error' => $exception->getMessage(),
]);

// Permanent Failure
Log::error("Outbound message failed after 3 attempts", [
    'message_id' => $message->id,
]);
```

## Testing

### Test Outbound Message

```bash
curl -X POST http://localhost:8003/api/messages \
  -H "Content-Type: application/json" \
  -d '{
    "conversation_id": "your-conversation-id",
    "direction": "outbound",
    "body": "Test message",
    "channel": "whatsapp",
    "metadata": {"recipient": "+1234567890"}
  }'
```

### Monitor Queue

```bash
# Watch the queue worker logs
tail -f storage/logs/laravel.log | grep "outbound message"
```

## Best Practices

1. **Always run queue workers** in production
2. **Monitor failed jobs** regularly
3. **Set up alerts** for high failure rates
4. **Use Redis** for better queue performance in production
5. **Configure proper timeouts** to avoid stuck jobs
6. **Implement idempotency** in external API calls

## Troubleshooting

### Messages Not Being Sent

1. Check if queue worker is running:
   ```bash
   ps aux | grep "queue:work"
   ```

2. Check queue connection in `.env`:
   ```bash
   QUEUE_CONNECTION=database
   ```

3. Verify jobs table exists:
   ```bash
   php artisan migrate
   ```

### High Failure Rate

1. Check external API credentials
2. Verify network connectivity
3. Review error logs
4. Check rate limits on external services

### Queue Worker Crashes

1. Check memory limits
2. Review timeout settings
3. Check for infinite loops
4. Monitor system resources

## Future Enhancements

- [ ] Priority queues for urgent messages
- [ ] Delivery receipts and status webhooks
- [ ] Message templates and personalization
- [ ] Rate limiting per channel
- [ ] Dead letter queue for permanently failed messages
- [ ] Real-time delivery status updates via WebSockets
