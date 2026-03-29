<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use Illuminate\Support\Facades\DB;

class SalesService
{
    public function __construct(
        protected InventoryService $inventoryService
    ) {}

    /**
     * Generate next sale number.
     */
    public function generateSaleNumber(): string
    {
        $last = Sale::orderBy('created_at', 'desc')->first();
        $lastNumber = $last?->sale_no ?: $last?->invoice_number;

        if ($lastNumber && preg_match('/SL-(\d+)/', $lastNumber, $m)) {
            return 'SL-' . str_pad((int) $m[1] + 1, 6, '0', STR_PAD_LEFT);
        }

        return 'SL-000001';
    }

    /**
     * Create a sale with items (auto stock decrease).
     */
    public function createSale(array $data, array $items): Sale
    {
        return DB::transaction(function () use ($data, $items) {
            $subtotal = 0;

            foreach ($items as $item) {
                $product = Product::findOrFail($item['product_id']);
                if ($product->stock < $item['quantity']) {
                    throw new \Exception("Insufficient stock for '{$product->name}'. Available: {$product->stock}");
                }
            }

            $discount = (float) ($data['discount'] ?? 0);
            $tax = (float) ($data['tax'] ?? 0);

            foreach ($items as $item) {
                $product = Product::findOrFail($item['product_id']);
                $unitPrice = (float) ($item['unit_price'] ?? $product->sell_price);
                $subtotal += $item['quantity'] * $unitPrice;
            }

            $total = $subtotal - $discount + $tax;
            $paid = (float) ($data['paid_amount'] ?? $total);
            $due = max($total - $paid, 0);
            $saleNo = $this->generateSaleNumber();

            $sale = Sale::create([
                'sale_no'        => $saleNo,
                'invoice_number' => $saleNo,
                'customer_id'    => $data['customer_id'] ?? null,
                'customer_name'  => $data['customer_name'] ?? null,
                'customer_phone' => $data['customer_phone'] ?? null,
                'sale_date'      => $data['sale_date'] ?? now()->toDateString(),
                'subtotal'       => $subtotal,
                'discount'       => $discount,
                'tax'            => $tax,
                'total'          => $total,
                'paid_amount'    => $paid,
                'due_amount'     => $due,
                'payment_method' => $data['payment_method'] ?? 'cash',
                'status'         => $paid >= $total ? 'completed' : 'partial',
                'notes'          => $data['notes'] ?? null,
            ]);

            foreach ($items as $item) {
                $product = Product::findOrFail($item['product_id']);
                $qty = (int) $item['quantity'];
                $unitPrice = (float) ($item['unit_price'] ?? $product->sell_price);
                $costPrice = (float) ($product->buy_price ?? 0);
                $lineTotal = $qty * $unitPrice;
                $lineProfit = ($unitPrice - $costPrice) * $qty;

                SaleItem::create([
                    'sale_id'      => $sale->id,
                    'product_id'   => $item['product_id'],
                    'quantity'     => $qty,
                    'unit_price'   => $unitPrice,
                    'cost_price'   => $costPrice,
                    'total'        => $lineTotal,
                    'profit'       => $lineProfit,
                    'description'  => $item['description'] ?? null,
                ]);

                $this->inventoryService->decreaseStock($item['product_id'], $qty);
            }

            return $sale->load('items.product');
        });
    }

    /**
     * Add payment to existing sale.
     */
    public function addPayment(string $saleId, float $amount): Sale
    {
        return DB::transaction(function () use ($saleId, $amount) {
            $sale = Sale::findOrFail($saleId);

            $newPaid = (float) $sale->paid_amount + $amount;
            $due = max((float) $sale->total - $newPaid, 0);

            $sale->update([
                'paid_amount' => $newPaid,
                'due_amount'  => $due,
                'status'      => $newPaid >= (float) $sale->total ? 'completed' : 'partial',
            ]);

            return $sale->fresh();
        });
    }

    /**
     * Cancel a sale and restore stock.
     */
    public function cancelSale(string $saleId): Sale
    {
        return DB::transaction(function () use ($saleId) {
            $sale = Sale::with('items')->findOrFail($saleId);

            foreach ($sale->items as $item) {
                $this->inventoryService->restoreStock($item->product_id, (int) $item->quantity);
            }

            $sale->update(['status' => 'cancelled']);
            return $sale->fresh();
        });
    }

    /**
     * Get sales profit report.
     */
    public function getProfitReport(?string $from = null, ?string $to = null): array
    {
        $from = $from ?? now()->startOfMonth()->toDateString();
        $to   = $to ?? now()->endOfMonth()->toDateString();

        $sales = Sale::with('items.product')
            ->whereBetween('sale_date', [$from, $to])
            ->where('status', '!=', 'cancelled')
            ->get();

        $totalRevenue = $sales->sum('total');
        $totalCost = $sales->flatMap->items->sum(fn($i) => $i->product ? $i->product->buy_price * $i->quantity : 0);
        $totalProfit = $totalRevenue - $totalCost;

        return [
            'from'          => $from,
            'to'            => $to,
            'total_sales'   => $sales->count(),
            'total_revenue' => (float) $totalRevenue,
            'total_cost'    => (float) $totalCost,
            'total_profit'  => (float) $totalProfit,
            'margin'        => $totalRevenue > 0 ? round(($totalProfit / $totalRevenue) * 100, 2) : 0,
        ];
    }
}
