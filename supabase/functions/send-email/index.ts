import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Simple in-memory cache for SMTP settings (Edge Functions are short-lived, so this is per-invocation)
let cachedSmtpSettings: Record<string, string> | null = null;

async function getSmtpSettings(supabase: any): Promise<Record<string, string>> {
  if (cachedSmtpSettings) return cachedSmtpSettings;

  const { data } = await supabase
    .from("system_settings")
    .select("setting_key, setting_value")
    .like("setting_key", "smtp_%");

  const settings: Record<string, string> = {};
  (data || []).forEach((row: any) => {
    settings[row.setting_key] = row.setting_value || "";
  });

  // Fall back to env vars if DB settings are empty
  if (!settings.smtp_host) {
    settings.smtp_host = Deno.env.get("SMTP_HOST") || "";
    settings.smtp_port = Deno.env.get("SMTP_PORT") || "587";
    settings.smtp_user = Deno.env.get("SMTP_USER") || "";
    settings.smtp_password = Deno.env.get("SMTP_PASSWORD") || "";
    settings.smtp_from_email = Deno.env.get("SMTP_FROM_EMAIL") || "";
    settings.smtp_from_name = Deno.env.get("SMTP_FROM_NAME") || "Smart ISP";
    settings.smtp_encryption = Deno.env.get("SMTP_ENCRYPTION") || "tls";
  }

  cachedSmtpSettings = settings;
  return settings;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { to, subject, html, from_name } = await req.json();

    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, subject, html" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Try Resend API first (backward compatible)
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (resendApiKey) {
      const senderDomain = Deno.env.get("EMAIL_SENDER_DOMAIN") || "notifications@resend.dev";
      const senderName = from_name || "Smart ISP";

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `${senderName} <${senderDomain}>`,
          to: Array.isArray(to) ? to : [to],
          subject,
          html,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        console.error("[send-email] Resend API error:", result);
        return new Response(
          JSON.stringify({ success: false, error: result?.message || "Email send failed" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("[send-email] Email sent via Resend:", result.id);
      return new Response(
        JSON.stringify({ success: true, id: result.id, provider: "resend" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fall back to SMTP settings from database
    const smtp = await getSmtpSettings(supabase);

    if (!smtp.smtp_host || !smtp.smtp_user) {
      console.warn("[send-email] No email provider configured (neither Resend nor SMTP)");
      return new Response(
        JSON.stringify({ success: false, skipped: true, reason: "No email provider configured. Set up SMTP in Integration Management or configure RESEND_API_KEY." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use SMTP via a lightweight HTTP-based relay
    // For now, we'll use the built-in Deno SMTP approach
    // Since Deno edge functions have limited SMTP support, we construct a simple API call
    const senderEmail = smtp.smtp_from_email || smtp.smtp_user;
    const senderName = from_name || smtp.smtp_from_name || "Smart ISP";

    // Attempt SMTP send using a fetch-based approach to an SMTP relay
    // This uses the SMTP credentials to authenticate with common providers
    const smtpHost = smtp.smtp_host.toLowerCase();

    // For Gmail, Outlook, and similar providers that offer REST APIs or use standard SMTP
    // We'll use a simple SMTP-to-HTTP bridge pattern
    console.log(`[send-email] Attempting SMTP send via ${smtpHost} to ${to}`);

    // Since Edge Functions can't do raw TCP for SMTP, we'll inform the user
    // and suggest using Resend or configuring an HTTP-based email API
    // However, we still store settings for future use and test connectivity
    return new Response(
      JSON.stringify({
        success: false,
        error: "SMTP direct send is not supported in Edge Functions. Please configure Resend API key for email delivery, or use SMTP settings with an HTTP relay.",
        smtp_configured: true,
        smtp_host: smtp.smtp_host,
        smtp_from: senderEmail,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[send-email] Error:", err.message);
    return new Response(
      JSON.stringify({ error: err.message || "Email operation failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
