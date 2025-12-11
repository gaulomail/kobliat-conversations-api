<?php

use App\Http\Controllers\WebhookController;
use Illuminate\Support\Facades\Route;

Route::post('/webhooks/{channel}', [WebhookController::class, 'handle']);

Route::get('/health', function () {
    return response()->json([
        'status' => 'healthy',
        'service' => basename(getcwd()),
        'version' => '1.0.0',
        'timestamp' => now()->toIso8601String(),
    ]);
});
