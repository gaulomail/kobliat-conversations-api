<?php

namespace Tests\Feature;

use App\Services\GeminiService;
use Illuminate\Support\Facades\Http;
use Mockery;
use Tests\TestCase;

class SimulatorTest extends TestCase
{
    public function test_can_simulate_scenario()
    {
        Http::fake();

        // Mock Gemini Service to avoid real API calls
        $mockGemini = Mockery::mock(GeminiService::class);
        $mockGemini->shouldReceive('generateResponse')
            ->once()
            ->andReturn('Mocked generic response');

        $this->app->instance(GeminiService::class, $mockGemini);

        $response = $this->postJson('/api/simulate', [
            'scenario' => 'curious_shopper',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'generated_message' => 'Mocked generic response',
            ]);
    }
}
