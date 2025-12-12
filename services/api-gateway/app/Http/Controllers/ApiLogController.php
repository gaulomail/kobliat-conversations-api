<?php

namespace App\Http\Controllers;

use App\Models\ApiLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
            $query->where('path', 'like', '%'.$request->query('path').'%');
        }

        if ($request->has('start_date')) {
            $query->whereDate('created_at', '>=', $request->query('start_date'));
        }

        if ($request->has('end_date')) {
            $query->whereDate('created_at', '<=', $request->query('end_date'));
        }

        $perPage = (int) $request->input('per_page', 50);

        return response()->json($query->paginate($perPage));
    }

    public function show(string $id): JsonResponse
    {
        $log = ApiLog::findOrFail($id);

        return response()->json($log);
    }
}
