<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Kobliat\Shared\Events\EventBus;
use Mockery;
use Tests\TestCase;

class InboundWebhookTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $mockBus = Mockery::mock(EventBus::class);
        $mockBus->shouldReceive('publishEvent')->byDefault();
        $this->app->instance(EventBus::class, $mockBus);
    }

    public function test_can_receive_whatsapp_webhook()
    {
        // ... (cache mock is irrelevant now)

        $payload = [
            'id' => 'evt_123',
            'type' => 'message',
            'from' => '1234567890',
            'body' => 'Hello',
            'timestamp' => time(),
        ];

        $response = $this->postJson('/api/webhooks/whatsapp', $payload);

        $response->assertStatus(201)
            ->assertJson(['status' => 'received']);
    }

    public function test_idempotency_check()
    {
        // Seed DB with existing webhook
        \App\Models\InboundWebhook::create([
            'provider' => 'whatsapp',
            'provider_message_id' => 'evt_123', // Normalized ID logic will pick 'evt_123' from raw payload['id']
            'headers' => [],
            'raw_payload' => [],
            'is_processed' => true,
        ]);

        $payload = [
            'messages' => [
                [
                    'id' => 'evt_123',
                    'text' => ['body' => 'Duplicate'],
                ],
            ],
        ];

        $response = $this->postJson('/api/webhooks/whatsapp', $payload);

        $response->assertStatus(200)
            ->assertJson(['status' => 'ignored_duplicate']);
    }
}
