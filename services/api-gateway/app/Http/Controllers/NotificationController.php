<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;

class NotificationController extends Controller
{
    private $healthController;

    public function __construct(ServiceHealthController $healthController)
    {
        $this->healthController = $healthController;
    }

    public function index(): JsonResponse
    {
        $healthResponse = $this->healthController->checkAll()->getData(true);
        $services = $healthResponse['services'] ?? [];
        
        $notifications = [];
        $idCounter = 1;

        // 1. Check for Service Issues (Real-time)
        foreach ($services as $service) {
            // Error / Offline Check
            if ($service['status'] !== 'healthy') {
                $notifications[] = [
                    'id' => $idCounter++,
                    'type' => 'alert',
                    'title' => "{$service['name']} Failure",
                    'message' => "Service is currently {$service['status']}. Error: " . ($service['error'] ?? 'Unknown'),
                    'time' => 'Just now',
                    'read' => false,
                    'color' => 'red'
                ];
            }
            // Latency Check
            elseif (($service['response_time'] ?? 0) > 500) {
                $notifications[] = [
                    'id' => $idCounter++,
                    'type' => 'warning',
                    'title' => "High Latency: {$service['name']}",
                    'message' => "Response time is high (" . $service['response_time'] . "ms).",
                    'time' => 'Just now',
                    'read' => false,
                    'color' => 'yellow' // Frontend can map this to orange/yellow
                ];
            }
        }

        // 2. Add a system summary if everything is fine
        if (empty($notifications)) {
            $notifications[] = [
                'id' => $idCounter++,
                'type' => 'success',
                'title' => 'System Healthy',
                'message' => 'All ' . count($services) . ' microservices are operational and performing optimally.',
                'time' => 'Just now',
                'read' => true,
                'color' => 'green'
            ];
        }

        return response()->json($notifications);
    }
}
