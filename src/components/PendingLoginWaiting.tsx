import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck, XCircle, Clock } from "lucide-react";
import { usePendingSessionListener } from "@/hooks/useAdminSession";

interface Props {
  sessionId: string;
  onApproved: () => void;
  onRejected: () => void;
  onCancel: () => void;
}

export default function PendingLoginWaiting({ sessionId, onApproved, onRejected, onCancel }: Props) {
  const [status, setStatus] = useState<"pending" | "active" | "rejected">("pending");
  const [timeLeft, setTimeLeft] = useState(120); // 2 minute timeout

  usePendingSessionListener(sessionId, (newStatus) => {
    setStatus(newStatus as any);
    if (newStatus === "active") onApproved();
    if (newStatus === "rejected") onRejected();
  });

  // Timeout countdown
  useEffect(() => {
    if (status !== "pending") return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          onRejected();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [status, onRejected]);

  if (status === "active") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md border-success/50">
          <CardContent className="p-8 text-center">
            <ShieldCheck className="h-16 w-16 text-success mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">Login Approved!</h2>
            <p className="text-muted-foreground">Redirecting to dashboard...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md border-destructive/50">
          <CardContent className="p-8 text-center">
            <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">Login Rejected</h2>
            <p className="text-muted-foreground mb-4">The active session denied this login request.</p>
            <Button variant="outline" onClick={onCancel}>Back to Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-3">
          <div className="h-14 w-14 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-3">
            <Clock className="h-7 w-7 text-warning" />
          </div>
          <CardTitle className="text-xl">Waiting for Approval</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground text-sm">
            Your account is already logged in on another device. 
            A notification has been sent to approve this login.
          </p>
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm font-medium text-foreground">
              Waiting... ({Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")})
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-1000 ease-linear rounded-full"
              style={{ width: `${(timeLeft / 120) * 100}%` }}
            />
          </div>
          <Button variant="ghost" size="sm" onClick={onCancel} className="text-muted-foreground">
            Cancel Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
