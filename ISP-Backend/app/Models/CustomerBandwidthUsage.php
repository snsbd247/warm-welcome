<?php

namespace App\Models;

use App\Traits\HasUuid;
use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

class CustomerBandwidthUsage extends Model
{
    use HasUuid, BelongsToTenant;

    protected $table = 'customer_bandwidth_usages';

    protected $fillable = [
        'id', 'tenant_id', 'reseller_id', 'customer_id', 'zone_id',
        'upload_mb', 'download_mb', 'total_mb', 'date',
    ];

    protected $casts = [
        'upload_mb' => 'decimal:2',
        'download_mb' => 'decimal:2',
        'total_mb' => 'decimal:2',
        'date' => 'date',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function zone()
    {
        return $this->belongsTo(ResellerZone::class, 'zone_id');
    }

    public function reseller()
    {
        return $this->belongsTo(Reseller::class);
    }
}
