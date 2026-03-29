<?php

namespace App\Console\Commands;

use App\Models\Bill;
use App\Models\Customer;
use App\Models\DailyReport;
use App\Models\Expense;
use App\Models\Payment;
use App\Models\Purchase;
use App\Models\Sale;
use App\Models\SaleItem;
use Illuminate\Console\Command;

class CalculateDailyProfit extends Command
{
    protected $signature = 'reports:daily-profit {date?}';
    protected $description = 'Calculate daily profit and store in daily_reports table';

    public function handle()
    {
        $date = $this->argument('date') ?? now()->subDay()->toDateString();

        $this->info("Calculating daily report for {$date}...");

        // Billing income (payments received)
        $billingIncome = (float) Payment::where('status', 'completed')
            ->whereDate('paid_at', $date)
            ->sum('amount');

        // Sales income
        $salesIncome = (float) Sale::where('sale_date', $date)
            ->where('status', '!=', 'cancelled')
            ->sum('paid_amount');

        // Other income
        $otherIncome = 0; // Can extend later

        $totalIncome = $billingIncome + $salesIncome + $otherIncome;

        // Purchase expense
        $purchaseExpense = (float) Purchase::where(function ($q) use ($date) {
            $q->where('purchase_date', $date)
              ->orWhere('date', $date);
        })->sum('paid_amount');

        // Operational expenses
        $operationalExpense = (float) Expense::whereIn('status', ['approved', 'active'])
            ->where(function ($q) use ($date) {
                $q->where('expense_date', $date)
                  ->orWhere('date', $date);
            })
            ->sum('amount');

        $totalExpense = $purchaseExpense + $operationalExpense;

        // Gross profit (from sales only)
        $grossProfit = (float) SaleItem::whereHas('sale', function ($q) use ($date) {
            $q->where('sale_date', $date)->where('status', '!=', 'cancelled');
        })->sum('profit');

        $netProfit = $totalIncome - $totalExpense;

        // Counts
        $newCustomers = Customer::whereDate('created_at', $date)->count();
        $salesCount = Sale::where('sale_date', $date)->where('status', '!=', 'cancelled')->count();
        $purchasesCount = Purchase::where(function ($q) use ($date) {
            $q->where('purchase_date', $date)
              ->orWhere('date', $date);
        })->count();
        $billsPaid = Bill::whereDate('paid_date', $date)->count();

        // Upsert + backward-compatible fields
        DailyReport::updateOrCreate(
            ['report_date' => $date],
            [
                'date'                  => $date,
                'total_income'          => $totalIncome,
                'billing_income'        => $billingIncome,
                'sales_income'          => $salesIncome,
                'other_income'          => $otherIncome,
                'total_expense'         => $totalExpense,
                'purchase_expense'      => $purchaseExpense,
                'operational_expense'   => $operationalExpense,
                'net_profit'            => $netProfit,
                'gross_profit'          => $grossProfit,
                'new_customers'         => $newCustomers,
                'total_sales_count'     => $salesCount,
                'total_purchases_count' => $purchasesCount,
                'bills_paid'            => $billsPaid,
                'total_billed'          => $totalIncome,
                'total_collection'      => $billingIncome,
            ]
        );

        $this->info("✅ Daily report saved | Income: {$totalIncome} | Expense: {$totalExpense} | Profit: {$netProfit}");
        return 0;
    }
}
