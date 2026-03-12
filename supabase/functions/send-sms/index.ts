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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { to, message, sms_type, customer_id, tenant_id } = await req.json();

    if (!to || !message || !sms_type) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, message, sms_type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Load tenant-specific SMS config if tenant_id provided
    let gatewayUrl = "";
    let token = "";
    let senderId = "";

    if (tenant_id) {
      const { data: tenantConfig } = await supabase
        .from("tenant_integrations")
        .select("sms_gateway_url, sms_api_key, sms_sender_id")
        .eq("tenant_id", tenant_id)
        .maybeSingle();

      if (tenantConfig?.sms_api_key) {
        gatewayUrl = tenantConfig.sms_gateway_url || "http://api.greenweb.com.bd/api.php";
        token = tenantConfig.sms_api_key;
        senderId = tenantConfig.sms_sender_id || "";
      }
    }

    // Fallback to sms_settings table or env var
    if (!token) {
      const { data: settings } = await supabase.from("sms_settings").select("*").limit(1).single();
      token = settings?.api_token || Deno.env.get("GREENWEB_SMS_TOKEN") || "";
      senderId = settings?.sender_id || "";
      gatewayUrl = "http://api.greenweb.com.bd/api.php";

      if (!token) {
        throw new Error("SMS API token not configured");
      }

      // Check if SMS is enabled for this type
      if (sms_type === "bill_generate" && !settings?.sms_on_bill_generate) {
        return new Response(JSON.stringify({ success: false, reason: "SMS disabled for bill generation" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (sms_type === "payment" && !settings?.sms_on_payment) {
        return new Response(JSON.stringify({ success: false, reason: "SMS disabled for payments" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (sms_type === "registration" && !settings?.sms_on_registration) {
        return new Response(JSON.stringify({ success: false, reason: "SMS disabled for registration" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (sms_type === "suspension" && !settings?.sms_on_suspension) {
        return new Response(JSON.stringify({ success: false, reason: "SMS disabled for suspension" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // Clean phone number
    const cleanPhone = to.replace(/[^0-9]/g, "");
    const phone = cleanPhone.startsWith("88") ? cleanPhone : `88${cleanPhone}`;

    // Send SMS via gateway
    const smsUrl = `${gatewayUrl}?token=${token}&to=${phone}&message=${encodeURIComponent(message)}`;
    const smsResponse = await fetch(smsUrl);
    const responseText = await smsResponse.text();

    const status = responseText.includes("Ok") ? "sent" : "failed";

    // Log to database
    await supabase.from("sms_logs").insert({
      phone: to,
      message,
      sms_type,
      status,
      response: responseText,
      customer_id: customer_id || null,
      tenant_id: tenant_id || null,
    });

    // Also log to reminder_logs if it's a reminder type
    if (["bill_generate", "bill_reminder", "due_date", "overdue"].includes(sms_type)) {
      await supabase.from("reminder_logs").insert({
        phone: to,
        message,
        channel: "sms",
        status,
        customer_id: customer_id || null,
        tenant_id: tenant_id || null,
      });
    }

    return new Response(
      JSON.stringify({ success: true, status, response: responseText }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
