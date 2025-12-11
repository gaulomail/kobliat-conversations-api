<?php

namespace App\Services;

use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;

class ServiceProxyService
{
    public function forward(string $service, string $method, string $path, array $data = [], array $headers = []): Response
    {
        // Resolve service URL from env
        // e.g. SERVICE_CUSTOMER_URL=http://localhost:8001
        $baseUrl = env(strtoupper("SERVICE_{$service}_URL"));

        if (! $baseUrl) {
            throw new \Exception("Service URL not configured for {$service}");
        }

        $url = rtrim($baseUrl, '/').'/'.ltrim($path, '/');

        return Http::withHeaders($headers)
            ->$method($url, $data);
    }
}
