<?php

namespace App\Console\Commands;

use App\Jobs\SetupTenantJob;
use App\Models\Tenant;
use App\Services\TenantSetupService;
use Illuminate\Console\Command;

class TenantSetup extends Command
{
    protected $signature = 'tenant:setup
                            {tenant_id : UUID of the tenant}
                            {--sync : Run synchronously instead of queuing}
                            {--step= : Run a single step (geo|accounts|templates|ledger)}';

    protected $description = 'Setup a tenant with default data (geo, accounts, templates, ledger)';

    public function handle(TenantSetupService $service): int
    {
        $tenantId = $this->argument('tenant_id');
        $tenant = Tenant::find($tenantId);

        if (!$tenant) {
            $this->error("Tenant not found: {$tenantId}");
            return self::FAILURE;
        }

        $this->info("Tenant: {$tenant->name} ({$tenant->id})");

        // Single step mode
        if ($step = $this->option('step')) {
            $allowed = ['geo', 'accounts', 'templates', 'ledger'];
            if (!in_array($step, $allowed)) {
                $this->error("Invalid step. Allowed: " . implode(', ', $allowed));
                return self::FAILURE;
            }

            $this->info("Running step: {$step}...");
            $method = 'import' . ucfirst($step);
            $result = $service->$method($tenant);

            if ($result['success']) {
                $this->info("✓ {$result['message']}" . ($result['count'] ?? '' ? " ({$result['count']} records)" : ''));
                return self::SUCCESS;
            } else {
                $this->error("✗ {$result['message']}");
                return self::FAILURE;
            }
        }

        // Sync mode — run all steps sequentially
        if ($this->option('sync')) {
            $this->info('Running full setup synchronously...');
            $this->newLine();

            $results = $service->setupTenant($tenant);

            foreach ($results['results'] as $step => $result) {
                $icon = $result['success'] ? '✓' : '✗';
                $count = isset($result['count']) ? " ({$result['count']} records)" : '';
                $style = $result['success'] ? 'info' : 'error';
                $this->$style("{$icon} {$step}: {$result['message']}{$count}");
            }

            $this->newLine();
            if ($results['success']) {
                $this->info('🎉 Full setup completed successfully!');
                return self::SUCCESS;
            } else {
                $this->error('Some steps failed. Check logs for details.');
                return self::FAILURE;
            }
        }

        // Queue mode (default)
        $this->info('Dispatching setup jobs to queue...');
        SetupTenantJob::dispatch($tenant);
        $this->info('✓ Jobs dispatched. Monitor with: php artisan queue:work');

        return self::SUCCESS;
    }
}
