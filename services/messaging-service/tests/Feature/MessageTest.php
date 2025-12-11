<?php

namespace Tests\Feature;

use App\Models\Message;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Kobliat\Shared\Events\EventBus;
use Mockery;
use Tests\TestCase;

class MessageTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $mockBus = Mockery::mock(EventBus::class);
        $mockBus->shouldReceive('publishEvent')->byDefault();
        $this->app->instance(EventBus::class, $mockBus);
    }

    public function test_can_send_message()
    {
        $payload = [
            'conversation_id' => (string) Str::uuid(),
            'direction' => 'outbound',
            'body' => 'Hello World',
            'sender_customer_id' => (string) Str::uuid(),
        ];
        $response = $this->postJson('/api/messages', $payload);

        if ($response->status() !== 201) {
            dump($response->content());
        }

        $response->assertStatus(201)
            ->assertJson([
                'body' => 'Hello World',
            ]);

        $this->assertDatabaseHas('messages', [
            'body' => 'Hello World',
        ]);
    }

    public function test_can_list_messages()
    {
        $convId = (string) Str::uuid();
        Message::create([
            'conversation_id' => $convId,
            'direction' => 'outbound',
            'body' => 'Msg 1',
            'sender_customer_id' => (string) Str::uuid(),
        ]);

        $response = $this->getJson("/api/conversations/{$convId}/messages");

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data'); // or checking pagination wrapper
    }
}
