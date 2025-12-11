<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CustomerController;

Route::post('/customers', [CustomerController::class, 'store']);
Route::get('/customers/{id}', [CustomerController::class, 'show']);
Route::get('/customers/external/{type}/{id}', [CustomerController::class, 'showByExternal']);

Route::get('/health', function () {
    return response()->json([
        'status' => 'healthy',
        'service' => basename(getcwd()),
        'version' => '1.0.0',
        'timestamp' => now()->toIso8601String()
    ]);
});
