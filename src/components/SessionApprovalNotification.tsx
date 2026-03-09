import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Monitor, Globe, MapPin, Check, X, Loader2, ShieldAlert } from "lucide-react";
import { approveSession, rejectSession } from "@/hooks/useAdminSession";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface PendingSession {
  id: string;
  admin_id: string;
  device_name: string;
  browser: string;
  ip_address: string;
  created_at: string;
}

interface Props {
  session: PendingSession;
  onResolved: () => void;
}

export default function SessionApprovalNotification({ session, onResolved }: Props) {
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const { user } = useAuth();

  const handleApprove = async () => {
    setLoading("approve");
    try {
      await approveSession(session.id, user!.id);
      toast.success("Login approved — new device is now active");
      onResolved();
    } catch (e: any) {
      toast.error("Failed to approve: " + e.message);
    } finally {
      setLoading(null);
    }
  };

  const handleReject = async () => {
    setLoading("reject");
    try {
      await rejectSession(session.id, user!.id);
      toast.info("Login request rejected");
      onResolved();
    } catch (e: any) {
      toast.error("Failed to reject: " + e.message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
      <Card className="w-full max-w-md mx-4 border-warning/50 shadow-2xl">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <ShieldAlert className="h-5 w-5 text-warning" />
            </div>
            <div>
              <CardTitle className="text-lg">New Login Request</CardTitle>
              <p className="text-sm text-muted-foreground">
                Someone is trying to log in to your account
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted/50 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Monitor className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Device</p>
                <p className="text-sm font-medium text-foreground">{session.device_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Browser</p>
                <p className="text-sm font-medium text-foreground">{session.browser}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">IP Address</p>
                <p className="text-sm font-medium text-foreground font-mono">{session.ip_address}</p>
              </div>
            </div>
          </div>

          <Badge variant="outline" className="text-xs text-muted-foreground">
            Requested at {new Date(session.created_at).toLocaleTimeString()}
          </Badge>

          <div className="flex gap-3 pt-2">
            <Button
              className="flex-1"
              variant="default"
              onClick={handleApprove}
              disabled={loading !== null}
            >
              {loading === "approve" ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Approve
            </Button>
            <Button
              className="flex-1"
              variant="destructive"
              onClick={handleReject}
              disabled={loading !== null}
            >
              {loading === "reject" ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <X className="h-4 w-4 mr-2" />
              )}
              Reject
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
