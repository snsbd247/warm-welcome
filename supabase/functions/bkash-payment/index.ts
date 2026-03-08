import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BKASH_BASE_URL = "https://tokenized.pay.bka.sh/v1.2.0-beta";

async function getBkashToken(): Promise<string> {
  const res = await fetch(`${BKASH_BASE_URL}/tokenized/checkout/token/grant`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      username: Deno.env.get("BKASH_USERNAME")!,
      password: Deno.env.get("BKASH_PASSWORD")!,
    },
    body: JSON.stringify({
      app_key: Deno.env.get("BKASH_APP_KEY")!,
      app_secret: Deno.env.get("BKASH_APP_SECRET")!,
    }),
  });
  const data = await res.json();
  if (!data.id_token) throw new Error(data.statusMessage || "Failed to get bKash token");
  return data.id_token;
}

function getSupabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.split("/").pop();

    if (req.method === "POST" && path === "create") {
      // Create payment
      const { bill_id, customer_id, amount, callback_url } = await req.json();

      if (!bill_id || !customer_id || !amount) {
        return new Response(JSON.stringify({ error: "Missing required fields" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const token = await getBkashToken();
      const invoiceNumber = `INV-${Date.now()}`;

      const res = await fetch(`${BKASH_BASE_URL}/tokenized/checkout/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
          "X-APP-Key": Deno.env.get("BKASH_APP_KEY")!,
        },
        body: JSON.stringify({
          mode: "0011",
          payerReference: customer_id,
          callbackURL: callback_url,
          amount: amount.toString(),
          currency: "BDT",
          intent: "sale",
          merchantInvoiceNumber: invoiceNumber,
        }),
      });

      const data = await res.json();

      if (data.bkashURL) {
        // Store pending payment
        const supabase = getSupabaseAdmin();
        await supabase.from("payments").insert({
          customer_id,
          bill_id,
          amount,
          payment_method: "bkash",
          status: "pending",
          bkash_payment_id: data.paymentID,
          month: null,
          transaction_id: invoiceNumber,
        });

        return new Response(JSON.stringify({ bkashURL: data.bkashURL, paymentID: data.paymentID }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: data.statusMessage || "Failed to create payment" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "POST" && path === "execute") {
      // Execute payment after customer returns from bKash
      const { paymentID } = await req.json();

      if (!paymentID) {
        return new Response(JSON.stringify({ error: "Missing paymentID" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const token = await getBkashToken();

      const res = await fetch(`${BKASH_BASE_URL}/tokenized/checkout/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
          "X-APP-Key": Deno.env.get("BKASH_APP_KEY")!,
        },
        body: JSON.stringify({ paymentID }),
      });

      const data = await res.json();
      const supabase = getSupabaseAdmin();

      if (data.statusCode === "0000" && data.transactionStatus === "Completed") {
        // Update payment record
        await supabase
          .from("payments")
          .update({
            status: "completed",
            bkash_trx_id: data.trxID,
            transaction_id: data.trxID,
            paid_at: new Date().toISOString(),
          })
          .eq("bkash_payment_id", paymentID);

        // Get the payment to find the bill_id
        const { data: payment } = await supabase
          .from("payments")
          .select("bill_id, customer_id")
          .eq("bkash_payment_id", paymentID)
          .single();

        // Mark bill as paid
        if (payment?.bill_id) {
          // Get the bill to get the month
          const { data: bill } = await supabase
            .from("bills")
            .select("month")
            .eq("id", payment.bill_id)
            .single();

          await supabase
            .from("bills")
            .update({ status: "paid", paid_date: new Date().toISOString() })
            .eq("id", payment.bill_id);

          // Update payment month
          if (bill?.month) {
            await supabase
              .from("payments")
              .update({ month: bill.month })
              .eq("bkash_payment_id", paymentID);
          }
        }

        return new Response(JSON.stringify({ success: true, trxID: data.trxID }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Payment failed - update status
      await supabase
        .from("payments")
        .update({ status: "failed" })
        .eq("bkash_payment_id", paymentID);

      return new Response(JSON.stringify({ error: data.statusMessage || "Payment failed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("bKash payment error:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
