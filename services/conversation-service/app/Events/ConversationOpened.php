<?php

namespace App\Events;

use Kobliat\Shared\Events\DomainEvent;

class ConversationOpened extends DomainEvent
{
    public function __construct(string $conversationId, string $type, array $participantIds)
    {
        parent::__construct(
            topic: 'conversation.opened',
            payload: [
                'conversation_id' => $conversationId,
                'type' => $type,
                'participants' => $participantIds,
            ],
            sourceService: 'conversation-service'
        );
    }
}
