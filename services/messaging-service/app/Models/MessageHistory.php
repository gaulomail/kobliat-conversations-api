<?php

namespace App\Models;

use Kobliat\Shared\Database\UuidModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MessageHistory extends UuidModel
{
    public $timestamps = false; 

    protected $table = 'message_history';

    protected $fillable = [
        'message_id',
        'conversation_id',
        'customer_id',
        'direction',
        'body',
        'previous_body',
        'edited_at',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
        'edited_at' => 'datetime',
    ];

    public function message(): BelongsTo
    {
        return $this->belongsTo(Message::class);
    }
}
