<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class MikrotikSyncRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'customer_id' => 'required|uuid',
        ];
    }
}
