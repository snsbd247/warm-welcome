<?php

if (!function_exists('tenant')) {
    /**
     * Get the current tenant instance.
     *
     * @return \App\Models\Tenant|null
     */
    function tenant(): ?\App\Models\Tenant
    {
        if (app()->bound('tenant')) {
            return app('tenant');
        }
        return null;
    }
}

if (!function_exists('tenant_id')) {
    /**
     * Get the current tenant ID.
     *
     * @return string|null
     */
    function tenant_id(): ?string
    {
        $t = tenant();
        return $t ? $t->id : null;
    }
}

if (!function_exists('is_tenant_context')) {
    /**
     * Check if we're currently in a tenant context.
     */
    function is_tenant_context(): bool
    {
        return tenant() !== null;
    }
}
