<?php

namespace App\Events;

use Kobliat\Shared\Events\DomainEvent;

class CustomerCreated extends DomainEvent
{
    public function __construct(string $customerId, string $externalId, string $externalType, ?string $name = null)
    {
        parent::__construct(
            topic: 'customer.created',
            payload: [
                'customer_id' => $customerId,
                'external_id' => $externalId,
                'external_type' => $externalType,
                'name' => $name,
            ],
            sourceService: 'customer-service'
        );
    }
}
