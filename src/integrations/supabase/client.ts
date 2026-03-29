/**
 * Smart Supabase client — automatically switches between:
 * - Real Supabase client (Lovable preview / development)
 * - Laravel API wrapper (cPanel production when VITE_API_URL is set)
 *
 * All components should import from this file:
 *   import { supabase } from "@/integrations/supabase/client";
 */

const envApiBaseUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim().replace(/\/+$/, "") || "";
const isEnvLocalhost = /^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(envApiBaseUrl);
const hasExplicitApiUrl = !!envApiBaseUrl && !isEnvLocalhost;

// Use a lazy proxy so we avoid top-level await and circular import issues.
// On first property access, it loads the correct backend module.

let _resolved: any = null;

function getClient(): any {
  if (_resolved) return _resolved;

  if (hasExplicitApiUrl) {
    // cPanel production — use Laravel API wrapper (apiDb), no Supabase
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    _resolved = require('@/lib/apiDb').apiDb;
  } else {
    // Lovable preview / local dev — use real Supabase client
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    _resolved = require('./rawClient').supabaseRaw;
  }
  return _resolved;
}

// Proxy that forwards all property access to the resolved client
export const supabase: any = new Proxy({} as any, {
  get(_target, prop) {
    return getClient()[prop];
  },
  set(_target, prop, value) {
    getClient()[prop] = value;
    return true;
  },
});
