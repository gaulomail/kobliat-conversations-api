<?php

namespace Database\Seeders;

use App\Models\Message;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MessageSeeder extends Seeder
{
    public function run(): void
    {
        // Get conversations directly from the conversation service database
        // We assume the database name is 'kobliat_conversation_db' as per standard setup
        // and that the current DB user has access to it.
        try {
            $conversations = DB::table('kobliat_conversation_db.conversations')->get();
        } catch (\Exception $e) {
            $this->command->warn('⚠️  Could not access kobliat_conversation_db database. Message seeding skipped.');
            $this->command->warn('Error: ' . $e->getMessage());
            return;
        }

        if ($conversations->isEmpty()) {
            $this->command->warn('⚠️  No conversations found in kobliat_conversation_db. Please seed conversation service first.');
            return;
        }

        $messageCount = 0;

        // Create demo messages for each conversation
        foreach ($conversations as $conv) {
            $convId = $conv->id;

            // Get participants directly from DB
            $participants = DB::table('kobliat_conversation_db.conversation_participants')
                ->where('conversation_id', $convId)
                ->get();

            if ($participants->count() < 2) {
                continue;
            }

            // Convert to array to easier indexing or use first()/get(1)
            $customer = $participants[0];
            $assistant = $participants[1];

            // Create a conversation thread
            $messages = [
                [
                    'conversation_id' => $convId,
                    'sender_customer_id' => $customer->customer_id,
                    'direction' => 'inbound',
                    'body' => 'Hello! I need some help.',
                    'sent_at' => now()->subHours(2),
                ],
                [
                    'conversation_id' => $convId,
                    'sender_customer_id' => $assistant->customer_id,
                    'direction' => 'outbound',
                    'body' => 'Hi there! I\'d be happy to help. What can I assist you with today?',
                    'sent_at' => now()->subHours(2)->addMinutes(1),
                ],
                [
                    'conversation_id' => $convId,
                    'sender_customer_id' => $customer->customer_id,
                    'direction' => 'inbound',
                    'body' => 'I have a question about your services.',
                    'sent_at' => now()->subHours(1),
                ],
                [
                    'conversation_id' => $convId,
                    'sender_customer_id' => $assistant->customer_id,
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
