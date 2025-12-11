<?php

namespace App\Events;

use Kobliat\Shared\Events\DomainEvent;

class WebhookInboundReceived extends DomainEvent
{
    public function __construct(string $provider, string $providerMessageId, array $rawPayload)
    {
        parent::__construct(
            topic: 'webhook.inbound.received',
            payload: [
                'provider' => $provider,
                'provider_message_id' => $providerMessageId,
                'raw_payload' => $rawPayload,
            ],
            sourceService: 'inbound-gateway'
        );
    }
}
