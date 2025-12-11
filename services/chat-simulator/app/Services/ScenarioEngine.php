<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class ScenarioEngine
{
    private GeminiService $gemini;

    public function __construct(GeminiService $gemini)
    {
        $this->gemini = $gemini;
    }

    public function runScenario(string $scenario, string $targetUrl): array
    {
        // 1. Generate Content
        $message = $this->gemini->generateResponse("Start a conversation", $scenario);

        // 2. Send to Inbound Gateway (simulating a webhook)
        // Ensure INBOUND_GATEWAY_URL is set
        $gatewayUrl = env('INBOUND_GATEWAY_URL', 'http://localhost:8005/api/webhooks/whatsapp');

        try {
            $response = Http::post($gatewayUrl, [
                'object' => 'whatsapp_business_account',
                'entry' => [
                    [
                        'changes' => [
                            [
                                'value' => [
                                    'messages' => [
                                        [
                                            'from' => '15550000000',
                                            'id' => uniqid('wamid.'),
                                            'text' => ['body' => $message],
                                            'type' => 'text',
                                            'timestamp' => time(),
                                        ]
                                    ]
                                ]
                            ]
                        ]
                    ]
                ]
            ]);

            return [
                'status' => 'success',
                'generated_message' => $message,
                'gateway_response' => $response->json(),
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'error',
                'message' => $e->getMessage(),
            ];
        }
    }
}
