<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;

class Vendor extends Model
{
    use HasUuid;

    protected $fillable = [
        'id', 'name', 'phone', 'email', 'company', 'address',
        'total_due', 'balance', 'status', 'notes',
    ];

    protected $casts = [
        'total_due' => 'decimal:2',
        'balance'   => 'decimal:2',
    ];

    public function purchases()
    {
        return $this->hasMany(Purchase::class, 'supplier_id');
    }
}
