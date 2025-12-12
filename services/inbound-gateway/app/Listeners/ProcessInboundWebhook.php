<?php

namespace App\Listeners;

use App\Events\WebhookInboundReceived;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ProcessInboundWebhook
{
    /**
     * Handle the event.
     */
    public function handle(WebhookInboundReceived $event): void
    {
        $payload = $event->payload['raw_payload'];
        $provider = $event->payload['provider'];

        Log::info("Processing Inbound Webhook for {$provider}", ['payload' => $payload]);

        // 1. Extract Data
        // Prioritize 'from'/'body' flat structure (e.g. from E2E tests or simple manual requests)
        // Fallback to WhatsApp structure

        $externalId = $payload['from'] ??
                      ($payload['messages'][0]['from'] ?? null) ??
                      ($payload['entry'][0]['changes'][0]['value']['messages'][0]['from'] ?? null); // Facebook/WB structure

        $name = $payload['name'] ??
                ($payload['contacts'][0]['profile']['name'] ?? 'Unknown User');

        $body = $payload['text'] ??
                $payload['body'] ??
                ($payload['messages'][0]['text']['body'] ?? null) ??
                ($payload['entry'][0]['changes'][0]['value']['messages'][0]['text']['body'] ?? null) ??
                '';

        if (! $externalId || ! $body) {
            Log::warning('Skipping webhook: Missing external_id or body', $payload);

            return;
        }

        // 2. Customer Service: Find or Create Customer
        // Uses port 8001
        $customerResponse = Http::post('http://127.0.0.1:8001/api/customers', [
            'external_id' => $externalId,
            'name' => $name,
            'external_type' => $provider,
        ]);

        $customerId = null;

        if ($customerResponse->successful()) {
            $customerId = $customerResponse->json()['id'];
        } else {
            // If duplicate/conflict, try to GET by external_id if possible, or assume external_id is stable.
            // But existing APIs might not support filtering by external_id on GET /customers.
            // Workaround: We proceed only if we have ID.
            // If 409, assume it exists. But we need the ID.
            Log::error('Failed to create customer', ['status' => $customerResponse->status(), 'body' => $customerResponse->body()]);

            return;
        }

        // 3. Conversation Service: Find Open Conversation
        // Uses port 8002
        // We try to create one. If it handles duplicates/open sessions, great.
        // We assign a default bot/agent participant if needed.
        // We'll just pass the customer.
        $convResponse = Http::post('http://127.0.0.1:8002/api/conversations', [
            'type' => 'direct',
            'participants' => [$customerId],
        ]);

        if (! $convResponse->successful()) {
            Log::error('Failed to create/find conversation', ['status' => $convResponse->status()]);

            return;
        }
        $conversationId = $convResponse->json()['id'];

        // 4. Messaging Service: Create Message
        // Uses port 8003
        $msgResponse = Http::post('http://127.0.0.1:8003/api/messages', [
            'conversation_id' => $conversationId,
            'direction' => 'inbound',
            'body' => $body,
            'sender_customer_id' => $customerId,
            'channel' => $provider,
            'sent_at' => now()->toIso8601String(),
        ]);

        if ($msgResponse->successful()) {
            Log::info('Successfully processed inbound webhook and created message', ['message_id' => $msgResponse->json()['id']]);
        } else {
            Log::error('Failed to create message', ['status' => $msgResponse->status()]);
        }
    }
}
