<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;

class ResellerPackageCommission extends Model
{
    use HasUuid;

    protected $table = 'reseller_package_commissions';

    protected $fillable = [
        'id', 'reseller_id', 'package_id', 'tenant_id', 'commission_amount',
    ];

    protected $casts = [
        'commission_amount' => 'decimal:2',
    ];

    public function reseller()
    {
        return $this->belongsTo(Reseller::class, 'reseller_id');
    }

    public function package()
    {
        return $this->belongsTo(Package::class, 'package_id');
    }
}
