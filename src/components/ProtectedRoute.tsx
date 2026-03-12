import { ReactNode, useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const { tenantId } = useTenant();
  const [subscriptionValid, setSubscriptionValid] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user || !tenantId) {
      setSubscriptionValid(true); // Skip check for platform-level access
      return;
    }

    const checkSubscription = async () => {
      const { data } = await supabase
        .from("tenant_subscriptions" as any)
        .select("id, status, end_date")
        .eq("tenant_id", tenantId)
        .eq("status", "active")
        .limit(1);

      if (!data || data.length === 0) {
        // No active subscription — check if any subscription exists at all
        const { data: anySub } = await supabase
          .from("tenant_subscriptions" as any)
          .select("id")
          .eq("tenant_id", tenantId)
          .limit(1);
        // If no subscriptions at all, allow access (new tenant without plan yet)
        setSubscriptionValid(!anySub?.length ? true : false);
        return;
      }

      const sub = (data as any[])[0];
      if (sub.end_date && new Date(sub.end_date) < new Date()) {
        setSubscriptionValid(false);
        return;
      }

      setSubscriptionValid(true);
    };

    checkSubscription();
  }, [user, tenantId]);

  if (loading || subscriptionValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/admin/login" replace />;

  if (!subscriptionValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full shadow-lg">
          <CardHeader className="text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-2" />
            <CardTitle className="text-xl text-destructive">Subscription Expired</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Your subscription has expired. Please renew your plan to continue using the platform.
            </p>
            <p className="text-sm text-muted-foreground">
              Contact your platform administrator or visit the billing portal to renew.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
