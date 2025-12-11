<?php

namespace App\Models;

use Kobliat\Shared\Database\UuidModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConversationParticipant extends UuidModel
{
    public $timestamps = false; // Uses joined_at instead

    protected $fillable = [
        'conversation_id',
        'customer_id',
        'role',
        'joined_at',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
        'joined_at' => 'datetime',
    ];

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }
}
