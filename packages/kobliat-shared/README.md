# Kobliat Shared Package

Shared utilities and base classes for Kobliat microservices.

## Components

### Events
- **DomainEvent**: Base class for all domain events
- **EventBus**: Kafka event bus wrapper for publishing and subscribing to events

### Database
- **UuidModel**: Base Eloquent model with UUID primary keys

### Logging
- **StructuredLogger**: JSON-formatted structured logging

## Installation

Add to your Laravel service's `composer.json`:

```json
{
    "repositories": [
        {
            "type": "path",
            "url": "../../packages/kobliat-shared"
        }
    ],
    "require": {
        "kobliat/shared": "*"
    }
}
```

Then run:
```bash
composer install
```

## Usage

### Publishing Events

```php
use Kobliat\Shared\Events\EventBus;

$eventBus = new EventBus([
    'brokers' => 'localhost:9092',
    'client_id' => 'my-service',
], 'my-service');

$eventBus->publish('customer.created', [
    'customer_id' => '123',
    'name' => 'John Doe',
]);
```

### Using UuidModel

```php
use Kobliat\Shared\Database\UuidModel;

class Customer extends UuidModel
{
    protected $fillable = ['name', 'email'];
}
```

### Structured Logging

```php
use Kobliat\Shared\Logging\StructuredLogger;

$logger = new StructuredLogger('my-service');
$logger->info('Customer created', ['customer_id' => '123']);
```
