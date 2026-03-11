import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SystemHealth {
  dbConnected: boolean;
  lastCheck: Date | null;
  consecutiveFailures: number;
  safeModeActive: boolean;
  checking: boolean;
  error: string | null;
}

const FAILURE_THRESHOLD = 3;
const CHECK_INTERVAL = 30_000; // 30 seconds

export function useSystemHealth() {
  const [health, setHealth] = useState<SystemHealth>({
    dbConnected: true,
    lastCheck: null,
    consecutiveFailures: 0,
    safeModeActive: false,
    checking: false,
    error: null,
  });
  const failureCount = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const emergencyBackupTriggered = useRef(false);
  const safeModeNotified = useRef(false);

  const sendSafeModeNotification = useCallback(async (type: "safe_mode" | "emergency_backup", details?: string) => {
    try {
      const { data: settings } = await supabase
        .from("general_settings")
        .select("mobile, email, site_name")
        .limit(1)
        .single();

      const siteName = settings?.site_name || "Smart ISP";
      const message = type === "safe_mode"
        ? `🚨 [${siteName}] CRITICAL: Safe Mode activated! Database connectivity lost after multiple failures. Immediate attention required. ${details || ""}`
        : `⚠️ [${siteName}] Emergency backup created automatically due to system instability. ${details || ""}`;

      // Send SMS if mobile configured
      if (settings?.mobile) {
        await supabase.functions.invoke("send-sms", {
          body: { to: settings.mobile, message, sms_type: "manual" },
        });
        console.log(`[SafeMode] ${type} SMS notification sent to ${settings.mobile}`);
      }

      // Send Email if email configured
      if (settings?.email) {
        const subject = type === "safe_mode"
          ? `🚨 CRITICAL: ${siteName} Safe Mode Activated`
          : `⚠️ ${siteName} Emergency Backup Created`;

        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: ${type === "safe_mode" ? "#dc2626" : "#f59e0b"}; color: white; padding: 16px 24px; border-radius: 8px 8px 0 0;">
              <h2 style="margin: 0; font-size: 18px;">${subject}</h2>
            </div>
            <div style="background: #ffffff; border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
              <p style="color: #374151; line-height: 1.6; margin: 0 0 16px;">${message}</p>
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px;">
                <strong>Time:</strong> ${new Date().toISOString()}
              </p>
              ${details ? `<p style="color: #6b7280; font-size: 14px; margin: 0;"><strong>Details:</strong> ${details}</p>` : ""}
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                This is an automated alert from ${siteName} system health monitor.
              </p>
            </div>
          </div>
        `;

        await supabase.functions.invoke("send-email", {
          body: { to: settings.email, subject, html, from_name: siteName },
        });
        console.log(`[SafeMode] ${type} email notification sent to ${settings.email}`);
      }

      if (!settings?.mobile && !settings?.email) {
        console.warn("[SafeMode] No admin mobile or email configured for notifications");
      }
    } catch (err: any) {
      console.error("[SafeMode] Failed to send notification:", err.message);
    }
  }, []);

  const triggerEmergencyBackup = useCallback(async () => {
    if (emergencyBackupTriggered.current) return;
    emergencyBackupTriggered.current = true;
    console.warn("[SafeMode] Triggering automatic emergency backup before safe mode activation...");
    try {
      const { error } = await supabase.functions.invoke("backup-restore", {
        body: { action: "emergency" },
      });
      if (error) {
        console.error("[SafeMode] Emergency backup failed:", error.message);
      } else {
        console.log("[SafeMode] Emergency backup created successfully.");
        sendSafeModeNotification("emergency_backup");
      }
    } catch (err: any) {
      console.error("[SafeMode] Emergency backup error:", err.message);
    }
  }, [sendSafeModeNotification]);

  const checkHealth = useCallback(async () => {
    setHealth((h) => ({ ...h, checking: true }));
    try {
      // Simple ping - select count from a small table
      const { error } = await supabase
        .from("general_settings")
        .select("id", { count: "exact", head: true });

      if (error) {
        failureCount.current += 1;
        const willActivateSafeMode = failureCount.current >= FAILURE_THRESHOLD;
        // Trigger emergency backup just before safe mode activates
        if (failureCount.current === FAILURE_THRESHOLD - 1) {
          triggerEmergencyBackup();
        }
        // Send SMS when Safe Mode first activates
        if (willActivateSafeMode && !safeModeNotified.current) {
          safeModeNotified.current = true;
          sendSafeModeNotification("safe_mode", error.message);
        }
        setHealth((h) => ({
          ...h,
          dbConnected: false,
          lastCheck: new Date(),
          consecutiveFailures: failureCount.current,
          safeModeActive: willActivateSafeMode,
          checking: false,
          error: error.message,
        }));
      } else {
        failureCount.current = 0;
        emergencyBackupTriggered.current = false;
        safeModeNotified.current = false;
        setHealth((h) => ({
          ...h,
          dbConnected: true,
          lastCheck: new Date(),
          consecutiveFailures: 0,
          safeModeActive: false,
          checking: false,
          error: null,
        }));
      }
    } catch (err: any) {
      failureCount.current += 1;
      if (failureCount.current === FAILURE_THRESHOLD - 1) {
        triggerEmergencyBackup();
      }
      setHealth((h) => ({
        ...h,
        dbConnected: false,
        lastCheck: new Date(),
        consecutiveFailures: failureCount.current,
        safeModeActive: failureCount.current >= FAILURE_THRESHOLD,
        checking: false,
        error: err.message || "Connection failed",
      }));
    }
  }, [triggerEmergencyBackup, sendSafeModeNotification]);

  const dismissSafeMode = useCallback(() => {
    failureCount.current = 0;
    emergencyBackupTriggered.current = false;
    safeModeNotified.current = false;
    setHealth((h) => ({
      ...h,
      safeModeActive: false,
      consecutiveFailures: 0,
    }));
  }, []);

  useEffect(() => {
    checkHealth();
    intervalRef.current = setInterval(checkHealth, CHECK_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [checkHealth]);

  return { ...health, checkHealth, dismissSafeMode };
}
