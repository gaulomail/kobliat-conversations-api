<?php



use App\Http\Controllers\GatewayController;
use App\Http\Middleware\ApiKeyMiddleware;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->middleware(ApiKeyMiddleware::class)->group(function () {

    // Aggregated Endpoints
    Route::get('/conversations/{id}/details', [GatewayController::class, 'getConversationDetails']);

    // Proxy Pass-throughs (Explicit routes are better than catch-all for documentation)

    // Customer Service
    Route::post('/customers', function () {
        return app(GatewayController::class)->proxy(request(), 'customer', '/api/customers');
    });
    Route::get('/customers/{id}', function ($id) {
        return app(GatewayController::class)->proxy(request(), 'customer', "/api/customers/{$id}");
    });

    // Conversation Service
    Route::get('/conversations', function () {
        return app(GatewayController::class)->proxy(request(), 'conversation', '/api/conversations');
    });
    Route::post('/conversations', function () {
        return app(GatewayController::class)->proxy(request(), 'conversation', '/api/conversations');
    });
    Route::get('/conversations/{id}', function ($id) {
        return app(GatewayController::class)->proxy(request(), 'conversation', "/api/conversations/{$id}");
    });

    // Messaging Service
    Route::get('/conversations/{conversationId}/messages', function ($conversationId) {
        return app(GatewayController::class)->proxy(request(), 'messaging', "/api/conversations/{$conversationId}/messages");
    });
    Route::post('/messages', function () {
        return app(GatewayController::class)->proxy(request(), 'messaging', '/api/messages');
    });
    Route::put('/messages/{id}', function ($id) {
        return app(GatewayController::class)->proxy(request(), 'messaging', "/api/messages/{$id}");
    });

    // Media Service
    Route::post('/media/upload', function (Request $request) {
        try {
            if (! $request->hasFile('file')) {
                return response()->json(['error' => 'No file provided'], 400);
            }

            $file = $request->file('file');
            $ownerService = $request->input('owner_service', 'unknown');

            // Forward to Media Service
            $response = Http::attach(
                'file',
                file_get_contents($file->getRealPath()),
                $file->getClientOriginalName()
            )->post('http://localhost:8004/api/media/upload', [
                'owner_service' => $ownerService,
            ]);

            return response()->json($response->json(), $response->status());
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    });
    Route::get('/media/{id}', function ($id) {
        return app(GatewayController::class)->proxy(request(), 'media', "/api/media/{$id}");
    });
    Route::get('/media/{id}/download', function ($id) {
        return app(GatewayController::class)->proxyDownload(request(), 'media', "/api/media/{$id}/download");
    });

    // API Logs
    Route::get('/logs', [\App\Http\Controllers\ApiLogController::class, 'index']);
    Route::get('/logs/{id}', [\App\Http\Controllers\ApiLogController::class, 'show']);

    // Service Logs
    Route::get('/service-logs', [\App\Http\Controllers\ServiceLogController::class, 'listServices']);
    Route::get('/service-logs/{service}', [\App\Http\Controllers\ServiceLogController::class, 'getLogs']);

    // Service Health
    Route::get('/services/health', [\App\Http\Controllers\ServiceHealthController::class, 'checkAll']);
    Route::get('/services/health/{service}', [\App\Http\Controllers\ServiceHealthController::class, 'checkOne']);

    // Service Control
    Route::post('/services/{service}/start', [\App\Http\Controllers\ServiceControlController::class, 'start']);
    Route::post('/services/{service}/stop', [\App\Http\Controllers\ServiceControlController::class, 'stop']);
    Route::post('/services/{service}/restart', [\App\Http\Controllers\ServiceControlController::class, 'restart']);
    Route::get('/services/{service}/status', [\App\Http\Controllers\ServiceControlController::class, 'status']);
});
