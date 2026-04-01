<?php

namespace App\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

class TenantScope implements Scope
{
    /**
     * Apply the tenant scope to a given Eloquent query builder.
     * Only filters when a tenant is resolved AND the table has tenant_id.
     */
    public function apply(Builder $builder, Model $model): void
    {
        if (is_tenant_context() && in_array('tenant_id', $model->getFillable())) {
            $builder->where($model->getTable() . '.tenant_id', tenant_id());
        }
    }
}
