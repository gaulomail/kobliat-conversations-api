<?php

namespace Tests;

use PHPUnit\Framework\TestCase;
use GuzzleHttp\Client;

abstract class E2ETestCase extends TestCase
{
    protected Client $client;
    protected \GuzzleHttp\Handler\MockHandler $mockHandler;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Always usage MockHandler as requested
        $this->mockHandler = new \GuzzleHttp\Handler\MockHandler();
        $handlerStack = \GuzzleHttp\HandlerStack::create($this->mockHandler);

        $this->client = new Client([
            'base_uri' => rtrim(getenv('API_BASE_URL'), '/') . '/',
            'handler' => $handlerStack,
            'headers' => [
                'X-API-KEY' => getenv('API_KEY'),
                'Accept' => 'application/json',
                'Content-Type' => 'application/json',
            ],
            'http_errors' => false // Allow us to assert on 4xx/5xx responses
        ]);
    }
}
