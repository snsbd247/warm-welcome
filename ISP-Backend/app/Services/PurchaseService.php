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
        $lastNumber = $last?->purchase_no ?: $last?->purchase_number;

        if ($lastNumber && preg_match('/PUR-(\d+)/', $lastNumber, $m)) {
            return 'PUR-' . str_pad((int) $m[1] + 1, 6, '0', STR_PAD_LEFT);
        }

        return 'PUR-000001';
    }

    /**
     * Create a purchase with items.
     */
    public function createPurchase(array $data, array $items, ?string $createdBy = null): Purchase
    {
        return DB::transaction(function () use ($data, $items, $createdBy) {
            $subtotal = 0;
            foreach ($items as $item) {
                $subtotal += $item['quantity'] * $item['unit_price'];
            }

            $paid = (float) ($data['paid_amount'] ?? 0);
            $purchaseNo = $this->generatePurchaseNumber();
            $purchaseDate = $data['date'] ?? now()->toDateString();
            $totalAmount = $subtotal;
            $dueAmount = max($totalAmount - $paid, 0);

            $purchase = Purchase::create([
                'purchase_no'     => $purchaseNo,
                'purchase_number' => $purchaseNo,
                'supplier_id'     => $data['supplier_id'],
                'vendor_id'       => $data['supplier_id'],
                'date'            => $purchaseDate,
                'purchase_date'   => $purchaseDate,
                'subtotal'        => $subtotal,
                'total'           => $totalAmount,
                'total_amount'    => $totalAmount,
                'paid_amount'     => $paid,
                'due_amount'      => $dueAmount,
                'payment_method'  => $data['payment_method'] ?? null,
                'status'          => $paid >= $totalAmount ? 'paid' : 'unpaid',
                'notes'           => $data['notes'] ?? null,
                'created_by'      => $createdBy,
            ]);

            foreach ($items as $item) {
                $lineTotal = $item['quantity'] * $item['unit_price'];

                PurchaseItem::create([
                    'purchase_id' => $purchase->id,
                    'product_id'  => $item['product_id'],
                    'quantity'    => $item['quantity'],
                    'unit_price'  => $item['unit_price'],
                    'total'       => $lineTotal,
                ]);

                $this->inventoryService->increaseStock($item['product_id'], $item['quantity']);

                Product::where('id', $item['product_id'])
                    ->update(['buy_price' => $item['unit_price']]);
            }

            if ($dueAmount > 0) {
                Supplier::where('id', $data['supplier_id'])->increment('total_due', $dueAmount);
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

            $newPaid = (float) $purchase->paid_amount + $amount;
            $due = max((float) $purchase->total_amount - $newPaid, 0);

            $purchase->update([
                'paid_amount' => $newPaid,
                'due_amount'  => $due,
                'status'      => $newPaid >= (float) $purchase->total_amount ? 'paid' : 'unpaid',
            ]);

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
