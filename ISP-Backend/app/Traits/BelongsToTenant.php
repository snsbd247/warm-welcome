<?php

namespace App\Traits;

use App\Models\Tenant;
use App\Scopes\TenantScope;

/**
 * Add this trait to any model that should be tenant-scoped.
 * The model's table MUST have a `tenant_id` column.
 */
trait BelongsToTenant
{
    public static function bootBelongsToTenant(): void
    {
        // Auto-apply tenant scope on queries
        static::addGlobalScope(new TenantScope());

        // Auto-set tenant_id on creating
        static::creating(function ($model) {
            if (is_tenant_context() && empty($model->tenant_id)) {
                $model->tenant_id = tenant_id();
            }
        });
    }

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }
}
