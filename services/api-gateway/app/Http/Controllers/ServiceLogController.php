<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;

class ServiceLogController extends Controller
{
    private array $services = [
        'api-gateway' => 'services/api-gateway/storage/logs/laravel.log',
        'customer-service' => 'services/customer-service/storage/logs/laravel.log',
        'conversation-service' => 'services/conversation-service/storage/logs/laravel.log',
        'messaging-service' => 'services/messaging-service/storage/logs/laravel.log',
        'media-service' => 'services/media-service/storage/logs/laravel.log',
        'inbound-gateway' => 'services/inbound-gateway/storage/logs/laravel.log',
        'chat-simulator' => 'services/chat-simulator/storage/logs/laravel.log',
    ];

    public function getLogs(Request $request, string $service): JsonResponse
    {
        if (! isset($this->services[$service])) {
            return response()->json(['error' => 'Service not found'], 404);
        }

        $logPath = base_path('../../'.$this->services[$service]);

        if (! File::exists($logPath)) {
            return response()->json([
                'service' => $service,
                'logs' => "Log file not found at: {$logPath}\n\nThe service may not have generated any logs yet.",
                'exists' => false,
            ]);
        }

        // Get the last N lines (default 500)
        $lines = $request->input('lines', 500);
        $filter = $request->input('filter', 'all'); // all, error, warning

        $content = File::get($logPath);
        $logLines = explode("\n", $content);

        // Get last N lines
        $logLines = array_slice($logLines, -$lines);

        // Filter if needed
        if ($filter === 'error') {
            $logLines = array_filter($logLines, fn ($line) => str_contains($line, 'ERROR'));
        } elseif ($filter === 'warning') {
            $logLines = array_filter($logLines, fn ($line) => str_contains($line, 'WARNING'));
        }

        $filteredContent = implode("\n", $logLines);

        return response()->json([
            'service' => $service,
            'logs' => $filteredContent,
            'exists' => true,
            'lines_returned' => count($logLines),
            'filter' => $filter,
        ]);
    }

    public function clearLogs(Request $request, string $service): JsonResponse
    {
        if (! isset($this->services[$service])) {
            return response()->json(['error' => 'Service not found'], 404);
        }

        $logPath = base_path('../../'.$this->services[$service]);

        if (! File::exists($logPath)) {
            return response()->json(['error' => 'Log file not found'], 404);
        }

        try {
            File::put($logPath, '');
            return response()->json(['message' => 'Logs cleared successfully']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to clear logs: '.$e->getMessage()], 500);
        }
    }

    public function listServices(): JsonResponse
    {
        $serviceList = [];

        foreach ($this->services as $key => $path) {
            $fullPath = base_path('../../'.$path);
            $exists = File::exists($fullPath);
            $size = $exists ? File::size($fullPath) : 0;

            $serviceList[] = [
                'key' => $key,
                'name' => ucwords(str_replace('-', ' ', $key)),
                'path' => $path,
                'exists' => $exists,
                'size' => $size,
                'size_human' => $this->formatBytes($size),
            ];
        }

        return response()->json($serviceList);
    }

    private function formatBytes(int $bytes, int $precision = 2): string
    {
        $units = ['B', 'KB', 'MB', 'GB'];

        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }

        return round($bytes, $precision).' '.$units[$i];
    }
}
