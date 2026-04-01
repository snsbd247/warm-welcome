<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;

class SaasPlan extends Model
{
    use HasUuid;

    protected $table = 'saas_plans';

    protected $fillable = [
        'id', 'name', 'slug', 'description',
        'price_monthly', 'price_yearly',
        'max_customers', 'max_users', 'max_routers',
        'has_accounting', 'has_hr', 'has_inventory', 'has_sms', 'has_custom_domain',
        'features', 'is_active', 'sort_order',
    ];

    protected $casts = [
        'price_monthly' => 'decimal:2',
        'price_yearly' => 'decimal:2',
        'is_active' => 'boolean',
        'has_accounting' => 'boolean',
        'has_hr' => 'boolean',
        'has_inventory' => 'boolean',
        'has_sms' => 'boolean',
        'has_custom_domain' => 'boolean',
        'features' => 'array',
    ];

    public function subscriptions()
    {
        return $this->hasMany(Subscription::class, 'plan_id');
    }

    public function modules()
    {
        return $this->belongsToMany(Module::class, 'plan_modules', 'plan_id', 'module_id');
    }

    public function planModules()
    {
        return $this->hasMany(PlanModule::class, 'plan_id');
    }
}
