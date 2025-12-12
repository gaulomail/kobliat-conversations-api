<?php

namespace App\Http\Controllers;

use App\Events\MessageInboundCreated;
use App\Models\Message;
use App\Models\MessageHistory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Kobliat\Shared\Events\EventBus;

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
            'channel' => 'string|in:whatsapp,sms,email,web',
            'metadata' => 'nullable|array',
        ]);

        $message = Message::create(array_merge($validated, [
            'sent_at' => $validated['direction'] === 'inbound' ? now() : null,
            'is_processed' => $validated['direction'] === 'inbound',
        ]));

        // Handle based on direction
        if ($validated['direction'] === 'inbound') {
            // Inbound messages are processed immediately
            $this->eventBus->publishEvent(new MessageInboundCreated(
                $message->id,
                $message->conversation_id,
                $message->body
            ));
        } elseif ($validated['direction'] === 'outbound') {
            // Outbound messages are queued for async processing with retry logic
            \App\Jobs\SendOutboundMessage::dispatch($message);
            
            Log::info("Outbound message queued for sending", [
                'message_id' => $message->id,
                'channel' => $message->channel,
            ]);
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
