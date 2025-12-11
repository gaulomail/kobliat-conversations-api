<?php

namespace Tests\Feature;

use App\Models\Conversation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Kobliat\Shared\Events\EventBus;
use Mockery;
use Tests\TestCase;

class ConversationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $mockBus = Mockery::mock(EventBus::class);
        $mockBus->shouldReceive('publishEvent')->byDefault();
        $this->app->instance(EventBus::class, $mockBus);
    }

    public function test_can_create_direct_conversation()
    {
        $payload = [
            'type' => 'direct',
            'participants' => [
                (string) Str::uuid(),
                (string) Str::uuid(),
            ],
        ];

        $response = $this->postJson('/api/conversations', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('type', 'direct');

        $this->assertDatabaseHas('conversations', [
            'type' => 'direct',
        ]);

        $this->assertDatabaseCount('conversation_participants', 2);
    }

    public function test_can_list_conversations()
    {
        Conversation::create(['type' => 'direct']);
        Conversation::create(['type' => 'group']);

        $response = $this->getJson('/api/conversations');

        $response->assertStatus(200)
            ->assertJsonCount(2, 'data');
    }
}
