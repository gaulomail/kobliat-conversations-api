<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Services\GeminiService;
use App\Services\ScenarioEngine;
use Mockery;
use Illuminate\Support\Facades\Http;

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
            'scenario' => 'curious_shopper'
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'generated_message' => 'Mocked generic response',
            ]);
    }
}
