<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;

class EmployeeEmergencyContact extends Model
{
    use HasUuid;

    public $timestamps = false;

    protected $table = 'employee_emergency_contacts';

    protected $fillable = [
        'id', 'employee_id', 'contact_name', 'relation',
        'phone', 'address',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}
