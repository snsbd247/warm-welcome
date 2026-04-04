import { sessionStore } from "@/lib/sessionStore";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Lock, Loader2, Shield } from "lucide-react";
import { API_BASE_URL } from "@/lib/apiBaseUrl";
import { IS_LOVABLE } from "@/lib/environment";
import { db } from "@/integrations/supabase/client";
import { hashPassword } from "@/lib/passwordHash";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ForcePasswordChange() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const fp = t.forcePassword;
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const token = sessionStore.getItem("admin_token");
  const user = JSON.parse(sessionStore.getItem("admin_user") || "{}");

  useEffect(() => {
    if (!user?.must_change_password) navigate("/dashboard");
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) { toast.error(fp.passwordMinError); return; }
    if (newPassword !== confirmPassword) { toast.error(fp.passwordMismatch); return; }

    setLoading(true);
    try {
      if (IS_LOVABLE) {
        if (!user?.id) throw new Error("User session not found");
        const { error } = await db.from("profiles").update({ password_hash: hashPassword(newPassword), must_change_password: false }).eq("id", user.id);
        if (error) throw error;
      } else {
        const res = await fetch(`${API_BASE_URL}/admin/force-password-change`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ new_password: newPassword, new_password_confirmation: confirmPassword }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || data.message || "Failed");
      }
      const updatedUser = { ...user, must_change_password: false };
      sessionStore.setItem("admin_user", JSON.stringify(updatedUser));
      toast.success(fp.passwordChanged);
      setTimeout(() => navigate("/dashboard"), 1000);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-xl">{fp.changeYourPassword}</CardTitle>
          <p className="text-sm text-muted-foreground">{fp.securityMessage}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>{fp.newPassword}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input type="password" className="pl-9" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder={fp.minChars} required minLength={6} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{fp.confirmPassword}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input type="password" className="pl-9" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder={fp.reEnter} required />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Shield className="h-4 w-4 mr-2" />}
              {fp.changeAndContinue}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
