<?php

namespace App\Http\Controllers;

use App\Services\CustomerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    private CustomerService $customerService;

    public function __construct(CustomerService $customerService)
    {
        $this->customerService = $customerService;
    }

    /**
     * GET /api/customers/{id}
     * Get customer by ID
     */
    public function show(string $id): JsonResponse
    {
        $customer = $this->customerService->findById($id);

        if (! $customer) {
            return response()->json([
                'error' => 'Customer not found',
            ], 404);
        }

        return response()->json($customer);
    }

    /**
     * POST /api/customers
     * Create or upsert customer
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'external_id' => 'required|string',
            'external_type' => 'required|string',
            'name' => 'nullable|string',
            'metadata' => 'nullable|array',
        ]);

        $customer = $this->customerService->upsert($validated);

        return response()->json($customer, 201);
    }

    /**
     * GET /api/customers/external/{type}/{id}
     * Find customer by external ID
     */
    public function showByExternal(string $type, string $id): JsonResponse
    {
        $customer = $this->customerService->findByExternal($type, $id);

        if (! $customer) {
            return response()->json([
                'error' => 'Customer not found',
            ], 404);
        }

        return response()->json($customer);
    }
}
