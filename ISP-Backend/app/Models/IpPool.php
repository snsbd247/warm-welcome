<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;

class IpPool extends Model
{
    use HasUuid;

    protected $fillable = [
        'id', 'name', 'subnet', 'gateway', 'start_ip', 'end_ip',
        'total_ips', 'used_ips', 'status', 'router_id',
    ];

    protected $casts = [
        'total_ips' => 'integer',
        'used_ips' => 'integer',
    ];

    public function router()
    {
        return $this->belongsTo(MikrotikRouter::class, 'router_id');
    }
}
