<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class TelemetryMiddleware
{
    /**
     * Handle an incoming request and collect telemetry data.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Check if telemetry is enabled
        if (!env('TELEMETRY_ENABLED', false)) {
            return $next($request);
        }

        $startTime = microtime(true);
        $traceId = $this->generateTraceId();
        $spanId = $this->generateSpanId();

        // Add trace context to request
        $request->attributes->set('trace_id', $traceId);
        $request->attributes->set('span_id', $spanId);

        // Add trace headers for downstream services
        $request->headers->set('X-Trace-Id', $traceId);
        $request->headers->set('X-Span-Id', $spanId);

        try {
            $response = $next($request);

            // Calculate duration
            $duration = (microtime(true) - $startTime) * 1000; // Convert to milliseconds

            // Send telemetry data
            $this->recordTelemetry([
                'trace_id' => $traceId,
                'span_id' => $spanId,
                'service_name' => env('APP_NAME', 'api-gateway'),
                'operation' => $request->method() . ' ' . $request->path(),
                'duration_ms' => round($duration, 2),
                'status_code' => $response->getStatusCode(),
                'method' => $request->method(),
                'path' => $request->path(),
                'timestamp' => now()->toIso8601String(),
                'client_ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            // Add trace headers to response
            $response->headers->set('X-Trace-Id', $traceId);

            return $response;
        } catch (\Throwable $e) {
            $duration = (microtime(true) - $startTime) * 1000;

            // Record error telemetry
            $this->recordTelemetry([
                'trace_id' => $traceId,
                'span_id' => $spanId,
                'service_name' => env('APP_NAME', 'api-gateway'),
                'operation' => $request->method() . ' ' . $request->path(),
                'duration_ms' => round($duration, 2),
                'status_code' => 500,
                'method' => $request->method(),
                'path' => $request->path(),
                'timestamp' => now()->toIso8601String(),
                'error' => $e->getMessage(),
                'error_type' => get_class($e),
            ]);

            throw $e;
        }
    }

    private function generateTraceId(): string
    {
        return bin2hex(random_bytes(16));
    }

    private function generateSpanId(): string
    {
        return bin2hex(random_bytes(8));
    }

    private function recordTelemetry(array $data): void
    {
        $endpoint = env('TELEMETRY_ENDPOINT');

        if (!$endpoint) {
            // Fallback to logging if no endpoint configured
            Log::channel('telemetry')->info('Telemetry', $data);
            return;
        }

        // Send to telemetry endpoint asynchronously (fire and forget)
        try {
            $ch = curl_init($endpoint);
            curl_setopt_array($ch, [
                CURLOPT_POST => true,
                CURLOPT_POSTFIELDS => json_encode($data),
                CURLOPT_HTTPHEADER => [
                    'Content-Type: application/json',
                    'X-Telemetry-Key: ' . env('TELEMETRY_API_KEY', ''),
                ],
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT_MS => 100, // Fast timeout to avoid blocking
            ]);
            curl_exec($ch);
            curl_close($ch);
        } catch (\Throwable $e) {
            // Silently fail - telemetry should never break the app
            Log::debug('Telemetry send failed: ' . $e->getMessage());
        }
    }
}
