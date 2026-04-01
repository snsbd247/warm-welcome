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

class ImportTemplatesJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 2;
    public int $timeout = 60;

    public function __construct(
        public Tenant $tenant
    ) {}

    public function handle(TenantSetupService $service): void
    {
        Log::info("[ImportTemplatesJob] Starting for tenant: {$this->tenant->id}");

        $result = $service->importTemplates($this->tenant);

        if (!$result['success']) {
            throw new \RuntimeException("Templates import failed: {$result['message']}");
        }

        Log::info("[ImportTemplatesJob] Completed for tenant: {$this->tenant->id}", $result);
    }
}
