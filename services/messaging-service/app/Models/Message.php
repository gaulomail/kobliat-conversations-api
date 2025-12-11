<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;
use Kobliat\Shared\Database\UuidModel;

class Message extends UuidModel
{
    protected $fillable = [
        'conversation_id',
        'sender_customer_id',
        'direction',
        'channel',
        'external_message_id',
        'body',
        'content_type',
        'media_id',
        'metadata',
        'sent_at',
        'is_processed',
    ];

    protected $casts = [
        'metadata' => 'array',
        'sent_at' => 'datetime',
        'is_processed' => 'boolean',
    ];

    public function history(): HasMany
    {
        return $this->hasMany(MessageHistory::class);
    }
}
