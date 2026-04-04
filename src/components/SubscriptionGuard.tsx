import { ReactNode, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/integrations/supabase/client";
import { IS_LOVABLE } from "@/lib/environment";
import api from "@/lib/api";
import { ShieldAlert, Phone } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface SubscriptionStatus {
  hasSubscription: boolean;
  isExpired: boolean;
  loading: boolean;
}

function useSubscriptionStatus(): SubscriptionStatus {
  const { user } = useAuth();
  const [status, setStatus] = useState<SubscriptionStatus>({ hasSubscription: true, isExpired: false, loading: true });

  useEffect(() => {
    if (!user?.tenant_id) {
      setStatus({ hasSubscription: true, isExpired: false, loading: false });
      return;
    }

    const check = async () => {
      try {
        if (IS_LOVABLE) {
          const now = new Date().toISOString().slice(0, 10);
          // Check for any active subscription
          const { data: activeSub } = await db
            .from("subscriptions")
            .select("id,end_date,status")
            .eq("tenant_id", user.tenant_id)
            .eq("status", "active")
            .gte("end_date", now)
            .maybeSingle();

          if (activeSub) {
            setStatus({ hasSubscription: true, isExpired: false, loading: false });
            return;
          }

          // Check for expired subscription
          const { data: expiredSub } = await db
            .from("subscriptions")
            .select("id,end_date,status")
            .eq("tenant_id", user.tenant_id)
            .order("end_date", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (expiredSub) {
            setStatus({ hasSubscription: true, isExpired: true, loading: false });
          } else {
            setStatus({ hasSubscription: false, isExpired: false, loading: false });
          }
        } else {
          try {
            const { data } = await api.get("/admin/subscription-status");
            setStatus({
              hasSubscription: data?.has_subscription ?? true,
              isExpired: data?.is_expired ?? false,
              loading: false,
            });
          } catch {
            setStatus({ hasSubscription: true, isExpired: false, loading: false });
          }
        }
      } catch {
        setStatus({ hasSubscription: true, isExpired: false, loading: false });
      }
    };

    check();
  }, [user?.tenant_id]);

  return status;
}

export function SubscriptionGuard({ children }: { children: ReactNode }) {
  const { hasSubscription, isExpired, loading } = useSubscriptionStatus();
  const { user } = useAuth();

  // Don't block if no tenant context (super admin routes, etc.)
  if (!user?.tenant_id || loading) return <>{children}</>;

  // Check user role - owner can still see a message but we block everyone
  const isBlocked = !hasSubscription || isExpired;

  if (!isBlocked) return <>{children}</>;

  const message = isExpired
    ? "আপনার প্যাকেজ Subscription এর মেয়াদ শেষ, দয়া করে এডমিন এর সাথে যোগাযোগ করুন।"
    : "আপনার কোন প্যাকেজ Subscription করা নাই, দয়া করে এডমিন এর সাথে যোগাযোগ করুন।";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
          <ShieldAlert className="h-10 w-10 text-destructive" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            {isExpired ? "Subscription Expired" : "No Active Subscription"}
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            {message}
          </p>
        </div>
        <div className="bg-muted/50 rounded-lg p-4 flex items-center justify-center gap-2">
          <Phone className="h-5 w-5 text-primary" />
          <span className="text-lg font-semibold text-foreground">মোবাইলঃ ০১৩১৫৫৫৬৬৩৩</span>
        </div>
      </div>
    </div>
  );
}
