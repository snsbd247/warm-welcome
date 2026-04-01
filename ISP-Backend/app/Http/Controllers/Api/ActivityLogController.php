<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\LoginHistory;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    /**
     * Get activity logs for current tenant.
     */
    public function activityLogs(Request $request)
    {
        $query = ActivityLog::with('user:id,full_name,email')
            ->orderBy('created_at', 'desc');

        if ($request->user_id) {
            $query->where('user_id', $request->user_id);
        }
        if ($request->module) {
            $query->where('module', $request->module);
        }
        if ($request->action) {
            $query->where('action', $request->action);
        }
        if ($request->from) {
            $query->where('created_at', '>=', $request->from);
        }
        if ($request->to) {
            $query->where('created_at', '<=', $request->to);
        }

        return response()->json(
            $query->limit($request->limit ?? 500)->get()
        );
    }

    /**
     * Get login history for current tenant.
     */
    public function loginHistory(Request $request)
    {
        $query = LoginHistory::with('user:id,full_name,email')
            ->orderBy('created_at', 'desc');

        if ($request->user_id) {
            $query->where('user_id', $request->user_id);
        }
        if ($request->status) {
            $query->where('status', $request->status);
        }

        return response()->json(
            $query->limit($request->limit ?? 500)->get()
        );
    }

    /**
     * Super Admin: Get activity logs for any tenant.
     */
    public function tenantActivityLogs(Request $request, string $tenantId)
    {
        $logs = ActivityLog::withoutGlobalScopes()
            ->where('tenant_id', $tenantId)
            ->with('user:id,full_name,email')
            ->orderBy('created_at', 'desc')
            ->limit($request->limit ?? 200)
            ->get();

        return response()->json($logs);
    }

    /**
     * Super Admin: Get login history for any tenant.
     */
    public function tenantLoginHistory(Request $request, string $tenantId)
    {
        $logs = LoginHistory::withoutGlobalScopes()
            ->where('tenant_id', $tenantId)
            ->with('user:id,full_name,email')
            ->orderBy('created_at', 'desc')
            ->limit($request->limit ?? 200)
            ->get();

        return response()->json($logs);
    }

    /**
     * Super Admin: Get tenant users list.
     */
    public function tenantUsers(Request $request, string $tenantId)
    {
        $users = \App\Models\User::withoutGlobalScopes()
            ->where('tenant_id', $tenantId)
            ->with('roles')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($u) {
                $role = $u->roles->first();
                return [
                    'id'             => $u->id,
                    'full_name'      => $u->full_name,
                    'email'          => $u->email,
                    'username'       => $u->username,
                    'mobile'         => $u->mobile,
                    'status'         => $u->status,
                    'avatar_url'     => $u->avatar_url,
                    'role'           => $role->role ?? 'staff',
                    'custom_role_id' => $role->custom_role_id ?? null,
                    'created_at'     => $u->created_at,
                ];
            });

        return response()->json($users);
    }

    /**
     * Super Admin: Update tenant user.
     */
    public function updateTenantUser(Request $request, string $tenantId, string $userId)
    {
        $user = \App\Models\User::withoutGlobalScopes()
            ->where('tenant_id', $tenantId)
            ->findOrFail($userId);

        $data = $request->only(['full_name', 'email', 'username', 'mobile', 'status', 'avatar_url']);

        if ($request->has('password') && $request->password) {
            $data['password_hash'] = \Illuminate\Support\Facades\Hash::make($request->password);
        }

        $user->update($data);

        if ($request->has('role')) {
            \App\Models\UserRole::updateOrCreate(
                ['user_id' => $user->id],
                ['role' => $request->role, 'custom_role_id' => $request->custom_role_id]
            );
        }

        return response()->json(['success' => true, 'user' => $user->fresh()]);
    }
}
