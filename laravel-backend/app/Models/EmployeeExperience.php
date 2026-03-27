<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;

class EmployeeExperience extends Model
{
    use HasUuid;

    public $timestamps = false;

    protected $table = 'employee_experience';

    protected $fillable = [
        'id', 'employee_id', 'company_name', 'designation',
        'from_date', 'to_date', 'responsibilities',
    ];

    protected $casts = [
        'from_date' => 'date',
        'to_date'   => 'date',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}
