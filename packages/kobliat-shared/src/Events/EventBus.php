<?php

namespace Kobliat\Shared\Events;

use GuzzleHttp\Client;
use Aws\EventBridge\EventBridgeClient;
use Psr\Log\LoggerInterface;
use Psr\Log\NullLogger;
use Illuminate\Support\Facades\Log; // Fallback if needed, or remove
use Illuminate\Support\Carbon;

/**
 * EventBus supporting Kafka (HTTP REST Proxy) and AWS EventBridge (LocalStack)
 */
class EventBus
{
    private string $serviceName;
    private string $driver;
    private LoggerInterface $logger;
    
    // Kafka Config
    private ?Client $httpClient = null;
    private string $kafkaRestProxyUrl;

    // AWS Config
    private ?EventBridgeClient $awsClient = null;
    private string $eventBusName;

    public function __construct(array $config, string $serviceName, ?LoggerInterface $logger = null)
    {
        $this->serviceName = $serviceName;
        $this->driver = $config['driver'] ?? env('EVENT_BUS_DRIVER', 'kafka');
        
        // Use injected logger, or fallback to Laravel Facade wrapper if in app, or NullLogger
        if ($logger) {
            $this->logger = $logger;
        } else {
            // Basic fallback for backward compatibility if instantiated inside Laravel without passing logger
            // For now, let's just use NullLogger if not provided to avoid breaking "new EventBus" calls elsewhere
            // Ideally, we should resolve from container.
            $this->logger = new NullLogger();
            
            // If we are in a Laravel app, we might want to resolve 'log' from container, 
            // but for strict DI let's require it or use null.
            // Let's use a trick: if function exists 'app', try to get logger.
            if (function_exists('app') && app()->bound('log')) {
                 $this->logger = app('log');
            }
        }

        $this->logger->info('EventBus initialized', [
            'service' => $serviceName,
            'driver' => $this->driver,
        ]);

        if ($this->driver === 'eventbridge') {
            $this->initEventBridge($config);
        } elseif ($this->driver === 'log') {
            // No initialization needed for log driver
        } else {
            $this->initKafka($config);
        }
    }

    private function initKafka(array $config): void
    {
        $this->kafkaRestProxyUrl = $config['rest_proxy_url'] ?? env('KAFKA_REST_PROXY_URL', 'http://localhost:8082');
        
        $this->httpClient = $config['http_client'] ?? new Client([
            'base_uri' => $this->kafkaRestProxyUrl,
            'timeout' => 5.0,
            'headers' => [
                'Content-Type' => 'application/vnd.kafka.json.v2+json',
                'Accept' => 'application/vnd.kafka.v2+json',
            ],
        ]);
    }

    private function initEventBridge(array $config): void
    {
        $this->eventBusName = $config['event_bus_name'] ?? env('EVENT_BUS_NAME', 'kobliat-events');
        
        if (isset($config['aws_client'])) {
            $this->awsClient = $config['aws_client'];
            return;
        }

        $awsConfig = [
            'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
            // ... rest of config logic

            'version' => 'latest',
            'credentials' => [
                'key' => env('AWS_ACCESS_KEY_ID', 'test'),
                'secret' => env('AWS_SECRET_ACCESS_KEY', 'test'),
            ],
        ];

        // LocalStack Support
        if (env('USE_LOCALSTACK', false) || env('AWS_ENDPOINT')) {
            $awsConfig['endpoint'] = env('AWS_ENDPOINT', 'http://localhost:4566');
            $awsConfig['use_path_style_endpoint'] = true;
        }

        $this->awsClient = new EventBridgeClient($awsConfig);
    }

    public function publish(string $topic, array $payload, ?string $traceId = null): void
    {
        $event = [
            'event_id' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'trace_id' => $traceId ?? \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'occurred_at' => Carbon::now()->toIso8601String(),
            'source_service' => $this->serviceName,
            'topic' => $topic,
            'payload' => $payload,
        ];

        try {
            if ($this->driver === 'eventbridge') {
                $this->publishToEventBridge($topic, $event);
            } elseif ($this->driver === 'log') {
                $this->logger->info("EventBus (Log Driver): Published event to topic [$topic]", $event);
            } else {
                $this->publishToKafka($topic, $event);
            }

            $this->logger->info('Event published', [
                'driver' => $this->driver,
                'topic' => $topic,
                'event_id' => $event['event_id'],
            ]);
        } catch (\Exception $e) {
            $this->logger->error('Failed to publish event', [
                'driver' => $this->driver,
                'topic' => $topic,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    private function publishToKafka(string $topic, array $event): void
    {
        $message = [
            'records' => [
                [
                    'key' => $event['event_id'],
                    'value' => $event,
                ],
            ],
        ];

        $this->httpClient->post("/topics/{$topic}", [
            'json' => $message,
        ]);
    }

    private function publishToEventBridge(string $topic, array $event): void
    {
        $this->awsClient->putEvents([
            'Entries' => [
                [
                    'Source' => $this->serviceName,
                    'DetailType' => $topic,
                    'Detail' => json_encode($event),
                    'EventBusName' => $this->eventBusName,
                    'Time' => Carbon::now(),
                    'Resources' => [],
                    'TraceHeader' => $event['trace_id']
                ]
            ]
        ]);
    }

    public function publishEvent(DomainEvent $event): void
    {
        $this->publish($event->topic, $event->payload, $event->traceId);
    }

    public function subscribe(array $topics, callable $handler, string $groupId): void
    {
        $this->logger->warning('Subscribe method not implemented directly via EventBus. Use Queue Workers.', [
            'driver' => $this->driver,
        ]);
    }
}
