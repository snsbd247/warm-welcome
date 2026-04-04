import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

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

    // Fall back to SMTP settings from smtp_settings table
    const { data: smtp, error: smtpError } = await supabase
      .from("smtp_settings")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (smtpError) {
      console.error("[send-email] Failed to fetch SMTP settings:", smtpError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to fetch SMTP settings" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!smtp?.host || !smtp?.username) {
      console.warn("[send-email] No email provider configured");
      return new Response(
        JSON.stringify({ success: false, skipped: true, reason: "No email provider configured. Set up SMTP in Integration Management or configure RESEND_API_KEY." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Gmail app passwords: strip spaces
    const rawPassword = smtp.password || "";
    const smtpPassword = smtp.host?.includes("gmail") ? rawPassword.replace(/\s/g, '') : rawPassword;

    if (!smtpPassword) {
      return new Response(
        JSON.stringify({ success: false, error: "SMTP password is missing" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const port = Number(smtp.port) || 587;
    const encryption = String(smtp.encryption || "tls").toLowerCase();
    const useTLS = encryption === "tls" || encryption === "ssl" || port === 465;

    const fromEmail = smtp.from_email || smtp.username;
    const senderName = from_name || smtp.from_name || "Smart ISP";

    console.log(`[send-email] Sending to ${to} via ${smtp.host}:${port} (${encryption})`);

    try {
      const client = new SMTPClient({
        connection: {
          hostname: smtp.host,
          port: port,
          tls: useTLS,
          auth: {
            username: smtp.username,
            password: smtpPassword,
          },
        },
      });

      await client.send({
        from: `${senderName} <${fromEmail}>`,
        to: Array.isArray(to) ? to.join(", ") : to,
        subject,
        html,
      });

      await client.close();

      console.log(`[send-email] Email sent successfully to ${to}`);
      return new Response(
        JSON.stringify({ success: true, provider: "smtp" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (smtpErr: unknown) {
      const errMsg = smtpErr instanceof Error ? smtpErr.message : String(smtpErr);
      console.error(`[send-email] SMTP send failed:`, errMsg);
      return new Response(
        JSON.stringify({ success: false, error: `SMTP send failed: ${errMsg}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (err) {
    console.error("[send-email] Error:", err instanceof Error ? err.message : err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Email operation failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
