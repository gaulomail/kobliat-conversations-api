<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;

class ServiceControlController extends Controller
{
    private string $scriptPath;

    private array $validServices = [
        'api-gateway',
        'customer-service',
        'conversation-service',
        'messaging-service',
        'media-service',
        'inbound-gateway',
        'chat-simulator',
    ];

    public function __construct()
    {
        $this->scriptPath = base_path('../scripts/service-control.sh');
    }

    public function start(string $service): JsonResponse
    {
        if (! in_array($service, $this->validServices)) {
            return response()->json(['error' => 'Invalid service name'], 400);
        }

        $output = [];
        $returnCode = 0;

        exec("bash {$this->scriptPath} start {$service} 2>&1", $output, $returnCode);

        return response()->json([
            'service' => $service,
            'action' => 'start',
            'success' => $returnCode === 0,
            'message' => implode("\n", $output),
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    public function stop(string $service): JsonResponse
    {
        if (! in_array($service, $this->validServices)) {
            return response()->json(['error' => 'Invalid service name'], 400);
        }

        // Don't allow stopping the API Gateway itself
        if ($service === 'api-gateway') {
            return response()->json([
                'error' => 'Cannot stop API Gateway from itself',
                'message' => 'Stopping the API Gateway would prevent further control operations',
            ], 400);
        }

        $output = [];
        $returnCode = 0;

        exec("bash {$this->scriptPath} stop {$service} 2>&1", $output, $returnCode);

        return response()->json([
            'service' => $service,
            'action' => 'stop',
            'success' => $returnCode === 0,
            'message' => implode("\n", $output),
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    public function restart(string $service): JsonResponse
    {
        if (! in_array($service, $this->validServices)) {
            return response()->json(['error' => 'Invalid service name'], 400);
        }

        // Don't allow restarting the API Gateway itself
        if ($service === 'api-gateway') {
            return response()->json([
                'error' => 'Cannot restart API Gateway from itself',
                'message' => 'Restarting the API Gateway would interrupt the operation',
            ], 400);
        }

        $output = [];
        $returnCode = 0;

        exec("bash {$this->scriptPath} restart {$service} 2>&1", $output, $returnCode);

        return response()->json([
            'service' => $service,
            'action' => 'restart',
            'success' => $returnCode === 0,
            'message' => implode("\n", $output),
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    public function status(string $service): JsonResponse
    {
        if (! in_array($service, $this->validServices)) {
            return response()->json(['error' => 'Invalid service name'], 400);
        }

        $output = [];
        $returnCode = 0;

        exec("bash {$this->scriptPath} status {$service} 2>&1", $output, $returnCode);

        $statusOutput = implode("\n", $output);
        $isRunning = strpos($statusOutput, 'running:') === 0;
        $pid = null;

        if ($isRunning) {
            $parts = explode(':', $statusOutput);
            $pid = isset($parts[1]) ? (int) $parts[1] : null;
        }

        return response()->json([
            'service' => $service,
            'running' => $isRunning,
            'pid' => $pid,
            'status' => $isRunning ? 'running' : 'stopped',
            'timestamp' => now()->toIso8601String(),
        ]);
    }
}
