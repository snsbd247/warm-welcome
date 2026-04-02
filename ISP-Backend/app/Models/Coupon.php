<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;

class Coupon extends Model
{
    use HasUuid;

    protected $fillable = [
        'id', 'code', 'description', 'discount_type', 'discount_value',
        'max_uses', 'used_count', 'valid_from', 'valid_until', 'is_active',
    ];

    protected $casts = [
        'discount_value' => 'decimal:2',
        'is_active' => 'boolean',
        'valid_from' => 'date',
        'valid_until' => 'date',
    ];
}
