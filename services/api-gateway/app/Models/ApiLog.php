<?php

namespace App\Models;

use Kobliat\Shared\Database\UuidModel;

class ApiLog extends UuidModel
{
    protected $guarded = [];

    protected $casts = [
        'request_payload' => 'array',
        'headers' => 'array',
    ];
}
