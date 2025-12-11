<?php

namespace App\Http\Controllers;

use App\Services\ScenarioEngine;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

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
        ]);

        $result = $this->engine->runScenario($validated['scenario'], '');

        return response()->json($result);
    }
}
