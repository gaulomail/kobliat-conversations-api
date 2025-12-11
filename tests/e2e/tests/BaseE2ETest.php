<?php

namespace Tests;

use PHPUnit\Framework\TestCase;
use GuzzleHttp\Client;

class BaseE2ETest extends TestCase
{
    protected Client $client;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->client = new Client([
            'base_uri' => getenv('API_BASE_URL'),
            'headers' => [
                'X-API-KEY' => getenv('API_KEY'),
                'Accept' => 'application/json',
                'Content-Type' => 'application/json',
            ],
            'http_errors' => false // Allow us to assert on 4xx/5xx responses
        ]);
    }
}
