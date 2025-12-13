<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ApiKeyMiddleware
{
    /**
     * Handle an incoming request.
     * Supports three authentication methods:
     * 1. API Key via X-API-Key header
     * 2. Bearer Token via Authorization: Bearer <token>
     * 3. Basic Auth via Authorization: Basic <base64(username:password)>
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Method 1: API Key (X-API-Key header)
        $apiKey = $request->header('X-API-Key');
        $validApiKey = env('API_GATEWAY_KEY', 'kobliat-secret-key');

        if ($apiKey && $apiKey === $validApiKey) {
            return $next($request);
        }

        // Method 2 & 3: Authorization header (Bearer or Basic)
        $authHeader = $request->header('Authorization');

        if ($authHeader) {
            // Bearer Token
            if (str_starts_with($authHeader, 'Bearer ')) {
                $token = substr($authHeader, 7);
                $validBearerToken = env('API_BEARER_TOKEN', 'kobliat-bearer-token');

                if ($token === $validBearerToken) {
                    return $next($request);
                }
            }

            // Basic Auth
            if (str_starts_with($authHeader, 'Basic ')) {
                $credentials = base64_decode(substr($authHeader, 6));
                $validBasicAuth = env('API_BASIC_AUTH', 'admin:kobliat-password');

                if ($credentials === $validBasicAuth) {
                    return $next($request);
                }
            }
        }

        return response()->json([
            'error' => 'Unauthorized',
            'message' => 'Valid authentication required. Supported methods: X-API-Key header, Bearer token, or Basic auth.'
        ], 401);
    }
}
