<?php

namespace App\Models;

use App\Traits\HasUuid;
use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    use HasUuid, BelongsToTenant;

    public $timestamps = false;

    protected $fillable = [
        'id', 'tenant_id', 'user_id', 'title', 'message',
        'type', 'link', 'is_read', 'metadata',
    ];

    protected $casts = [
        'is_read' => 'boolean',
        'metadata' => 'array',
    ];
}
