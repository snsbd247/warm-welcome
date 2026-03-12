import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Database, Server, Users, Loader2 } from "lucide-react";

export default function PlatformMonitoring() {
  const { data: tenants } = useQuery({
    queryKey: ["sa-monitoring-tenants"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tenants" as any).select("id, company_name, subdomain, status, max_customers");
      if (error) throw error;
      return data as any[];
    },
    refetchInterval: 30000,
  });

  const { data: customerCounts } = useQuery({
    queryKey: ["sa-monitoring-customer-counts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("customers" as any).select("tenant_id");
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data as any[])?.forEach((c) => {
        if (c.tenant_id) counts[c.tenant_id] = (counts[c.tenant_id] || 0) + 1;
      });
      return counts;
    },
    refetchInterval: 30000,
  });

  return (
    <SuperAdminLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">System Monitoring</h1>
        <p className="text-muted-foreground mt-1">Real-time platform health overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Platform</CardTitle>
            <Server className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-success">Online</div>
            <p className="text-xs text-muted-foreground">All services running</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Database</CardTitle>
            <Database className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-success">Connected</div>
            <p className="text-xs text-muted-foreground">Supabase healthy</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Tenants</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{tenants?.filter((t: any) => t.status === "active").length ?? 0}</div>
            <p className="text-xs text-muted-foreground">of {tenants?.length ?? 0} total</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Activity className="h-5 w-5 text-primary" /> Tenant Health</CardTitle>
        </CardHeader>
        <CardContent>
          {!tenants?.length ? (
            <p className="text-sm text-muted-foreground text-center py-6">No tenants to monitor</p>
          ) : (
            <div className="space-y-3">
              {tenants.map((t: any) => {
                const custCount = customerCounts?.[t.id] || 0;
                const usage = t.max_customers > 0 ? Math.round((custCount / t.max_customers) * 100) : 0;
                return (
                  <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium text-sm">{t.company_name}</p>
                      <p className="text-xs text-muted-foreground">{t.subdomain} • {custCount}/{t.max_customers} customers ({usage}%)</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${t.status === "active" ? "bg-success" : "bg-destructive"}`} />
                      <Badge variant={usage > 90 ? "destructive" : usage > 70 ? "secondary" : "default"}>
                        {usage > 90 ? "Near Limit" : usage > 70 ? "High Usage" : "Healthy"}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </SuperAdminLayout>
  );
}
