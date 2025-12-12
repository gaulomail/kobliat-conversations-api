<?php

namespace App\Http\Controllers;

use App\Services\ScenarioEngine;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SimulatorController extends Controller
{
    private ScenarioEngine $engine;

    public function __construct(ScenarioEngine $engine)
    {
        $this->engine = $engine;
    }

    public function simulate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'scenario' => 'required|string|in:angry_customer,curious_shopper',
            'message' => 'nullable|string',
        ]);

        $message = $request->input('message'); // Optional incoming message Context
        $result = $this->engine->runScenario($validated['scenario'], $message);

        return response()->json($result);
    }
}
