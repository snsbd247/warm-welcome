<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class MikrotikTestRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'router_id' => 'required_without_all:host,ip_address|uuid',
            'host' => 'required_without:router_id|string',
            'ip_address' => 'sometimes|string',
            'username' => 'required_without:router_id|string|max:100',
            'password' => 'required_without:router_id|string|max:100',
            'port' => 'nullable|integer|min:1|max:65535',
            'api_port' => 'nullable|integer|min:1|max:65535',
        ];
    }
}
