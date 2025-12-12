<?php

namespace App\Http\Controllers;

use App\Events\MessageInboundCreated;
use App\Models\Message;
use App\Models\MessageHistory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Kobliat\Shared\Events\EventBus;
use Illuminate\Support\Facades\Log;

class MessageController extends Controller
{
    private EventBus $eventBus;

    public function __construct(EventBus $eventBus)
    {
        $this->eventBus = $eventBus;
    }

    public function index(string $conversationId): JsonResponse
    {
        return response()->json(
            Message::where('conversation_id', $conversationId)
                ->orderBy('sent_at', 'desc')
                ->paginate(50)
        );
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'conversation_id' => 'required|uuid',
            'direction' => 'required|in:inbound,outbound,system',
            'body' => 'required|string',
            'sender_customer_id' => 'nullable|uuid',
        ]);

        $message = Message::create(array_merge($validated, [
            'sent_at' => now(),
            'is_processed' => true,
        ]));

        if ($validated['direction'] === 'inbound') {
            try {
                $this->eventBus->publishEvent(new MessageInboundCreated(
                    $message->id,
                    $message->conversation_id,
                    $message->body
                ));
            } catch (\Throwable $e) {
                Log::error('EventBus Error (MessageInboundCreated): ' . $e->getMessage());
            }
        }

        return response()->json($message, 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $message = Message::findOrFail($id);

        $validated = $request->validate([
            'body' => 'required|string',
        ]);

        // Create history
        MessageHistory::create([
            'message_id' => $message->id,
            'conversation_id' => $message->conversation_id,
            'customer_id' => $message->sender_customer_id,
            'direction' => $message->direction,
            'body' => $validated['body'],
            'previous_body' => $message->body,
        ]);

        $message->update(['body' => $validated['body']]);

        return response()->json($message);
    }
}
