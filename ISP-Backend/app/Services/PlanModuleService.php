<?php

namespace App\Services;

use App\Models\Module;
use App\Models\PlanModule;
use App\Models\Subscription;
use Illuminate\Support\Facades\Cache;

class PlanModuleService
{
    /**
     * Get allowed module slugs for a tenant (via their active subscription plan).
     */
    public static function getAllowedModules(?string $tenantId): array
    {
        if (!$tenantId) {
            // Central domain — all modules allowed
            return Module::where('is_active', true)->pluck('slug')->toArray();
        }

        return Cache::remember("tenant_modules_{$tenantId}", 300, function () use ($tenantId) {
            // Core modules are always allowed
            $coreModules = Module::where('is_core', true)->where('is_active', true)->pluck('slug')->toArray();

            // Get active subscription's plan
            $subscription = Subscription::where('tenant_id', $tenantId)
                ->where('status', 'active')
                ->where('end_date', '>=', now()->toDateString())
                ->first();

            if (!$subscription) {
                return $coreModules; // Only core modules if no plan
            }

            // Get plan's allowed modules
            $planModules = PlanModule::where('plan_id', $subscription->plan_id)
                ->join('modules', 'modules.id', '=', 'plan_modules.module_id')
                ->where('modules.is_active', true)
                ->pluck('modules.slug')
                ->toArray();

            return array_unique(array_merge($coreModules, $planModules));
        });
    }

    /**
     * Check if a specific module is allowed for a tenant.
     */
    public static function isModuleAllowed(?string $tenantId, string $moduleSlug): bool
    {
        $allowed = self::getAllowedModules($tenantId);
        return in_array($moduleSlug, $allowed);
    }

    /**
     * Flush cached modules for a tenant (call after plan change).
     */
    public static function flushCache(string $tenantId): void
    {
        Cache::forget("tenant_modules_{$tenantId}");
    }

    /**
     * Sync plan modules (used by super admin).
     */
    public static function syncPlanModules(string $planId, array $moduleSlugs): void
    {
        // Delete existing
        PlanModule::where('plan_id', $planId)->delete();

        // Insert new
        $moduleIds = Module::whereIn('slug', $moduleSlugs)->pluck('id');

        foreach ($moduleIds as $moduleId) {
            PlanModule::create([
                'plan_id'   => $planId,
                'module_id' => $moduleId,
            ]);
        }

        // Flush all tenant caches that use this plan
        $tenantIds = Subscription::where('plan_id', $planId)
            ->where('status', 'active')
            ->pluck('tenant_id');

        foreach ($tenantIds as $tid) {
            self::flushCache($tid);
        }
    }

    /**
     * Get module slugs for a plan.
     */
    public static function getPlanModuleSlugs(string $planId): array
    {
        return PlanModule::where('plan_id', $planId)
            ->join('modules', 'modules.id', '=', 'plan_modules.module_id')
            ->pluck('modules.slug')
            ->toArray();
    }
}
