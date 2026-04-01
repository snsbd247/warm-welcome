<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Domain;
use App\Services\TenantResolver;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class DomainController extends Controller
{
    /**
     * List domains for the current tenant.
     */
    public function index()
    {
        $tenant = tenant();
        if (!$tenant) {
            return response()->json(['error' => 'No tenant context'], 400);
        }

        return response()->json([
            'data' => $tenant->domains()->orderBy('is_primary', 'desc')->get(),
            'subdomain' => $tenant->subdomain,
        ]);
    }

    /**
     * Add a custom domain.
     */
    public function store(Request $request)
    {
        $tenant = tenant();
        if (!$tenant) {
            return response()->json(['error' => 'No tenant context'], 400);
        }

        $request->validate([
            'domain' => [
                'required',
                'string',
                'max:255',
                'unique:domains,domain',
                function ($attribute, $value, $fail) {
                    // Basic domain format validation
                    if (!preg_match('/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/i', $value)) {
                        $fail('Invalid domain format.');
                    }
                },
            ],
        ]);

        $domain = $tenant->domains()->create([
            'id' => Str::uuid(),
            'domain' => strtolower($request->domain),
            'is_primary' => $tenant->domains()->count() === 0,
            'is_verified' => false,
        ]);

        // Flush cache
        TenantResolver::flushCache($domain->domain);

        return response()->json([
            'message' => 'Domain added successfully',
            'data' => $domain,
        ], 201);
    }

    /**
     * Set a domain as primary.
     */
    public function setPrimary(string $id)
    {
        $tenant = tenant();
        if (!$tenant) {
            return response()->json(['error' => 'No tenant context'], 400);
        }

        $domain = $tenant->domains()->findOrFail($id);

        // Unset all others
        $tenant->domains()->update(['is_primary' => false]);
        $domain->update(['is_primary' => true]);

        return response()->json(['message' => 'Primary domain updated']);
    }

    /**
     * Remove a custom domain.
     */
    public function destroy(string $id)
    {
        $tenant = tenant();
        if (!$tenant) {
            return response()->json(['error' => 'No tenant context'], 400);
        }

        $domain = $tenant->domains()->findOrFail($id);
        $domainName = $domain->domain;
        $domain->delete();

        TenantResolver::flushCache($domainName);

        return response()->json(['message' => 'Domain removed']);
    }

    /**
     * Verify domain DNS (basic check).
     */
    public function verify(string $id)
    {
        $tenant = tenant();
        if (!$tenant) {
            return response()->json(['error' => 'No tenant context'], 400);
        }

        $domain = $tenant->domains()->findOrFail($id);

        // Simple DNS check — see if domain resolves to our server
        $serverIp = env('SERVER_IP', '');
        $resolved = gethostbyname($domain->domain);

        if ($serverIp && $resolved === $serverIp) {
            $domain->update(['is_verified' => true]);
            TenantResolver::flushCache($domain->domain);

            return response()->json([
                'verified' => true,
                'message' => 'Domain verified successfully',
            ]);
        }

        return response()->json([
            'verified' => false,
            'message' => "DNS not yet pointing to server. Expected A record: {$serverIp}, Got: {$resolved}",
            'expected_ip' => $serverIp,
            'resolved_ip' => $resolved,
        ]);
    }
}
