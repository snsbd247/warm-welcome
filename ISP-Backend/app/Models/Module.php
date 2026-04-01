<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;

class Module extends Model
{
    use HasUuid;

    protected $fillable = [
        'id', 'name', 'slug', 'description', 'icon',
        'is_core', 'is_active', 'sort_order',
    ];

    protected $casts = [
        'is_core' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function plans()
    {
        return $this->belongsToMany(SaasPlan::class, 'plan_modules', 'module_id', 'plan_id');
    }
}
