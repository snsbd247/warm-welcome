<?php

namespace App\Models;

use App\Traits\HasUuid;
use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

class ActivityLog extends Model
{
    use HasUuid, BelongsToTenant;

    protected $table = 'activity_logs';
    public $timestamps = false;

    protected $fillable = [
        'id', 'tenant_id', 'user_id', 'action', 'module',
        'description', 'ip_address', 'metadata', 'created_at',
    ];

    protected $casts = [
        'metadata' => 'array',
        'created_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
