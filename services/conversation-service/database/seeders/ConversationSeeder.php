<?php

namespace Database\Seeders;

use App\Models\Conversation;
use App\Models\ConversationParticipant;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ConversationSeeder extends Seeder
{
    public function run(): void
    {
        // Get customers directly from customer database
        $customers = DB::connection('kobliat_customers_db')
            ->table('customers')
            ->select('id', 'name', 'external_type')
            ->get();

        if ($customers->count() < 2) {
            $this->command->warn('⚠️  Not enough customers to create conversations. Please seed customer service first.');

            return;
        }

        $customersArray = $customers->toArray();

        // Create demo conversations
        $conversations = [
            [
                'type' => 'direct',
                'status' => 'open',
                'participants' => [$customersArray[0]->id, $customersArray[min(3, count($customersArray) - 1)]->id], // User 1 + AI Assistant
            ],
            [
                'type' => 'direct',
                'status' => 'open',
                'participants' => [$customersArray[min(1, count($customersArray) - 1)]->id, $customersArray[min(3, count($customersArray) - 1)]->id], // User 2 + AI Assistant
            ],
            [
                'type' => 'direct',
                'status' => 'closed',
                'participants' => [$customersArray[min(2, count($customersArray) - 1)]->id, $customersArray[min(3, count($customersArray) - 1)]->id], // User 3 + AI Assistant
            ],
        ];

        foreach ($conversations as $convData) {
            $conversation = Conversation::create([
                'type' => $convData['type'],
                'status' => $convData['status'],
            ]);

            foreach ($convData['participants'] as $customerId) {
                ConversationParticipant::create([
                    'conversation_id' => $conversation->id,
                    'customer_id' => $customerId,
                ]);
            }
        }

        $this->command->info('✅ Created '.count($conversations).' demo conversations');
    }
}
