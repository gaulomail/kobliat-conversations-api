<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;

class TelemetryController extends Controller
{
    /**
     * Get telemetry configuration
     */
    public function getConfig(): JsonResponse
    {
        return response()->json([
            'enabled' => env('TELEMETRY_ENABLED', false),
            'endpoint' => env('TELEMETRY_ENDPOINT', ''),
            'service_name' => env('APP_NAME', 'api-gateway'),
            'sampling_rate' => env('TELEMETRY_SAMPLING_RATE', 1.0),
            'log_level' => env('TELEMETRY_LOG_LEVEL', 'info'),
        ]);
    }

    /**
     * Update telemetry configuration
     */
    public function updateConfig(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'enabled' => 'required|boolean',
            'endpoint' => 'nullable|string|url',
            'sampling_rate' => 'nullable|numeric|min:0|max:1',
            'log_level' => 'nullable|string|in:debug,info,warning,error',
        ]);

        // Update .env file
        $this->updateEnvFile([
            'TELEMETRY_ENABLED' => $validated['enabled'] ? 'true' : 'false',
            'TELEMETRY_ENDPOINT' => $validated['endpoint'] ?? '',
            'TELEMETRY_SAMPLING_RATE' => $validated['sampling_rate'] ?? 1.0,
            'TELEMETRY_LOG_LEVEL' => $validated['log_level'] ?? 'info',
        ]);

        // Clear config cache
        Cache::forget('telemetry_config');

        return response()->json([
            'success' => true,
            'message' => 'Telemetry configuration updated successfully',
            'config' => $validated,
        ]);
    }

    /**
     * Get telemetry metrics
     */
    public function getMetrics(Request $request): JsonResponse
    {
        $timeRange = $request->query('range', '1h'); // 1h, 24h, 7d, 30d

        // Read from telemetry log file
        $logPath = storage_path('logs/telemetry.log');

        if (!File::exists($logPath)) {
            return response()->json([
                'metrics' => [],
                'summary' => [
                    'total_requests' => 0,
                    'avg_duration_ms' => 0,
                    'error_rate' => 0,
                ],
            ]);
        }

        $lines = File::lines($logPath);
        $metrics = [];
        $totalDuration = 0;
        $errorCount = 0;
        $totalCount = 0;

        foreach ($lines as $line) {
            if (empty(trim($line))) continue;

            try {
                $data = json_decode($line, true);
                if (!$data || !isset($data['context'])) continue;

                $context = $data['context'];
                $metrics[] = [
                    'trace_id' => $context['trace_id'] ?? null,
                    'operation' => $context['operation'] ?? 'unknown',
                    'duration_ms' => $context['duration_ms'] ?? 0,
                    'status_code' => $context['status_code'] ?? 0,
                    'timestamp' => $context['timestamp'] ?? null,
                ];

                $totalDuration += $context['duration_ms'] ?? 0;
                $totalCount++;

                if (isset($context['status_code']) && $context['status_code'] >= 400) {
                    $errorCount++;
                }
            } catch (\Throwable $e) {
                continue;
            }
        }

        return response()->json([
            'metrics' => array_slice(array_reverse($metrics), 0, 100), // Last 100 requests
            'summary' => [
                'total_requests' => $totalCount,
                'avg_duration_ms' => $totalCount > 0 ? round($totalDuration / $totalCount, 2) : 0,
                'error_rate' => $totalCount > 0 ? round(($errorCount / $totalCount) * 100, 2) : 0,
                'errors' => $errorCount,
            ],
        ]);
    }

    /**
     * Clear telemetry data
     */
    public function clearMetrics(): JsonResponse
    {
        $logPath = storage_path('logs/telemetry.log');

        if (File::exists($logPath)) {
            File::put($logPath, '');
        }

        return response()->json([
            'success' => true,
            'message' => 'Telemetry metrics cleared successfully',
        ]);
    }

    /**
     * Update environment file
     */
    private function updateEnvFile(array $data): void
    {
        $envPath = base_path('.env');

        if (!File::exists($envPath)) {
            return;
        }

        $envContent = File::get($envPath);

        foreach ($data as $key => $value) {
            $pattern = "/^{$key}=.*/m";
            $replacement = "{$key}={$value}";

            if (preg_match($pattern, $envContent)) {
                $envContent = preg_replace($pattern, $replacement, $envContent);
            } else {
                $envContent .= "\n{$replacement}";
            }
        }

        File::put($envPath, $envContent);
    }
}
