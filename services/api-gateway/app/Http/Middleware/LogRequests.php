<?php

namespace App\Http\Middleware;

use App\Models\ApiLog;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class LogRequests
{
    public function handle(Request $request, Closure $next): Response
    {
        // Skip logging for the logs endpoint to prevent recursion
        if (str_contains($request->path(), 'api/v1/logs')) {
            return $next($request);
        }

        $startTime = microtime(true);

        $response = $next($request);

        $duration = (microtime(true) - $startTime) * 1000;

        try {
            ApiLog::create([
                'method' => $request->method(),
                'path' => $request->path(),
                'status_code' => $response->getStatusCode(),
                'duration_ms' => $duration,
                'ip_address' => $request->ip(),
                'request_payload' => json_encode($request->all()),
                'response_payload' => json_encode($this->getResponsePayload($response)),
                'headers' => json_encode($request->headers->all()),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to log request: '.$e->getMessage());
        }

        return $response;
    }

    private function getResponsePayload($response)
    {
        if ($response instanceof \Illuminate\Http\JsonResponse) {
            $data = $response->getData(true);
            // Limit payload size to prevent memory issues
            $json = json_encode($data);
            if (strlen($json) > 10000) { // 10KB limit
                return ['_truncated' => true, '_size' => strlen($json)];
            }

            return $data;
        }

        $content = $response->getContent();
        if (strlen($content) > 10000) { // 10KB limit
            return ['_truncated' => true, '_size' => strlen($content)];
        }

        $json = json_decode($content, true);

        return json_last_error() === JSON_ERROR_NONE ? $json : null;
    }
}
