<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;

class Impersonation extends Model
{
    use HasUuid;

    protected $fillable = [
        'id', 'admin_id', 'tenant_id', 'target_user_id',
        'token', 'expires_at', 'used_at', 'ip_address', 'status',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'used_at' => 'datetime',
    ];

    public function admin()
    {
        return $this->belongsTo(SuperAdmin::class, 'admin_id');
    }

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function targetUser()
    {
        return $this->belongsTo(User::class, 'target_user_id');
    }

    public function isValid(): bool
    {
        return $this->status === 'pending'
            && $this->expires_at->isFuture()
            && $this->used_at === null;
    }
}
