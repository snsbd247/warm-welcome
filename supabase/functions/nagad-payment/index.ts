import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

async function getGatewayConfig() {
  const { data, error } = await supabase
    .from("payment_gateways")
    .select("*")
    .eq("gateway_name", "nagad")
    .maybeSingle();
  if (error) throw new Error("Failed to load Nagad gateway config");
  if (!data?.app_key || !data?.app_secret) throw new Error("Nagad gateway not configured in database");
  return data;
}

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 5) return false;
  entry.count++;
  return true;
}

async function logRequest(action: string, recordId: string, status: string, details: string) {
  try {
    await supabase.from("audit_logs").insert({
      admin_id: "00000000-0000-0000-0000-000000000000",
      admin_name: "System",
      table_name: "payment_gateways",
      action,
      record_id: recordId,
      new_data: { status, details },
    });
  } catch (_) { /* ignore */ }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...params } = await req.json();

    if (!checkRateLimit(action || "unknown")) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again in 1 minute." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "test_connection") {
      const gw = await getGatewayConfig();
      // Simple connectivity test – attempt to reach Nagad base URL
      try {
        const testUrl = `${gw.base_url}/check/payment/verify`;
        const res = await fetch(testUrl, { method: "GET" });
        // Nagad returns various codes; a non-network error means the endpoint is reachable
        await supabase
          .from("payment_gateways")
          .update({ status: "connected", last_connected_at: new Date().toISOString() })
          .eq("id", gw.id);
        await logRequest("nagad_test_connection", gw.id, "success", `HTTP ${res.status}`);
        return new Response(JSON.stringify({ success: true, status: res.status }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e: any) {
        await supabase
          .from("payment_gateways")
          .update({ status: "disconnected" })
          .eq("id", gw.id);
        await logRequest("nagad_test_connection", gw.id, "failed", e.message);
        throw new Error("Cannot reach Nagad API: " + e.message);
      }
    }

    if (action === "query_transaction") {
      const gw = await getGatewayConfig();
      const { paymentRefId } = params;
      if (!paymentRefId) throw new Error("paymentRefId is required");

      const url = `${gw.base_url}/verify/payment/${paymentRefId}`;
      const res = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      await logRequest("nagad_query", paymentRefId, data?.status || "unknown", JSON.stringify(data).slice(0, 200));
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "refund") {
      const gw = await getGatewayConfig();
      const { paymentRefId, amount, reason } = params;
      if (!paymentRefId || !amount) throw new Error("paymentRefId and amount are required");

      // Nagad refund API call placeholder
      const url = `${gw.base_url}/purchase/refund`;
      const refundBody = {
        paymentRefId,
        amount: String(amount),
        reason: reason || "Refund",
      };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(refundBody),
      });
      const data = await res.json();

      const isSuccess = data?.status === "Success" || data?.statusCode === "000";

      if (isSuccess) {
        // Update payment status
        await supabase
          .from("payments")
          .update({ status: "refunded" })
          .eq("transaction_id", paymentRefId)
          .eq("payment_method", "nagad");

        // Send SMS notification
        try {
          const { data: payment } = await supabase
            .from("payments")
            .select("customer_id, amount, customers(phone, name)")
            .eq("transaction_id", paymentRefId)
            .maybeSingle();

          if (payment?.customers?.phone) {
            const { data: smsSettings } = await supabase.from("sms_settings").select("api_token, sender_id").limit(1).maybeSingle();
            if (smsSettings?.api_token) {
              const msg = `Dear ${(payment.customers as any).name}, your Nagad payment of ৳${amount} (Ref: ${paymentRefId}) has been refunded. -Smart ISP`;
              await fetch(`http://api.greenweb.com.bd/api.php?token=${smsSettings.api_token}&to=${(payment.customers as any).phone}&message=${encodeURIComponent(msg)}`);
            }
          }
        } catch (_) { /* ignore SMS errors */ }
      }

      await logRequest("nagad_refund", paymentRefId, isSuccess ? "success" : "failed", JSON.stringify(data).slice(0, 200));

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
