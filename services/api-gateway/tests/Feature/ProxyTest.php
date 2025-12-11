<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Services\ServiceProxyService;
use Mockery;
use Illuminate\Support\Facades\Http;
use Illuminate\Http\Client\Response;

class ProxyTest extends TestCase
{
    public function test_proxies_request_to_service()
    {
        // Mock Env variables
        config(['services.urls.customer' => 'http://customer-service']);
        // Or set via putenv if ServiceProxyService uses env() directly
        putenv('SERVICE_CUSTOMER_URL=http://customer-service');

        Http::fake([
            '*' => Http::response(['id' => '123'], 200),
        ]);

        $response = $this->withHeaders(['X-API-KEY' => 'test-secret'])
            ->getJson('/api/v1/customers/123');

        $response->assertStatus(200)
            ->assertJson(['id' => '123']);
    }
}
