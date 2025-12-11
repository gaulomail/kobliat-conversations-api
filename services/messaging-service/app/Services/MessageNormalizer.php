<?php

namespace App\Services;

class MessageNormalizer
{
    public function normalize(array $payload): array
    {
        // Simple normalization logic
        return [
            'external_id' => $payload['user']['id'] ?? 'unknown',
            'external_message_id' => $payload['message']['id'] ?? uniqid(),
            'channel' => $payload['platform'] ?? 'unknown',
            'content_type' => $payload['message']['type'] ?? 'text',
            'body' => $payload['message']['content'] ?? '',
            'sent_at' => isset($payload['message']['timestamp'])
                ? date('c', $payload['message']['timestamp'])
                : now()->toIso8601String(),
            'raw' => $payload,
        ];
    }
}
