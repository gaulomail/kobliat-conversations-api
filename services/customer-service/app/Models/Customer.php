<?php

namespace App\Models;

use Kobliat\Shared\Database\UuidModel;

class Customer extends UuidModel
{
    protected $fillable = [
        'external_id',
        'external_type',
        'name',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Find customer by external ID and type
     */
    public static function findByExternal(string $externalType, string $externalId): ?self
    {
        return self::where('external_type', $externalType)
            ->where('external_id', $externalId)
            ->first();
    }

    /**
     * Create or update customer by external ID
     */
    public static function upsertByExternal(array $data): self
    {
        $customer = self::findByExternal($data['external_type'], $data['external_id']);

        if ($customer) {
            $customer->update($data);

            return $customer;
        }

        return self::create($data);
    }
}
