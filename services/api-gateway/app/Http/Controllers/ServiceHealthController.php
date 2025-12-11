<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;

class ServiceHealthController extends Controller
{
    private array $services = [
        'customer-service' => ['url' => 'http://localhost:8001/api/health', 'port' => 8001],
        'conversation-service' => ['url' => 'http://localhost:8002/api/health', 'port' => 8002],
        'messaging-service' => ['url' => 'http://localhost:8003/api/health', 'port' => 8003],
        'media-service' => ['url' => 'http://localhost:8004/api/health', 'port' => 8004],
        'inbound-gateway' => ['url' => 'http://localhost:8005/api/health', 'port' => 8005],
        'chat-simulator' => ['url' => 'http://localhost:8006/api/health', 'port' => 8006],
    ];

    public function checkAll(): JsonResponse
    {
        $results = [];
        
        foreach ($this->services as $key => $config) {
            $results[$key] = $this->checkService($key, $config);
        }

        return response()->json([
            'services' => $results,
            'checked_at' => now()->toIso8601String()
        ]);
    }

    public function checkOne(string $service): JsonResponse
    {
        if (!isset($this->services[$service])) {
            return response()->json(['error' => 'Service not found'], 404);
        }

        $result = $this->checkService($service, $this->services[$service]);
        
        return response()->json($result);
    }

    private function checkService(string $name, array $config): array
    {
        try {
            $startTime = microtime(true);
            $response = Http::timeout(2)->get($config['url']);
            $responseTime = round((microtime(true) - $startTime) * 1000, 2);

            if ($response->successful()) {
                $data = $response->json();
                return [
                    'name' => $this->formatName($name),
                    'key' => $name,
                    'status' => 'healthy',
                    'port' => $config['port'],
                    'response_time' => $responseTime,
                    'version' => $data['version'] ?? 'unknown',
                    'uptime' => $data['uptime'] ?? null,
                    'last_checked' => now()->toIso8601String()
                ];
            }

            return [
                'name' => $this->formatName($name),
                'key' => $name,
                'status' => 'unhealthy',
                'port' => $config['port'],
                'response_time' => $responseTime,
                'error' => 'HTTP ' . $response->status(),
                'last_checked' => now()->toIso8601String()
            ];

        } catch (\Exception $e) {
            return [
                'name' => $this->formatName($name),
                'key' => $name,
                'status' => 'offline',
                'port' => $config['port'],
                'error' => 'Connection failed: ' . $e->getMessage(),
                'last_checked' => now()->toIso8601String()
            ];
        }
    }

    private function formatName(string $key): string
    {
        return ucwords(str_replace('-', ' ', $key));
    }

    public function restartService(string $service): JsonResponse
    {
        // This would require system-level permissions
        // For now, return a message
        return response()->json([
            'message' => 'Service restart requires system-level permissions',
            'service' => $service,
            'suggestion' => "Run: cd services/{$service} && php artisan serve --port={$this->services[$service]['port']}"
        ]);
    }
}
