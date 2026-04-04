import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { SubscriptionGuard } from "@/components/SubscriptionGuard";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/admin/login" replace />;

  // Force password change redirect
  const savedUser = localStorage.getItem("admin_user");
  if (savedUser) {
    try {
      const parsed = JSON.parse(savedUser);
      if (parsed.must_change_password) {
        return <Navigate to="/force-password-change" replace />;
      }
    } catch {}
  }

  return <SubscriptionGuard>{children}</SubscriptionGuard>;
}
