<?php

namespace App\Events;

use Kobliat\Shared\Events\DomainEvent;

class MessageInboundCreated extends DomainEvent
{
    public function __construct(string $messageId, string $conversationId, string $body)
    {
        parent::__construct(
            topic: 'message.inbound.created',
            payload: [
                'message_id' => $messageId,
                'conversation_id' => $conversationId,
                'direction' => 'inbound',
                'body' => $body,
            ],
            sourceService: 'messaging-service'
        );
    }
}
