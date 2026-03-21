<?php

namespace App\Console\Commands;

use App\Models\AdminSession;
use App\Models\CustomerSession;
use Illuminate\Console\Command;

class CleanupSessions extends Command
{
    protected $signature = 'sessions:cleanup';
    protected $description = 'Remove expired sessions';

    public function handle()
    {
        $adminExpired = AdminSession::where('updated_at', '<', now()->subHours(24))
            ->where('status', 'active')
            ->update(['status' => 'expired']);

        $customerExpired = CustomerSession::where('expires_at', '<', now())->delete();

        $this->info("Expired {$adminExpired} admin sessions, deleted {$customerExpired} customer sessions.");
        return 0;
    }
}
