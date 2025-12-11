<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\MediaController;

Route::post('/media/upload', [MediaController::class, 'upload']);
Route::get('/media/{id}', [MediaController::class, 'show']);
Route::get('/media/{id}/download', [MediaController::class, 'download']);

Route::get('/health', function () {
    return response()->json([
        'status' => 'healthy',
        'service' => basename(getcwd()),
        'version' => '1.0.0',
        'timestamp' => now()->toIso8601String()
    ]);
});
