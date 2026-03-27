<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;

class EmployeeProvidentFund extends Model
{
    use HasUuid;

    public $timestamps = false;

    protected $table = 'employee_provident_fund';

    protected $fillable = [
        'id', 'employee_id', 'type', 'amount',
        'employee_share', 'employer_share', 'date', 'description',
    ];

    protected $casts = [
        'amount'         => 'decimal:2',
        'employee_share' => 'decimal:2',
        'employer_share' => 'decimal:2',
        'date'           => 'date',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}
