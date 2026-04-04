<?php

namespace App\Models;

use App\Traits\HasUuid;
use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

class ResellerPackage extends Model
{
    use HasUuid, BelongsToTenant;

    protected $table = 'reseller_packages';

    public $timestamps = false;

    protected $fillable = [
        'id', 'tenant_id', 'reseller_id', 'package_id', 'status', 'created_at',
    ];

    public function reseller()
    {
        return $this->belongsTo(Reseller::class);
    }

    public function package()
    {
        return $this->belongsTo(Package::class);
    }
}
