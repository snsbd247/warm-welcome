<?php

namespace App\Models;

use App\Traits\HasUuid;
use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

class LoginHistory extends Model
{
    use HasUuid, BelongsToTenant;

    protected $table = 'login_histories';
    public $timestamps = false;

    protected $fillable = [
        'id', 'tenant_id', 'user_id', 'ip_address', 'device',
        'browser', 'status', 'failure_reason', 'created_at',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
