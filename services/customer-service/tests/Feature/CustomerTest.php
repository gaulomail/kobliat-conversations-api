<?php

namespace Tests\Feature;

use App\Models\Customer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Kobliat\Shared\Events\EventBus;
use Mockery;
use Tests\TestCase;

class CustomerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Mock EventBus to prevent external calls
        $mockBus = Mockery::mock(EventBus::class);
        $mockBus->shouldReceive('publishEvent')->byDefault();

        $this->app->instance(EventBus::class, $mockBus);
    }

    public function test_can_create_customer()
    {
        $response = $this->postJson('/api/customers', [
            'external_id' => '1234567890',
            'external_type' => 'whatsapp',
            'name' => 'John Doe',
            'metadata' => ['vip' => true],
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'external_id' => '1234567890',
                'name' => 'John Doe',
            ]);

        $this->assertDatabaseHas('customers', [
            'external_id' => '1234567890',
        ]);
    }

    public function test_can_find_customer_by_external_id()
    {
        Customer::create([
            'external_id' => '9876543210',
            'external_type' => 'whatsapp',
            'name' => 'Jane Doe',
        ]);

        $response = $this->getJson('/api/customers/external/whatsapp/9876543210');

        $response->assertStatus(200)
            ->assertJson([
                'name' => 'Jane Doe',
            ]);
    }

    public function test_returns_404_if_customer_not_found()
    {
        $response = $this->getJson('/api/customers/external/whatsapp/nonexistent');
        $response->assertStatus(404);
    }
}
