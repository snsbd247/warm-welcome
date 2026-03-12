import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, CreditCard, Package, Users, Loader2, Activity, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function SuperAdminDashboard() {
  const { data: tenants, isLoading: loadingTenants } = useQuery({
    queryKey: ["sa-tenants-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tenants" as any).select("id, company_name, subdomain, status, created_at");
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: plans } = useQuery({
    queryKey: ["sa-plans"],
    queryFn: async () => {
      const { data, error } = await supabase.from("subscription_plans" as any).select("*");
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: subscriptions } = useQuery({
    queryKey: ["sa-subscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tenant_subscriptions" as any).select("*, tenants(company_name), subscription_plans(name)");
      if (error) throw error;
      return data as any[];
    },
  });

  const activeTenants = tenants?.filter((t: any) => t.status === "active").length ?? 0;
  const suspendedTenants = tenants?.filter((t: any) => t.status === "suspended").length ?? 0;
  const totalTenants = tenants?.length ?? 0;
  const totalPlans = plans?.filter((p: any) => p.is_active).length ?? 0;
  const activeSubscriptions = subscriptions?.filter((s: any) => s.status === "active").length ?? 0;

  if (loadingTenants) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Platform Dashboard</h1>
        <p className="text-muted-foreground mt-1">Multi-tenant ISP platform overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Tenants</CardTitle>
            <Building2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTenants}</div>
            <p className="text-xs text-muted-foreground">{activeTenants} active, {suspendedTenants} suspended</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Plans</CardTitle>
            <Package className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPlans}</div>
            <p className="text-xs text-muted-foreground">{plans?.length ?? 0} total plans</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Subscriptions</CardTitle>
            <CreditCard className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground">{subscriptions?.length ?? 0} total</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Platform Status</CardTitle>
            <Activity className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">Healthy</div>
            <p className="text-xs text-muted-foreground">All systems operational</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Tenants */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Recent Tenants</CardTitle>
        </CardHeader>
        <CardContent>
          {!tenants?.length ? (
            <p className="text-sm text-muted-foreground text-center py-6">No tenants yet. Create your first ISP tenant.</p>
          ) : (
            <div className="space-y-3">
              {tenants.slice(0, 10).map((t: any) => (
                <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{t.company_name}</p>
                      <p className="text-xs text-muted-foreground">{t.subdomain}.yourdomain.com</p>
                    </div>
                  </div>
                  <Badge variant={t.status === "active" ? "default" : "destructive"}>
                    {t.status === "active" ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <AlertTriangle className="h-3 w-3 mr-1" />}
                    {t.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </SuperAdminLayout>
  );
}
