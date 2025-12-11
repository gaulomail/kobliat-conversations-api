<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ConversationController;

Route::get('/conversations', [ConversationController::class, 'index']);
Route::post('/conversations', [ConversationController::class, 'store']);
Route::get('/conversations/{id}', [ConversationController::class, 'show']);

Route::get('/health', function () {
    return response()->json([
        'status' => 'healthy',
        'service' => basename(getcwd()),
        'version' => '1.0.0',
        'timestamp' => now()->toIso8601String()
    ]);
});
