<?php

namespace App\Services;

use App\Models\ActivityLog;
use Illuminate\Http\Request;

class ActivityLogger
{
    /**
     * Log a user activity.
     */
    public static function log(
        string $action,
        string $module,
        string $description,
        ?string $userId = null,
        ?string $tenantId = null,
        ?array $metadata = null,
        ?Request $request = null
    ): void {
        try {
            ActivityLog::withoutGlobalScopes()->create([
                'tenant_id'   => $tenantId ?? tenant_id(),
                'user_id'     => $userId,
                'action'      => $action,
                'module'      => $module,
                'description' => $description,
                'ip_address'  => $request?->ip() ?? request()->ip(),
                'metadata'    => $metadata,
                'created_at'  => now(),
            ]);
        } catch (\Throwable $e) {
            \Log::warning('Activity log failed: ' . $e->getMessage());
        }
    }
}
