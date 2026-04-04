import { useQuery } from "@tanstack/react-query";
import { db } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Returns tenant-scoped customer IDs for filtering bills, payments, etc.
 * In production, Laravel handles this via BelongsToTenant trait.
 * In preview (Supabase direct), we filter by tenant_id on customers table.
 */
export function useTenantCustomerIds() {
  const { user } = useAuth();
  const tenantId = user?.tenant_id;

  const { data: customerIds = [], isLoading } = useQuery({
    queryKey: ["tenant-customer-ids", tenantId],
    queryFn: async () => {
      let q = db.from("customers").select("id");
      if (tenantId) q = (q as any).eq("tenant_id", tenantId);
      const { data } = await q;
      return (data || []).map((c: any) => c.id) as string[];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 min
  });

  return { tenantId, customerIds, isLoading };
}
