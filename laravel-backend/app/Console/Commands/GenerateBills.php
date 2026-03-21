<?php

namespace App\Console\Commands;

use App\Services\BillingService;
use Illuminate\Console\Command;

class GenerateBills extends Command
{
    protected $signature = 'bills:generate {month?}';
    protected $description = 'Generate monthly bills for all active customers';

    public function handle(BillingService $billingService)
    {
        $month = $this->argument('month') ?? now()->format('Y-m');
        $this->info("Generating bills for {$month}...");

        $result = $billingService->generateMonthlyBills($month);

        $this->info("Created: {$result['created']}, Skipped: {$result['skipped']}");
        return 0;
    }
}
