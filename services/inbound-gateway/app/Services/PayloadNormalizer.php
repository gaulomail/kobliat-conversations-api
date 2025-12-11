<?php

namespace App\Services;

class PayloadNormalizer
{
    public function normalize(string $provider, array $payload): array
    {
        // Simple normalization based on provider
        // Returns [id, type, body, sender]
        
        $id = uniqid();
        $body = '';

        if ($provider === 'whatsapp') {
            $id = $payload['messages'][0]['id'] ?? uniqid();
            $body = $payload['messages'][0]['text']['body'] ?? '';
        }

        return [
            'provider_message_id' => $id,
            'body' => $body,
            // ... extract other fields
        ];
    }
}
