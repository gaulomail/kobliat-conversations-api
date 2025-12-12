<?php

namespace Database\Seeders;

use App\Models\Message;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Http;

class MessageSeeder extends Seeder
{
    public function run(): void
    {
        // Get conversations from conversation service
        $conversationsResponse = Http::get('http://localhost:8002/api/conversations');

        if (! $conversationsResponse->successful()) {
            $this->command->warn('⚠️  Could not fetch conversations. Make sure conversation service is running and seeded.');

            return;
        }

        $conversationsData = $conversationsResponse->json();
        $conversations = $conversationsData['data'] ?? $conversationsData;

        if (empty($conversations)) {
            $this->command->warn('⚠️  No conversations found. Please seed conversation service first.');

            return;
        }

        $messageCount = 0;

        // Create demo messages for each conversation
        foreach ($conversations as $conv) {
            $convId = $conv['id'];

            // Get conversation details to find participants
            $detailsResponse = Http::get("http://localhost:8002/api/conversations/{$convId}");
            if (! $detailsResponse->successful()) {
                continue;
            }

            $details = $detailsResponse->json();
            $participants = $details['participants'] ?? [];

            if (count($participants) < 2) {
                continue;
            }

            $customer = $participants[0];
            $assistant = $participants[1];

            // Create a conversation thread
            $messages = [
                [
                    'conversation_id' => $convId,
                    'sender_customer_id' => $customer['id'],
                    'direction' => 'inbound',
                    'body' => 'Hello! I need some help.',
                    'sent_at' => now()->subHours(2),
                ],
                [
                    'conversation_id' => $convId,
                    'sender_customer_id' => $assistant['id'],
                    'direction' => 'outbound',
                    'body' => 'Hi there! I\'d be happy to help. What can I assist you with today?',
                    'sent_at' => now()->subHours(2)->addMinutes(1),
                ],
                [
                    'conversation_id' => $convId,
                    'sender_customer_id' => $customer['id'],
                    'direction' => 'inbound',
                    'body' => 'I have a question about your services.',
                    'sent_at' => now()->subHours(1),
                ],
                [
                    'conversation_id' => $convId,
                    'sender_customer_id' => $assistant['id'],
                    'direction' => 'outbound',
                    'body' => 'Of course! Please go ahead and ask your question.',
                    'sent_at' => now()->subHours(1)->addMinutes(2),
                ],
            ];

            foreach ($messages as $messageData) {
                Message::create(array_merge($messageData, [
                    'is_processed' => true,
                ]));
                $messageCount++;
            }
        }

        $this->command->info("✅ Created {$messageCount} demo messages");
    }
}
