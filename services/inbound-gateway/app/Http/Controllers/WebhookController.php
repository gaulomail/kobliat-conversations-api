<?php

namespace App\Http\Controllers;

use App\Models\InboundWebhook;
use App\Services\PayloadNormalizer;
use App\Events\WebhookInboundReceived;
use Kobliat\Shared\Events\EventBus;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class WebhookController extends Controller
{
    private PayloadNormalizer $normalizer;
    private EventBus $eventBus;

    public function __construct(PayloadNormalizer $normalizer, EventBus $eventBus)
    {
        $this->normalizer = $normalizer;
        $this->eventBus = $eventBus;
    }

    public function handle(Request $request, string $provider): JsonResponse
    {
        $payload = $request->all();
        
        // 1. Normalize to get ID for idempotency check
        $normalized = $this->normalizer->normalize($provider, $payload);
        $providerMessageId = $normalized['provider_message_id'];

        // 2. Idempotency Check (can also be middleware, but inline here for clarity)
        if (InboundWebhook::where('provider', $provider)
            ->where('provider_message_id', $providerMessageId)
            ->exists()) {
            Log::info("Duplicate webhook received: {$provider}:{$providerMessageId}");
            return response()->json(['status' => 'ignored_duplicate']);
        }

        // 3. Store Webhook
        $webhook = InboundWebhook::create([
            'provider' => $provider,
            'provider_message_id' => $providerMessageId,
            'headers' => $request->headers->all(),
            'raw_payload' => $payload,
            'is_processed' => true, 
        ]);

        // 4. Publish Event
        $this->eventBus->publishEvent(new WebhookInboundReceived(
            $provider,
            $providerMessageId,
            $payload
        ));

        return response()->json(['status' => 'received'], 201);
    }
}
