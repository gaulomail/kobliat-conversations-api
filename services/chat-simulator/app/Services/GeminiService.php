<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiService
{
    private string $apiKey;

    private string $baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

    public function __construct()
    {
        $this->apiKey = env('GEMINI_API_KEY', '');
    }

    public function generateResponse(string $prompt, string $persona = 'helpful_assistant'): string
    {
        if (empty($this->apiKey)) {
            return "Gemini API Key missing. Simulation mode: {$prompt}";
        }

        try {
            $systemPrompt = $this->getPersonaPrompt($persona);

            $response = Http::withHeaders(['Content-Type' => 'application/json'])
                ->post("{$this->baseUrl}?key={$this->apiKey}", [
                    'contents' => [
                        [
                            'parts' => [
                                ['text' => "{$systemPrompt}\n\nUser: {$prompt}\nResponse:"],
                            ],
                        ],
                    ],
                ]);

            if ($response->failed()) {
                Log::error('Gemini API Error', $response->json());

                // Fallback to simulated response
                return $this->getSimulatedResponse($persona, $prompt);
            }

            $data = $response->json();

            return $data['candidates'][0]['content']['parts'][0]['text'] ?? 'No response generated.';

        } catch (\Exception $e) {
            Log::error('Gemini Exception: '.$e->getMessage());

            // Fallback to simulated response
            return $this->getSimulatedResponse($persona, $prompt);
        }
    }

    private function getSimulatedResponse(string $persona, string $prompt): string
    {
        return match ($persona) {
            'angry_customer' => "I'm very upset! My order #12345 was supposed to arrive yesterday but it's still not here. This is unacceptable!",
            'curious_shopper' => "Hi! I'm interested in your products. Could you tell me more about the features and pricing? Also, do you offer free shipping?",
            default => 'Hello! I have a question about your service.',
        };
    }

    private function getPersonaPrompt(string $persona): string
    {
        return match ($persona) {
            'angry_customer' => 'You are an angry customer complaining about a delayed order. Be brief.',
            'curious_shopper' => 'You are a curious shopper asking about product details. Be polite.',
            default => 'You are a helpful assistant.',
        };
    }
}
