<?php

namespace Tests;

use PHPUnit\Framework\TestCase;
use GuzzleHttp\Client;

abstract class BaseE2ETest extends TestCase
{
    protected Client $client;

    protected function setUp(): void
    {
        parent::setUp();

        if (getenv('GITHUB_ACTIONS') === 'true') {
            $this->markTestSkipped('Skipping E2E tests in GitHub Actions environment as services are not running.');
        }
        
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
