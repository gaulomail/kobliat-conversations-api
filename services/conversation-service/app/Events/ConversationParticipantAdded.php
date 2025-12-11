<?php

namespace App\Events;

use Kobliat\Shared\Events\DomainEvent;

class ConversationParticipantAdded extends DomainEvent
{
    public function __construct(string $conversationId, string $customerId, string $role)
    {
        parent::__construct(
            topic: 'conversation.participant.added',
            payload: [
                'conversation_id' => $conversationId,
                'customer_id' => $customerId,
                'role' => $role,
            ],
            sourceService: 'conversation-service'
        );
    }
}
