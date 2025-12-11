<?php

namespace App\Http\Controllers;

use App\Models\ApiLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ApiLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = ApiLog::query()->latest();

        if ($request->has('method')) {
            $query->where('method', $request->query('method'));
        }

        if ($request->has('status')) {
            $query->where('status_code', $request->query('status'));
        }

        if ($request->has('path')) {
            $query->where('path', 'like', '%' . $request->query('path') . '%');
        }

        return response()->json($query->paginate(50));
    }

    public function show(string $id): JsonResponse
    {
        $log = ApiLog::findOrFail($id);
        return response()->json($log);
    }
}
