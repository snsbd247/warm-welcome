<?php

namespace App\Console\Commands;

use App\Models\Bill;
use App\Models\Customer;
use Illuminate\Console\Command;

class AutoSuspend extends Command
{
    protected $signature = 'customers:auto-suspend {--days=7}';
    protected $description = 'Auto-suspend customers with overdue bills';

    public function handle()
    {
        $days = (int) $this->option('days');
        $cutoff = now()->subDays($days);

        $overdueCustomerIds = Bill::where('status', 'unpaid')
            ->where('due_date', '<', $cutoff)
            ->pluck('customer_id')
            ->unique();

        $count = 0;
        foreach ($overdueCustomerIds as $customerId) {
            $customer = Customer::find($customerId);
            if ($customer && $customer->status === 'active') {
                $customer->update(['status' => 'suspended']);
                $count++;
            }
        }

        $this->info("Suspended {$count} customers with bills overdue by {$days}+ days.");
        return 0;
    }
}
