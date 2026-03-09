import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

function getDeviceInfo() {
  const ua = navigator.userAgent;
  let browser = "Unknown Browser";
  if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Edg")) browser = "Microsoft Edge";
  else if (ua.includes("Chrome")) browser = "Chrome";
  else if (ua.includes("Safari")) browser = "Safari";
  else if (ua.includes("Opera") || ua.includes("OPR")) browser = "Opera";

  let device = "Desktop";
  if (/Mobi|Android/i.test(ua)) device = "Mobile";
  else if (/Tablet|iPad/i.test(ua)) device = "Tablet";

  const platform = navigator.platform || "Unknown OS";
  return { browser, device_name: `${device} (${platform})` };
}

async function getIPAddress(): Promise<string> {
  try {
    const res = await fetch("https://api.ipify.org?format=json");
    const data = await res.json();
    return data.ip || "0.0.0.0";
  } catch {
    return "0.0.0.0";
  }
}

export async function checkExistingSession(adminId: string) {
  const { data } = await supabase
    .from("admin_sessions")
    .select("*")
    .eq("admin_id", adminId)
    .eq("status", "active");
  return data && data.length > 0 ? data[0] : null;
}

export async function createPendingSession(adminId: string, sessionToken: string) {
  const { browser, device_name } = getDeviceInfo();
  const ip_address = await getIPAddress();

  const { data, error } = await supabase
    .from("admin_sessions")
    .insert({
      admin_id: adminId,
      session_token: sessionToken,
      device_name,
      browser,
      ip_address,
      status: "pending",
    })
    .select()
    .single();

  if (error) throw error;

  // Log the attempt
  await supabase.from("admin_login_logs").insert({
    admin_id: adminId,
    action: "login_requested",
    device_name,
    browser,
    ip_address,
    session_id: data.id,
  });

  return data;
}

export async function createActiveSession(adminId: string, sessionToken: string) {
  const { browser, device_name } = getDeviceInfo();
  const ip_address = await getIPAddress();

  // Deactivate any old sessions
  await supabase
    .from("admin_sessions")
    .update({ status: "expired", updated_at: new Date().toISOString() })
    .eq("admin_id", adminId)
    .eq("status", "active");

  const { data, error } = await supabase
    .from("admin_sessions")
    .insert({
      admin_id: adminId,
      session_token: sessionToken,
      device_name,
      browser,
      ip_address,
      status: "active",
    })
    .select()
    .single();

  if (error) throw error;

  // Log
  await supabase.from("admin_login_logs").insert({
    admin_id: adminId,
    action: "login_success",
    device_name,
    browser,
    ip_address,
    session_id: data.id,
  });

  return data;
}

export async function approveSession(sessionId: string, adminId: string) {
  const { error } = await supabase
    .from("admin_sessions")
    .update({ status: "active", updated_at: new Date().toISOString() })
    .eq("id", sessionId);

  if (error) throw error;

  await supabase.from("admin_login_logs").insert({
    admin_id: adminId,
    action: "login_approved",
    session_id: sessionId,
  });
}

export async function rejectSession(sessionId: string, adminId: string) {
  const { error } = await supabase
    .from("admin_sessions")
    .update({ status: "rejected", updated_at: new Date().toISOString() })
    .eq("id", sessionId);

  if (error) throw error;

  await supabase.from("admin_login_logs").insert({
    admin_id: adminId,
    action: "login_rejected",
    session_id: sessionId,
  });
}

export async function removeSession(adminId: string) {
  await supabase
    .from("admin_sessions")
    .update({ status: "expired", updated_at: new Date().toISOString() })
    .eq("admin_id", adminId)
    .eq("status", "active");

  await supabase.from("admin_login_logs").insert({
    admin_id: adminId,
    action: "logout",
  });
}

export function useSessionRealtimeListener(
  adminId: string | undefined,
  onPendingSession: (session: any) => void
) {
  const callbackRef = useRef(onPendingSession);
  callbackRef.current = onPendingSession;

  useEffect(() => {
    if (!adminId) return;

    const channel = supabase
      .channel(`admin-sessions-${adminId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "admin_sessions",
          filter: `admin_id=eq.${adminId}`,
        },
        (payload) => {
          if (payload.new && (payload.new as any).status === "pending") {
            callbackRef.current(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [adminId]);
}

export function usePendingSessionListener(
  sessionId: string | undefined,
  onStatusChange: (status: string) => void
) {
  const callbackRef = useRef(onStatusChange);
  callbackRef.current = onStatusChange;

  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel(`pending-session-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "admin_sessions",
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          const newStatus = (payload.new as any).status;
          if (newStatus === "active" || newStatus === "rejected") {
            callbackRef.current(newStatus);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);
}
