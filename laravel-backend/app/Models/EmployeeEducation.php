<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;

class EmployeeEducation extends Model
{
    use HasUuid;

    public $timestamps = false;

    protected $table = 'employee_education';

    protected $fillable = [
        'id', 'employee_id', 'degree', 'institution',
        'board_university', 'passing_year', 'result',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}
