<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Purchase;
use App\Services\PurchaseService;
use Illuminate\Http\Request;

class PurchaseController extends Controller
{
    public function __construct(protected PurchaseService $purchaseService) {}

    public function index(Request $request)
    {
        $query = Purchase::with(['supplier', 'items.product']);

        if ($request->has('supplier_id')) {
            $query->where('supplier_id', $request->supplier_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('from') && $request->has('to')) {
            $query->whereBetween('date', [$request->from, $request->to]);
        }

        return response()->json(
            $query->orderBy('date', 'desc')->paginate($request->get('per_page', 50))
        );
    }

    public function show(string $id)
    {
        $purchase = Purchase::with(['supplier', 'items.product'])
            ->findOrFail($id);
        return response()->json($purchase);
    }

    public function store(Request $request)
    {
        $request->validate([
            'supplier_id'           => 'required|uuid|exists:suppliers,id',
            'date'                  => 'nullable|date',
            'items'                 => 'required|array|min:1',
            'items.*.product_id'    => 'required|uuid|exists:products,id',
            'items.*.quantity'      => 'required|integer|min:1',
            'items.*.unit_price'    => 'required|numeric|min:0',
            'paid_amount'           => 'nullable|numeric|min:0',
        ]);

        $admin = $request->get('admin_user');

        $purchase = $this->purchaseService->createPurchase(
            $request->only(['supplier_id', 'date', 'paid_amount', 'notes']),
            $request->items,
            $admin?->id
        );

        return response()->json($purchase, 201);
    }

    public function addPayment(Request $request, string $id)
    {
        $request->validate([
            'amount' => 'required|numeric|min:0.01',
        ]);

        $purchase = $this->purchaseService->addPayment($id, $request->amount);
        return response()->json($purchase);
    }

    public function vendorHistory(string $vendorId)
    {
        return response()->json(
            $this->purchaseService->supplierPurchaseHistory($vendorId)
        );
    }

    public function destroy(string $id)
    {
        $purchase = Purchase::with('items')->findOrFail($id);
        $purchase->delete();
        return response()->json(['success' => true]);
    }
}
