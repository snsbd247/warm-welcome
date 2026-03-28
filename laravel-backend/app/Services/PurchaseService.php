<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Supplier;
use Illuminate\Support\Facades\DB;

class PurchaseService
{
    public function __construct(
        protected InventoryService $inventoryService
    ) {}

    /**
     * Generate next purchase number.
     */
    public function generatePurchaseNumber(): string
    {
        $last = Purchase::orderBy('created_at', 'desc')->first();
        if ($last && preg_match('/PUR-(\d+)/', $last->purchase_no, $m)) {
            return 'PUR-' . str_pad((int) $m[1] + 1, 6, '0', STR_PAD_LEFT);
        }
        return 'PUR-000001';
    }

    /**
     * Create a purchase with items.
     */
    public function createPurchase(array $data, array $items, ?string $createdBy = null): Purchase
    {
        return DB::transaction(function () use ($data, $items) {
            $totalAmount = 0;
            foreach ($items as $item) {
                $totalAmount += $item['quantity'] * $item['unit_price'];
            }

            $paid = $data['paid_amount'] ?? 0;

            $purchase = Purchase::create([
                'purchase_no'  => $this->generatePurchaseNumber(),
                'supplier_id'  => $data['supplier_id'],
                'date'         => $data['date'] ?? now(),
                'total_amount' => $totalAmount,
                'paid_amount'  => $paid,
                'status'       => $paid >= $totalAmount ? 'paid' : 'unpaid',
                'notes'        => $data['notes'] ?? null,
            ]);

            foreach ($items as $item) {
                PurchaseItem::create([
                    'purchase_id' => $purchase->id,
                    'product_id'  => $item['product_id'],
                    'quantity'    => $item['quantity'],
                    'unit_price'  => $item['unit_price'],
                ]);

                $this->inventoryService->increaseStock($item['product_id'], $item['quantity']);

                Product::where('id', $item['product_id'])
                    ->update(['buy_price' => $item['unit_price']]);
            }

            // Update supplier total_due
            $due = $totalAmount - $paid;
            if ($due > 0) {
                Supplier::where('id', $data['supplier_id'])->increment('total_due', $due);
            }

            return $purchase->load('items.product', 'supplier');
        });
    }

    /**
     * Add payment to existing purchase.
     */
    public function addPayment(string $purchaseId, float $amount): Purchase
    {
        return DB::transaction(function () use ($purchaseId, $amount) {
            $purchase = Purchase::findOrFail($purchaseId);

            $newPaid = $purchase->paid_amount + $amount;

            $purchase->update([
                'paid_amount' => $newPaid,
                'status'      => $newPaid >= $purchase->total_amount ? 'paid' : 'unpaid',
            ]);

            // Reduce supplier total_due
            Supplier::where('id', $purchase->supplier_id)->decrement('total_due', $amount);

            return $purchase->fresh();
        });
    }

    /**
     * Get supplier purchase history.
     */
    public function supplierPurchaseHistory(string $supplierId): array
    {
        $purchases = Purchase::where('supplier_id', $supplierId)
            ->with('items.product')
            ->orderBy('date', 'desc')
            ->get();

        return [
            'supplier'        => Supplier::find($supplierId),
            'purchases'       => $purchases,
            'total_purchases' => $purchases->sum('total_amount'),
            'total_paid'      => $purchases->sum('paid_amount'),
            'total_due'       => $purchases->sum('total_amount') - $purchases->sum('paid_amount'),
        ];
    }
}
