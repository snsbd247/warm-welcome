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
        if ($last && preg_match('/SL-(\d+)/', $last->sale_no, $m)) {
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

            // Pre-validate stock
            foreach ($items as $item) {
                $product = Product::findOrFail($item['product_id']);
                if ($product->stock < $item['quantity']) {
                    throw new \Exception("Insufficient stock for '{$product->name}'. Available: {$product->stock}");
                }
            }

            $discount = $data['discount'] ?? 0;
            $tax      = $data['tax'] ?? 0;

            foreach ($items as $item) {
                $product   = Product::findOrFail($item['product_id']);
                $unitPrice = $item['unit_price'] ?? $product->sell_price;
                $subtotal += $item['quantity'] * $unitPrice;
            }

            $total = $subtotal - $discount + $tax;
            $paid  = $data['paid_amount'] ?? $total;

            $sale = Sale::create([
                'sale_no'        => $this->generateSaleNumber(),
                'customer_name'  => $data['customer_name'] ?? null,
                'customer_phone' => $data['customer_phone'] ?? null,
                'sale_date'      => $data['sale_date'] ?? now()->toDateString(),
                'discount'       => $discount,
                'tax'            => $tax,
                'total'          => $total,
                'paid_amount'    => $paid,
                'payment_method' => $data['payment_method'] ?? 'cash',
                'status'         => $paid >= $total ? 'completed' : 'partial',
                'notes'          => $data['notes'] ?? null,
            ]);

            // Create items & update stock
            foreach ($items as $item) {
                $product   = Product::findOrFail($item['product_id']);
                $unitPrice = $item['unit_price'] ?? $product->sell_price;

                SaleItem::create([
                    'sale_id'    => $sale->id,
                    'product_id' => $item['product_id'],
                    'quantity'   => $item['quantity'],
                    'unit_price' => $unitPrice,
                ]);

                $this->inventoryService->decreaseStock($item['product_id'], $item['quantity']);
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

            $newPaid = $sale->paid_amount + $amount;

            $sale->update([
                'paid_amount' => $newPaid,
                'status'      => $newPaid >= $sale->total ? 'completed' : 'partial',
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
