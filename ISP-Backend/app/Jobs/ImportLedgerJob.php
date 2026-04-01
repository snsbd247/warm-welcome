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

class ImportLedgerJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 2;
    public int $timeout = 60;

    public function __construct(
        public Tenant $tenant
    ) {}

    public function handle(TenantSetupService $service): void
    {
        Log::info("[ImportLedgerJob] Starting for tenant: {$this->tenant->id}");

        $result = $service->importLedger($this->tenant);

        if (!$result['success']) {
            throw new \RuntimeException("Ledger import failed: {$result['message']}");
        }

        // Mark full setup as completed if all flags are true
        $this->tenant->refresh();
        if ($this->tenant->setup_geo && $this->tenant->setup_accounts &&
            $this->tenant->setup_templates && $this->tenant->setup_ledger) {
            $this->tenant->update(['setup_status' => 'completed']);
        }

        Log::info("[ImportLedgerJob] Completed for tenant: {$this->tenant->id}", $result);
    }
}
