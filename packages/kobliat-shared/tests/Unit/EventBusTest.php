<?php

namespace Kobliat\Shared\Tests\Unit;

use Kobliat\Shared\Events\EventBus;
use PHPUnit\Framework\TestCase;
use Mockery;
use GuzzleHttp\Client;
use Aws\EventBridge\EventBridgeClient;
use Psr\Log\NullLogger;

class EventBusTest extends TestCase
{
    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    public function test_it_uses_kafka_driver_by_default()
    {
        // Mock Guzzle Client
        $mockGuzzle = Mockery::mock(Client::class);
        $mockGuzzle->shouldReceive('post')
            ->once()
            ->with('/topics/my-topic', Mockery::on(function ($arg) {
                 // Verify payload structure
                return isset($arg['json']['records'][0]['value']['source_service']) 
                    && $arg['json']['records'][0]['value']['source_service'] === 'test-service'
                    && $arg['json']['records'][0]['value']['payload']['foo'] === 'bar';
            }));

        $bus = new EventBus(
            ['http_client' => $mockGuzzle], 
            'test-service',
            new NullLogger()
        );

        $bus->publish('my-topic', ['foo' => 'bar']);
    }

    public function test_it_uses_eventbridge_driver_when_configured()
    {
        // Mock AWS Client
        $mockAws = Mockery::mock(EventBridgeClient::class);
        $mockAws->shouldReceive('putEvents')
            ->once()
            ->with(Mockery::on(function ($arg) {
                $entry = $arg['Entries'][0];
                return $entry['Source'] === 'test-service'
                    && $entry['DetailType'] === 'my-topic'
                    && str_contains($entry['Detail'], '"foo":"bar"');
            }));

        $bus = new EventBus(
            [
                'driver' => 'eventbridge',
                'aws_client' => $mockAws
            ], 
            'test-service',
            new NullLogger()
        );

        $bus->publish('my-topic', ['foo' => 'bar']);
    }
}
