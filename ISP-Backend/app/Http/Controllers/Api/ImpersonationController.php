<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdminSession;
use App\Models\Impersonation;
use App\Models\Tenant;
use App\Models\User;
use App\Models\UserRole;
use App\Services\ActivityLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ImpersonationController extends Controller
{
    /**
     * Super Admin generates an impersonation token for a tenant.
     */
    public function generate(Request $request, string $tenantId)
    {
        $admin = $request->get('super_admin');

        $tenant = Tenant::findOrFail($tenantId);
        if (!$tenant->isActive()) {
            return response()->json(['error' => 'Tenant is not active'], 422);
        }

        // Find tenant owner (first super_admin or admin role user)
        $targetUser = User::withoutGlobalScopes()
            ->where('tenant_id', $tenantId)
            ->where('status', 'active')
            ->first();

        if (!$targetUser) {
            return response()->json(['error' => 'No active user found for this tenant'], 404);
        }

        // Create impersonation token (valid 10 minutes)
        $token = Str::random(64);
        $impersonation = Impersonation::create([
            'admin_id'       => $admin->id,
            'tenant_id'      => $tenantId,
            'target_user_id' => $targetUser->id,
            'token'          => hash('sha256', $token),
            'expires_at'     => now()->addMinutes(10),
            'ip_address'     => $request->ip(),
            'status'         => 'pending',
        ]);

        // Log activity
        ActivityLogger::log(
            'impersonate',
            'system',
            "Super Admin impersonated tenant: {$tenant->name}",
            $admin->id,
            $tenantId,
            ['target_user_id' => $targetUser->id, 'impersonation_id' => $impersonation->id]
        );

        return response()->json([
            'token'      => $token,
            'expires_at' => $impersonation->expires_at->toIso8601String(),
            'tenant'     => [
                'id'        => $tenant->id,
                'name'      => $tenant->name,
                'subdomain' => $tenant->subdomain,
            ],
            'user' => [
                'id'   => $targetUser->id,
                'name' => $targetUser->full_name,
            ],
        ]);
    }

    /**
     * Consume impersonation token and create a real admin session.
     */
    public function consume(Request $request)
    {
        $request->validate(['token' => 'required|string']);

        $hashedToken = hash('sha256', $request->token);
        $impersonation = Impersonation::where('token', $hashedToken)->first();

        if (!$impersonation || !$impersonation->isValid()) {
            return response()->json(['error' => 'Invalid or expired impersonation token'], 401);
        }

        // Mark as used
        $impersonation->update([
            'status'  => 'used',
            'used_at' => now(),
        ]);

        $user = User::withoutGlobalScopes()->find($impersonation->target_user_id);
        if (!$user) {
            return response()->json(['error' => 'Target user not found'], 404);
        }

        $role = UserRole::where('user_id', $user->id)->first();

        // Create admin session
        $sessionToken = Str::uuid()->toString();
        AdminSession::create([
            'admin_id'      => $user->id,
            'session_token' => $sessionToken,
            'ip_address'    => $request->ip(),
            'browser'       => 'Impersonation',
            'device_name'   => 'Super Admin',
            'status'        => 'active',
        ]);

        return response()->json([
            'token' => $sessionToken,
            'user'  => [
                'id'         => $user->id,
                'email'      => $user->email,
                'name'       => $user->full_name,
                'role'       => $role->role ?? 'admin',
                'avatar_url' => $user->avatar_url,
            ],
            'impersonated' => true,
            'impersonated_by' => $impersonation->admin_id,
        ]);
    }
}
