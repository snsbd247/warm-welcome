<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;

class Tenant extends Model
{
    use HasUuid;

    protected $fillable = [
        'name', 'subdomain', 'email', 'phone',
        'logo_url', 'status', 'plan',
        'trial_ends_at', 'settings',
    ];

    protected $casts = [
        'settings' => 'array',
        'trial_ends_at' => 'datetime',
    ];

    public function domains()
    {
        return $this->hasMany(Domain::class);
    }

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function customers()
    {
        return $this->hasMany(Customer::class);
    }

    public function isActive(): bool
    {
        return $this->status === 'active' || $this->isOnTrial();
    }

    public function isOnTrial(): bool
    {
        return $this->status === 'trial' && $this->trial_ends_at && $this->trial_ends_at->isFuture();
    }
}
