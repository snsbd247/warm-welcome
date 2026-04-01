<?php

namespace App\Jobs;

use App\Models\Tenant;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Log;

/**
 * Dispatches chained tenant setup jobs.
 * If any job in the chain fails, the chain stops.
 */
class SetupTenantJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 1;
    public int $timeout = 300;

    public function __construct(
        public Tenant $tenant
    ) {}

    public function handle(): void
    {
        Log::info("[SetupTenantJob] Starting full setup for tenant: {$this->tenant->id}");

        $this->tenant->update(['setup_status' => 'in_progress']);

        Bus::chain([
            new ImportGeoJob($this->tenant),
            new ImportAccountsJob($this->tenant),
            new ImportTemplatesJob($this->tenant),
            new ImportLedgerJob($this->tenant),
        ])->catch(function (\Throwable $e) {
            Log::error("[SetupTenantJob] Chain failed for tenant {$this->tenant->id}: {$e->getMessage()}");
            $this->tenant->update(['setup_status' => 'failed']);
        })->dispatch();
    }
}
