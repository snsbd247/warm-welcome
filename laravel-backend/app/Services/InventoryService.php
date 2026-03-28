<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Support\Facades\Log;

class InventoryService
{
    /**
     * Increase stock when products are purchased.
     */
    public function increaseStock(string $productId, int $quantity): Product
    {
        $product = Product::findOrFail($productId);
        $product->increment('stock', $quantity);
        $product->refresh();

        Log::info("Stock increased: {$product->name} +{$quantity} = {$product->stock}");

        return $product;
    }

    /**
     * Decrease stock when products are sold.
     */
    public function decreaseStock(string $productId, int $quantity): Product
    {
        $product = Product::findOrFail($productId);

        if ($product->stock < $quantity) {
            throw new \Exception("Insufficient stock for '{$product->name}'. Available: {$product->stock}, Requested: {$quantity}");
        }

        $product->decrement('stock', $quantity);
        $product->refresh();

        Log::info("Stock decreased: {$product->name} -{$quantity} = {$product->stock}");

        return $product;
    }

    /**
     * Restore stock (e.g. when a sale is cancelled/returned).
     */
    public function restoreStock(string $productId, int $quantity): Product
    {
        return $this->increaseStock($productId, $quantity);
    }

    /**
     * Get low stock products.
     */
    public function getLowStockProducts()
    {
        return Product::where('status', 'active')
            ->where('stock', '<=', 5)
            ->get();
    }

    /**
     * Get stock summary.
     */
    public function getStockSummary(): array
    {
        $products = Product::where('status', 'active')->get();

        return [
            'total_products'     => $products->count(),
            'total_stock_value'  => $products->sum(fn($p) => $p->stock * $p->buy_price),
            'total_retail_value' => $products->sum(fn($p) => $p->stock * $p->sell_price),
            'low_stock_count'    => $products->where('stock', '<=', 5)->count(),
            'out_of_stock'       => $products->where('stock', 0)->count(),
        ];
    }
}
