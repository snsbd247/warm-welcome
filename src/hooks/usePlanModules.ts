import { useQuery } from "@tanstack/react-query";
import { db } from "@/integrations/supabase/client";

export interface SystemModule {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  is_core: boolean;
  is_active: boolean;
  sort_order: number;
}

/**
 * Hook to fetch all system modules.
 * Used in plan creation and role management.
 */
export function useSystemModules() {
  const { data: modules = [], isLoading } = useQuery<SystemModule[]>({
    queryKey: ["system-modules"],
    queryFn: async () => {
      const { data, error } = await db
        .from("modules")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
  });

  return { modules, isLoading };
}

/**
 * Hook to get allowed module slugs for the current tenant's plan.
 * Core modules are always included.
 */
export function useAllowedModules(planId?: string) {
  const { data, isLoading } = useQuery({
    queryKey: ["plan-modules", planId],
    queryFn: async () => {
      if (!planId) {
        // No plan → return all modules (core only enforcement)
        const { data: allMods } = await db
          .from("modules")
          .select("slug")
          .eq("is_active", true);
        return (allMods || []).map((m: any) => m.slug);
      }

      // Get core modules
      const { data: coreMods } = await db
        .from("modules")
        .select("slug")
        .eq("is_core", true)
        .eq("is_active", true);

      const coreSlugs = (coreMods || []).map((m: any) => m.slug);

      // Get plan's modules
      const { data: planMods } = await db
        .from("plan_modules")
        .select("module_id, modules(slug)")
        .eq("plan_id", planId);

      const planSlugs = (planMods || [])
        .map((pm: any) => pm.modules?.slug)
        .filter(Boolean);

      return [...new Set([...coreSlugs, ...planSlugs])];
    },
    staleTime: 5 * 60 * 1000,
  });

  const isModuleAllowed = (slug: string): boolean => {
    if (!data) return true; // Loading state → allow
    return data.includes(slug);
  };

  return { allowedModules: data || [], isModuleAllowed, isLoading };
}
