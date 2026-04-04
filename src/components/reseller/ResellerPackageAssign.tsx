import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Package } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";

interface Props {
  resellerId: string;
  tenantId: string;
  allowAllPackages: boolean;
  onAllowAllChange: (v: boolean) => void;
}

export default function ResellerPackageAssign({ resellerId, tenantId, allowAllPackages, onAllowAllChange }: Props) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data: packages = [], isLoading: loadingPkgs } = useQuery({
    queryKey: ["tenant-packages-all", tenantId],
    queryFn: async () => {
      const { data } = await (db as any).from("packages").select("id, name, monthly_price, speed, is_active").eq("tenant_id", tenantId).order("name");
      return data || [];
    },
    enabled: !!tenantId,
  });

  const { data: assigned = [], isLoading: loadingAssigned } = useQuery({
    queryKey: ["reseller-packages-assigned", resellerId],
    queryFn: async () => {
      const { data } = await (db as any).from("reseller_packages").select("package_id").eq("reseller_id", resellerId).eq("status", "active");
      return data || [];
    },
    enabled: !!resellerId,
  });

  useEffect(() => {
    if (assigned.length > 0) {
      setSelected(new Set(assigned.map((a: any) => a.package_id)));
    }
  }, [assigned]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Delete all existing assignments
      await (db as any).from("reseller_packages").delete().eq("reseller_id", resellerId);

      // Insert new ones
      if (selected.size > 0 && !allowAllPackages) {
        const rows = Array.from(selected).map(pkg_id => ({
          tenant_id: tenantId,
          reseller_id: resellerId,
          package_id: pkg_id,
          status: "active",
        }));
        const { error } = await (db as any).from("reseller_packages").insert(rows);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Package assignments saved");
      queryClient.invalidateQueries({ queryKey: ["reseller-packages-assigned"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const toggle = (pkgId: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(pkgId)) next.delete(pkgId);
      else next.add(pkgId);
      return next;
    });
  };

  const isLoading = loadingPkgs || loadingAssigned;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold flex items-center gap-2">
          <Package className="h-4 w-4" /> Assign Packages
        </Label>
        <div className="flex items-center gap-2">
          <Label htmlFor="allow-all" className="text-xs text-muted-foreground">Allow All Packages</Label>
          <Switch id="allow-all" checked={allowAllPackages} onCheckedChange={onAllowAllChange} />
        </div>
      </div>

      {allowAllPackages ? (
        <p className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
          This reseller can access all tenant packages. No restriction applied.
        </p>
      ) : isLoading ? (
        <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : packages.length === 0 ? (
        <p className="text-xs text-muted-foreground">No packages found for this tenant.</p>
      ) : (
        <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto border rounded-md p-3">
          {packages.map((pkg: any) => (
            <label key={pkg.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer">
              <Checkbox checked={selected.has(pkg.id)} onCheckedChange={() => toggle(pkg.id)} />
              <span className="text-sm flex-1">{pkg.name}</span>
              <span className="text-xs text-muted-foreground">{pkg.speed || ""}</span>
              <span className="text-xs font-medium">৳{pkg.monthly_price}</span>
              {!pkg.is_active && <span className="text-xs text-destructive">(Inactive)</span>}
            </label>
          ))}
        </div>
      )}

      {resellerId && !allowAllPackages && (
        <Button size="sm" variant="outline" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          {saveMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
          Save Package Assignments ({selected.size})
        </Button>
      )}
    </div>
  );
}
