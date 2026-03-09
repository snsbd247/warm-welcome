import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSessionRealtimeListener } from "@/hooks/useAdminSession";
import SessionApprovalNotification from "./SessionApprovalNotification";

export default function SessionApprovalListener() {
  const { user } = useAuth();
  const [pendingSession, setPendingSession] = useState<any>(null);

  const handlePendingSession = useCallback((session: any) => {
    setPendingSession(session);
  }, []);

  useSessionRealtimeListener(user?.id, handlePendingSession);

  if (!pendingSession) return null;

  return (
    <SessionApprovalNotification
      session={pendingSession}
      onResolved={() => setPendingSession(null)}
    />
  );
}
