<?php

namespace App\Services;

use App\Events\ConversationOpened;
use App\Events\ConversationParticipantAdded;
use App\Models\Conversation;
use App\Models\ConversationParticipant;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Kobliat\Shared\Events\EventBus;

class ConversationService
{
    private EventBus $eventBus;

    public function __construct(EventBus $eventBus)
    {
        $this->eventBus = $eventBus;
    }

    public function createDirectConversation(string $customerId1, string $customerId2): Conversation
    {
        // TODO: Check if direct conversation already exists between these two

        return DB::transaction(function () use ($customerId1, $customerId2) {
            $conversation = Conversation::create([
                'type' => 'direct',
                'status' => 'open',
            ]);

            $this->addParticipant($conversation, $customerId1, 'member');
            $this->addParticipant($conversation, $customerId2, 'member');

            try {
                $this->eventBus->publishEvent(new ConversationOpened(
                    $conversation->id,
                    'direct',
                    [$customerId1, $customerId2]
                ));
            } catch (\Throwable $e) {
                Log::error('EventBus Error (ConversationOpened): ' . $e->getMessage());
            }

            return $conversation;
        });
    }

    public function addParticipant(Conversation $conversation, string $customerId, string $role = 'member'): ConversationParticipant
    {
        $participant = ConversationParticipant::create([
            'conversation_id' => $conversation->id,
            'customer_id' => $customerId,
            'role' => $role,
            'joined_at' => now(),
        ]);

        try {
            $this->eventBus->publishEvent(new ConversationParticipantAdded(
                $conversation->id,
                $customerId,
                $role
            ));
        } catch (\Throwable $e) {
            Log::error('EventBus Error (ConversationParticipantAdded): ' . $e->getMessage());
        }

        return $participant;
    }

    public function findById(string $id): ?Conversation
    {
        return Conversation::with('participants')->find($id);
    }
}
