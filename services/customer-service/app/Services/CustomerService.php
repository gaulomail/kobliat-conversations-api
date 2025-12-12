<?php

namespace App\Services;

use App\Events\CustomerCreated;
use App\Models\Customer;
use Illuminate\Support\Facades\Log;
use Kobliat\Shared\Events\EventBus;

class CustomerService
{
    private EventBus $eventBus;

    public function __construct(EventBus $eventBus)
    {
        $this->eventBus = $eventBus;
    }

    /**
     * Find or create customer from webhook data
     */
    public function findOrCreateFromWebhook(array $webhookData): Customer
    {
        $externalId = $webhookData['external_id'];
        $externalType = $webhookData['external_type'] ?? 'whatsapp';
        $name = $webhookData['name'] ?? null;

        // Search for existing customer
        $customer = Customer::findByExternal($externalType, $externalId);

        if ($customer) {
            Log::info('Customer found', ['customer_id' => $customer->id]);

            return $customer;
        }

        // Create new customer
        $customer = Customer::create([
            'external_id' => $externalId,
            'external_type' => $externalType,
            'name' => $name,
            'metadata' => $webhookData['metadata'] ?? [],
        ]);

        // Emit customer.created event
        $event = new CustomerCreated(
            $customer->id,
            $customer->external_id,
            $customer->external_type,
            $customer->name
        );

        $this->eventBus->publishEvent($event);

        Log::info('Customer created', ['customer_id' => $customer->id]);

        return $customer;
    }

    /**
     * Upsert customer
     */
    public function upsert(array $data): Customer
    {
        return Customer::upsertByExternal($data);
    }

    /**
     * Get all customers
     */
    public function getAll()
    {
        return Customer::all();
    }

    /**
     * Find customer by ID
     */
    public function findById(string $id): ?Customer
    {
        return Customer::find($id);
    }

    /**
     * Find customer by external ID
     */
    public function findByExternal(string $externalType, string $externalId): ?Customer
    {
        return Customer::findByExternal($externalType, $externalId);
    }
}
