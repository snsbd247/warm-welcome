import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { autoMatchMerchantPayment } from "../_shared/business-logic.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key",
};

// Parse bKash merchant SMS
function parseBkashSMS(smsText: string) {
  const amountMatch = smsText.match(/Tk\s*([\d,]+(?:\.\d+)?)/i);
  const phoneMatch = smsText.match(/from\s+(01[\d]{9})/i);
  const trxIdMatch = smsText.match(/TrxID[:\s]+([A-Za-z0-9]+)/i);
  const refMatch = smsText.match(/Reference[:\s]+([A-Za-z0-9\-]+)/i);

  if (!amountMatch || !trxIdMatch) return null;

  return {
    amount: parseFloat(amountMatch[1].replace(/,/g, "")),
    sender_phone: phoneMatch ? phoneMatch[1] : "unknown",
    transaction_id: trxIdMatch[1].trim(),
    reference: refMatch ? refMatch[1].trim() : null,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Validate API key
    const apiKey = req.headers.get("x-api-key");
    const expectedKey = Deno.env.get("SMS_RECEIVER_API_KEY");
    if (expectedKey && apiKey !== expectedKey) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const smsText: string = body.sms_text || body.message || body.text || "";

    if (!smsText) {
      return new Response(
        JSON.stringify({ error: "No SMS text provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Received SMS:", smsText);

    const parsed = parseBkashSMS(smsText);
    if (!parsed) {
      await supabase.from("sms_logs").insert({
        phone: body.sender || "unknown",
        message: smsText,
        sms_type: "merchant_sms",
        status: "failed",
        response: "Could not parse SMS format",
      });

      return new Response(
        JSON.stringify({ error: "Could not parse SMS format", sms_text: smsText }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for duplicate
    const { data: existing } = await supabase
      .from("merchant_payments")
      .select("id")
      .eq("transaction_id", parsed.transaction_id)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ status: "duplicate", message: `Transaction ${parsed.transaction_id} already processed` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert merchant payment (without relying on trigger for matching)
    const { data: inserted, error: insertError } = await supabase
      .from("merchant_payments")
      .insert({
        transaction_id: parsed.transaction_id,
        sender_phone: parsed.sender_phone,
        amount: parsed.amount,
        reference: parsed.reference,
        sms_text: smsText,
        payment_date: new Date().toISOString(),
        status: "unmatched", // Set initial status explicitly
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ error: insertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Business logic: auto-match (previously done by trigger)
    const matchResult = await autoMatchMerchantPayment(supabase, inserted);

    // Update with match result
    await supabase.from("merchant_payments").update({
      status: matchResult.status,
      matched_customer_id: matchResult.matched_customer_id || null,
      matched_bill_id: matchResult.matched_bill_id || null,
      notes: matchResult.notes || null,
    }).eq("id", inserted.id);

    // Send admin notification for unmatched/review payments
    if (matchResult.status !== "matched") {
      try {
        const { data: settings } = await supabase
          .from("general_settings")
          .select("mobile")
          .limit(1)
          .single();

        if (settings?.mobile) {
          const statusLabel = matchResult.status === "manual_review" ? "Manual Review" : "Unmatched";
          const notifMsg = `[Smart ISP] ${statusLabel} Payment: TrxID ${parsed.transaction_id}, Tk ${parsed.amount}, Ref: ${parsed.reference || "N/A"}, Phone: ${parsed.sender_phone}`;

          await fetch(`${supabaseUrl}/functions/v1/send-sms`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${serviceRoleKey}` },
            body: JSON.stringify({ to: settings.mobile, message: notifMsg, sms_type: "merchant_alert" }),
          });
        }
      } catch (notifErr) {
        console.error("Admin notification error:", notifErr);
      }
    }

    // Log SMS processing
    await supabase.from("sms_logs").insert({
      phone: parsed.sender_phone,
      message: smsText,
      sms_type: "merchant_sms",
      status: "sent",
      response: `Processed: ${matchResult.status} - TrxID: ${parsed.transaction_id}`,
    });

    return new Response(
      JSON.stringify({
        status: "success",
        match_status: matchResult.status,
        transaction_id: parsed.transaction_id,
        amount: parsed.amount,
        reference: parsed.reference,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("SMS receiver error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
