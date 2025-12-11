<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use App\Services\ConversationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ConversationController extends Controller
{
    private ConversationService $conversationService;

    public function __construct(ConversationService $conversationService)
    {
        $this->conversationService = $conversationService;
    }

    public function index(): JsonResponse
    {
        return response()->json(Conversation::paginate(20));
    }

    public function show(string $id): JsonResponse
    {
        $conversation = $this->conversationService->findById($id);
        if (! $conversation) {
            return response()->json(['error' => 'Not found'], 404);
        }

        return response()->json($conversation);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'participants' => 'required|array|min:2',
            'participants.*' => 'string|uuid',
            'type' => 'in:direct,group',
        ]);

        // Simplified for MVP - assumes direct
        $conversation = $this->conversationService->createDirectConversation(
            $validated['participants'][0],
            $validated['participants'][1]
        );

        return response()->json($conversation, 201);
    }
}
