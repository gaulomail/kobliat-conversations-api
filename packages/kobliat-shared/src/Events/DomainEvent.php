<?php

namespace Kobliat\Shared\Events;

use Ramsey\Uuid\Uuid;

abstract class DomainEvent
{
    public string $eventId;
    public string $traceId;
    public string $occurredAt;
    public string $sourceService;
    public string $topic;
    public array $payload;

    public function __construct(string $topic, array $payload, string $sourceService, ?string $traceId = null)
    {
        $this->eventId = Uuid::uuid4()->toString();
        $this->traceId = $traceId ?? Uuid::uuid4()->toString();
        $this->occurredAt = now()->toIso8601String();
        $this->sourceService = $sourceService;
        $this->topic = $topic;
        $this->payload = $payload;
    }

    public function toArray(): array
    {
        return [
            'event_id' => $this->eventId,
            'trace_id' => $this->traceId,
            'occurred_at' => $this->occurredAt,
            'source_service' => $this->sourceService,
            'topic' => $this->topic,
            'payload' => $this->payload,
        ];
    }

    public function toJson(): string
    {
        return json_encode($this->toArray());
    }
}
