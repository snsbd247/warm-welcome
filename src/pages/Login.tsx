import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Wifi, Loader2 } from "lucide-react";
import { checkExistingSession, createPendingSession, createActiveSession } from "@/hooks/useAdminSession";
import PendingLoginWaiting from "@/components/PendingLoginWaiting";
import { supabase } from "@/integrations/supabase/client";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingSessionId, setPendingSessionId] = useState<string | null>(null);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { user, session } = await signIn(email, password);

      // Check for existing active session
      const existingSession = await checkExistingSession(user.id);

      if (existingSession) {
        // Another device is active — create pending request
        const pending = await createPendingSession(user.id, session.access_token);
        setPendingSessionId(pending.id);
        setPendingUserId(user.id);
        toast.info("Waiting for approval from active device...");
      } else {
        // No active session — login directly
        await createActiveSession(user.id, session.access_token);
        navigate("/");
        toast.success("Welcome back!");
      }
    } catch (error: any) {
      toast.error(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleApproved = useCallback(async () => {
    toast.success("Login approved!");
    // Activate the session
    if (pendingUserId) {
      try {
        // The session was already set to active by the approver via realtime
        // Just log it
        await supabase.from("admin_login_logs").insert({
          admin_id: pendingUserId,
          action: "login_approved_completed",
          session_id: pendingSessionId,
        });
      } catch (e) {
        // non-critical
      }
    }
    setTimeout(() => navigate("/"), 1000);
  }, [navigate, pendingUserId, pendingSessionId]);

  const handleRejected = useCallback(async () => {
    toast.error("Login request was rejected");
    // Sign out since the login was rejected
    await supabase.auth.signOut();
    setPendingSessionId(null);
    setPendingUserId(null);
  }, []);

  const handleCancel = useCallback(async () => {
    // Clean up the pending session
    if (pendingSessionId) {
      await supabase
        .from("admin_sessions")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("id", pendingSessionId);
    }
    await supabase.auth.signOut();
    setPendingSessionId(null);
    setPendingUserId(null);
  }, [pendingSessionId]);

  // Show waiting screen if pending
  if (pendingSessionId) {
    return (
      <PendingLoginWaiting
        sessionId={pendingSessionId}
        onApproved={handleApproved}
        onRejected={handleRejected}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
            <Wifi className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Smart ISP</h1>
            <p className="text-sm text-muted-foreground">Admin Panel</p>
          </div>
        </div>

        <Card className="glass-card">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Admin Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access the admin panel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@smartisp.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Sign In
              </Button>
            </form>
            <div className="mt-4 text-center space-y-2">
              <a href="/admin/forgot-password" className="text-sm text-muted-foreground hover:text-primary transition-colors block">
                Forgot password?
              </a>
              <a href="/login" className="text-sm text-muted-foreground hover:text-primary transition-colors block">
                ← Customer Login
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
