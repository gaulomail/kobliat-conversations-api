<?php

use App\Http\Controllers\MessageController;
use Illuminate\Support\Facades\Route;

Route::get('/conversations/{conversationId}/messages', [MessageController::class, 'index']);
Route::post('/messages', [MessageController::class, 'store']);
Route::put('/messages/{id}', [MessageController::class, 'update']);

Route::get('/health', function () {
    return response()->json([
        'status' => 'healthy',
        'service' => basename(getcwd()),
        'version' => '1.0.0',
        'timestamp' => now()->toIso8601String(),
    ]);
});
