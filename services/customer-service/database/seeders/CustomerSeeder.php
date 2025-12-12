<?php

namespace Database\Seeders;

use App\Models\Customer;
use Illuminate\Database\Seeder;

class CustomerSeeder extends Seeder
{
    public function run(): void
    {
        // Create demo customers
        $customers = [
            [
                'external_id' => 'demo_user_1',
                'external_type' => 'whatsapp',
                'name' => 'John Doe',
                'metadata' => json_encode(['phone' => '+1234567890', 'country' => 'US']),
            ],
            [
                'external_id' => 'demo_user_2',
                'external_type' => 'whatsapp',
                'name' => 'Jane Smith',
                'metadata' => json_encode(['phone' => '+1234567891', 'country' => 'UK']),
            ],
            [
                'external_id' => 'demo_user_3',
                'external_type' => 'web',
                'name' => 'Alice Johnson',
                'metadata' => json_encode(['email' => 'alice@example.com']),
            ],
            [
                'external_id' => 'ai_assistant',
                'external_type' => 'assistant',
                'name' => 'AI Assistant',
                'metadata' => json_encode(['type' => 'bot', 'version' => '1.0']),
            ],
        ];

        foreach ($customers as $customerData) {
            Customer::firstOrCreate(
                ['external_id' => $customerData['external_id'], 'external_type' => $customerData['external_type']],
                $customerData
            );
        }

        $this->command->info('✅ Created '.count($customers).' demo customers');
    }
}
