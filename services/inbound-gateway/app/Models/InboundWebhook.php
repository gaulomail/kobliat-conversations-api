<?php

namespace App\Models;

use Kobliat\Shared\Database\UuidModel;

class InboundWebhook extends UuidModel
{
    protected $fillable = [
        'provider',
        'provider_message_id',
        'headers',
        'raw_payload',
        'is_processed',
        'received_at',
    ];

    protected $casts = [
        'headers' => 'array',
        'raw_payload' => 'array',
        'is_processed' => 'boolean',
        'received_at' => 'datetime',
    ];
}
