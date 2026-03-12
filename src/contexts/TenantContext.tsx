import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Tenant {
  id: string;
  company_name: string;
  subdomain: string;
  contact_email: string | null;
  logo_url: string | null;
  status: string;
  max_customers: number;
}

interface TenantContextType {
  tenant: Tenant | null;
  tenantId: string | null;
  loading: boolean;
  error: string | null;
  isPlatformAdmin: boolean;
  setTenantId: (id: string | null) => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

/**
 * Extract subdomain from hostname.
 * e.g., "abc.system.com" → "abc"
 * Returns null for platform-level access (no subdomain or "www" or "admin")
 */
function extractSubdomain(): string | null {
  const hostname = window.location.hostname;

  // Local development: check for query param ?tenant=abc
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    const params = new URLSearchParams(window.location.search);
    return params.get("tenant");
  }

  // Skip for lovable preview domains
  if (hostname.includes("lovable.app") || hostname.includes("lovable.dev")) {
    const params = new URLSearchParams(window.location.search);
    return params.get("tenant");
  }

  const parts = hostname.split(".");
  // Need at least 3 parts: subdomain.domain.tld
  if (parts.length < 3) return null;

  const subdomain = parts[0];
  // Skip platform-level subdomains
  if (["www", "admin", "api", "app"].includes(subdomain)) return null;

  return subdomain;
}

/**
 * Check if the current route is a Super Admin route
 */
function isSuperAdminRoute(): boolean {
  return window.location.pathname.startsWith("/super-admin");
}

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [tenantId, setTenantIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);

  const setTenantId = (id: string | null) => {
    setTenantIdState(id);
    if (!id) {
      setTenant(null);
    }
  };

  useEffect(() => {
    const resolve = async () => {
      try {
        // Super Admin routes don't need tenant resolution
        if (isSuperAdminRoute()) {
          setIsPlatformAdmin(true);
          setLoading(false);
          return;
        }

        const subdomain = extractSubdomain();

        if (!subdomain) {
          // No subdomain — could be platform admin or direct access
          // Check if user is a platform admin
          setIsPlatformAdmin(true);
          setLoading(false);
          return;
        }

        // Resolve subdomain to tenant
        const { data, error: fetchError } = await supabase
          .from("tenants" as any)
          .select("*")
          .eq("subdomain", subdomain)
          .eq("status", "active")
          .single();

        if (fetchError || !data) {
          setError(`Tenant "${subdomain}" not found or inactive.`);
          setLoading(false);
          return;
        }

        const tenantData = data as any;
        setTenant({
          id: tenantData.id,
          company_name: tenantData.company_name,
          subdomain: tenantData.subdomain,
          contact_email: tenantData.contact_email,
          logo_url: tenantData.logo_url,
          status: tenantData.status,
          max_customers: tenantData.max_customers || 500,
        });
        setTenantIdState(tenantData.id);
        setLoading(false);
      } catch (err) {
        console.error("Tenant resolution failed:", err);
        setError("Failed to resolve tenant");
        setLoading(false);
      }
    };

    resolve();
  }, []);

  return (
    <TenantContext.Provider value={{ tenant, tenantId, loading, error, isPlatformAdmin, setTenantId }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) throw new Error("useTenant must be used within TenantProvider");
  return context;
}
