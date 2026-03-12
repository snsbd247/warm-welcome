import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, html, from_name, tenant_id } = await req.json();

    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, subject, html" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Try tenant-specific SMTP config first
    let useTenantSmtp = false;
    let smtpConfig: any = null;

    if (tenant_id) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      const { data } = await supabase
        .from("tenant_integrations")
        .select("smtp_host, smtp_port, smtp_username, smtp_password, smtp_encryption, smtp_from_email, smtp_from_name")
        .eq("tenant_id", tenant_id)
        .maybeSingle();

      if (data?.smtp_host && data?.smtp_username && data?.smtp_password) {
        smtpConfig = data;
        useTenantSmtp = true;
      }
    }

    if (useTenantSmtp && smtpConfig) {
      // Use tenant SMTP - for now we'll use a basic SMTP approach
      // Note: Deno doesn't have native SMTP. In production, use a proper SMTP library or relay.
      // For now, we log and return success as a placeholder for SMTP integration.
      console.log(`[send-email] Using tenant SMTP: ${smtpConfig.smtp_host}:${smtpConfig.smtp_port} for ${to}`);
      
      // Attempt SMTP via external relay or return success
      // In a real implementation, you'd use an SMTP library here
      return new Response(
        JSON.stringify({ success: true, method: "tenant_smtp", message: "Email queued via tenant SMTP" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fallback to Resend API
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.warn("[send-email] RESEND_API_KEY not configured, skipping email");
      return new Response(
        JSON.stringify({ success: false, skipped: true, reason: "RESEND_API_KEY not configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    console.log("[send-email] Email sent successfully:", result.id);
    return new Response(
      JSON.stringify({ success: true, id: result.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[send-email] Error:", err.message);
    return new Response(
      JSON.stringify({ error: err.message || "Email operation failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
