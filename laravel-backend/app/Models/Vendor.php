<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;

class Vendor extends Model
{
    use HasUuid;

    // NOTE: The 'vendors' table does not exist in the Supabase DB schema.
    // This model maps conceptually; the frontend uses the 'suppliers' table for vendor-like operations.
    // If using MySQL backend, create a vendors table or alias suppliers.

    protected $fillable = [
        'id', 'name', 'phone', 'email', 'company', 'address',
        'total_due', 'status',
    ];

    protected $casts = [
        'total_due' => 'decimal:2',
    ];
}
