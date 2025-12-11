<?php

namespace App\Models;

use Kobliat\Shared\Database\UuidModel;

class Media extends UuidModel
{
    protected $fillable = [
        'owner_service',
        'filename',
        'content_type',
        'size',
        'storage_key',
        'preview_url',
        'metadata',
        'is_scanned',
        'is_infected',
    ];

    protected $casts = [
        'metadata' => 'array',
        'size' => 'integer',
        'is_scanned' => 'boolean',
        'is_infected' => 'boolean',
    ];
}
