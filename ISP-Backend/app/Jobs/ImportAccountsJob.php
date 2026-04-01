<?php

namespace App\Jobs;

use App\Models\Tenant;
use App\Services\TenantSetupService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ImportAccountsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 2;
    public int $timeout = 120;

    public function __construct(
        public Tenant $tenant
    ) {}

    public function handle(TenantSetupService $service): void
    {
        Log::info("[ImportAccountsJob] Starting for tenant: {$this->tenant->id}");

        $result = $service->importAccounts($this->tenant);

        if (!$result['success']) {
            throw new \RuntimeException("Accounts import failed: {$result['message']}");
        }

        Log::info("[ImportAccountsJob] Completed for tenant: {$this->tenant->id}", $result);
    }
}
