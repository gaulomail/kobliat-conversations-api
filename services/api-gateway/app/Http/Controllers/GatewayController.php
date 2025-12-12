<?php

namespace App\Http\Controllers;

use App\Services\ServiceProxyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GatewayController extends Controller
{
    private ServiceProxyService $proxy;

    public function __construct(ServiceProxyService $proxy)
    {
        $this->proxy = $proxy;
    }

    /**
     * Generic proxy method
     */
    public function proxy(Request $request, string $service, string $path): JsonResponse
    {
        try {
            $response = $this->proxy->forward(
                $service,
                strtolower($request->method()),
                $path,
                $request->all(),
                $request->headers->all() // Be careful forwarding all headers in prod
            );

            return response()->json($response->json(), $response->status());
        } catch (\Exception $e) {
            return response()->json(['error' => 'Gateway Error: '.$e->getMessage()], 502);
        }
    }

    /**
     * Aggregated Endpoint: Get Conversation with Messages
     */
    public function getConversationDetails(string $id): JsonResponse
    {
        // 1. Get Conversation
        $convResponse = $this->proxy->forward('conversation', 'get', "/api/conversations/{$id}");
        if ($convResponse->failed()) {
            return response()->json($convResponse->json(), $convResponse->status());
        }
        $conversation = $convResponse->json();

        // 1.5 Hydrate Participants
        if (isset($conversation['participants']) && is_array($conversation['participants'])) {
            foreach ($conversation['participants'] as &$participant) {
                if (isset($participant['customer_id'])) {
                    try {
                        $custResponse = $this->proxy->forward('customer', 'get', "/api/customers/{$participant['customer_id']}");
                        if ($custResponse->successful()) {
                            $customerData = $custResponse->json();
                            $participant['name'] = $customerData['name'] ?? 'Unknown';
                            $participant['external_id'] = $customerData['external_id'] ?? null;
                            $participant['external_type'] = $customerData['external_type'] ?? null;
                        } else {
                             $participant['name'] = 'Unknown (Service Error)';
                        }
                    } catch (\Exception $e) {
                        $participant['name'] = 'Error Fetching Name';
                    }
                }
            }
        }

        // 2. Get Messages
        $msgResponse = $this->proxy->forward('messaging', 'get', "/api/conversations/{$id}/messages");
        $messages = $msgResponse->successful() ? $msgResponse->json() : [];

        // 3. Aggregate
        $conversation['messages'] = $messages;

        return response()->json($conversation);
    }
}
