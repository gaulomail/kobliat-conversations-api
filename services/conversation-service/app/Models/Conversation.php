<?php

namespace App\Models;

use Kobliat\Shared\Database\UuidModel;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Conversation extends UuidModel
{
    protected $fillable = [
        'type',
        'status',
        'group_name',
        'group_avatar',
        'group_metadata',
        'last_message_at',
    ];

    protected $casts = [
        'group_metadata' => 'array',
        'last_message_at' => 'datetime',
    ];

    public function participants(): HasMany
    {
        return $this->hasMany(ConversationParticipant::class);
    }
}
