<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;

class EmployeeSavingsFund extends Model
{
    use HasUuid;

    public $timestamps = false;

    protected $table = 'employee_savings_fund';

    protected $fillable = [
        'id', 'employee_id', 'type', 'amount',
        'date', 'description',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'date'   => 'date',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}
