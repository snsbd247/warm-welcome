import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import {
  generateCustomerId,
  generateTicketId,
  createBillLedgerEntry,
  createPaymentLedgerEntry,
  handlePaymentReactivation,
  autoMatchMerchantPayment,
  authenticateRequest,
  hasRole,
} from "../_shared/business-logic.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function getSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = getSupabase();
  const url = new URL(req.url);
  const pathParts = url.pathname.split("/").filter(Boolean);
  // Path: /api/{resource}/{action}
  const resource = pathParts[pathParts.length - 2] || "";
  const action = pathParts[pathParts.length - 1] || "";

  // Authenticate
  const auth = await authenticateRequest(supabase, req.headers.get("Authorization"));
  if (auth.error) return jsonResponse({ error: auth.error }, 401);
  const userId = auth.userId!;

  try {
    // ─── BILLS ──────────────────────────────────────────────────
    if (resource === "bills") {
      if (action === "create" && req.method === "POST") {
        const body = await req.json();
        const { customer_id, month, amount, due_date, status = "unpaid" } = body;

        const { data: bill, error } = await supabase
          .from("bills")
          .insert({ customer_id, month, amount, due_date, status })
          .select()
          .single();
        if (error) throw error;

        // Business logic: create ledger entry
        await createBillLedgerEntry(supabase, bill);

        return jsonResponse({ success: true, bill });
      }

      if (action === "generate" && req.method === "POST") {
        const { month } = await req.json();

        const { data: customers, error: custErr } = await supabase
          .from("customers")
          .select("id, name, phone, monthly_bill, due_date_day")
          .eq("status", "active");
        if (custErr) throw custErr;

        if (!customers?.length) return jsonResponse({ message: "No active customers", generated: 0 });

        const { data: existing } = await supabase.from("bills").select("customer_id").eq("month", month);
        const existingIds = new Set(existing?.map((b: any) => b.customer_id));

        const newBillData = customers
          .filter((c: any) => !existingIds.has(c.id))
          .map((c: any) => {
            const dueDay = c.due_date_day || 15;
            const monthDate = new Date(month + "-01");
            const dueDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), dueDay);
            return {
              customer_id: c.id,
              month,
              amount: c.monthly_bill,
              status: "unpaid",
              due_date: dueDate.toISOString().split("T")[0],
            };
          });

        if (!newBillData.length) return jsonResponse({ message: "All bills already generated", generated: 0 });

        const { data: insertedBills, error } = await supabase.from("bills").insert(newBillData).select();
        if (error) throw error;

        // Business logic: create ledger entries for each bill
        for (const bill of insertedBills || []) {
          await createBillLedgerEntry(supabase, bill);
        }

        // Send SMS notifications
        const smsUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-sms`;
        for (const cust of customers.filter((c: any) => !existingIds.has(c.id))) {
          fetch(smsUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: cust.phone,
              message: `Dear ${cust.name}, your internet bill for ${month} is ${cust.monthly_bill} BDT. Please pay before the due date to avoid service suspension.`,
              sms_type: "bill_generate",
              customer_id: cust.id,
            }),
          }).catch(() => {});
        }

        return jsonResponse({ success: true, generated: newBillData.length, month });
      }

      if (action === "update" && req.method === "POST") {
        const { id, ...updates } = await req.json();
        const { error } = await supabase.from("bills").update(updates).eq("id", id);
        if (error) throw error;
        return jsonResponse({ success: true });
      }

      if (action === "delete" && req.method === "POST") {
        const { id } = await req.json();
        // Delete related ledger entry
        await supabase.from("customer_ledger").delete().like("reference", `BILL-${id.substring(0, 8)}`);
        const { error } = await supabase.from("bills").delete().eq("id", id);
        if (error) throw error;
        return jsonResponse({ success: true });
      }

      if (action === "mark-paid" && req.method === "POST") {
        const { id } = await req.json();
        const { error } = await supabase
          .from("bills")
          .update({ status: "paid", paid_date: new Date().toISOString() })
          .eq("id", id);
        if (error) throw error;
        return jsonResponse({ success: true });
      }
    }

    // ─── PAYMENTS ───────────────────────────────────────────────
    if (resource === "payments") {
      if (action === "create" && req.method === "POST") {
        const body = await req.json();

        const { data: payment, error } = await supabase
          .from("payments")
          .insert(body)
          .select()
          .single();
        if (error) throw error;

        // Business logic: create ledger entry + handle reactivation
        await createPaymentLedgerEntry(supabase, payment);
        await handlePaymentReactivation(supabase, payment);

        return jsonResponse({ success: true, payment });
      }

      if (action === "update" && req.method === "POST") {
        const { id, ...updates } = await req.json();
        const { error } = await supabase.from("payments").update(updates).eq("id", id);
        if (error) throw error;
        return jsonResponse({ success: true });
      }

      if (action === "delete" && req.method === "POST") {
        const { id, transaction_id } = await req.json();
        const ref = transaction_id ? `TXN-${transaction_id}` : `PAY-${id.substring(0, 8)}`;
        await supabase.from("customer_ledger").delete().eq("reference", ref);
        const { error } = await supabase.from("payments").delete().eq("id", id);
        if (error) throw error;
        return jsonResponse({ success: true });
      }
    }

    // ─── MERCHANT PAYMENTS ──────────────────────────────────────
    if (resource === "merchant-payments") {
      if (action === "create" && req.method === "POST") {
        const body = await req.json();

        // Check for duplicate
        const { data: existing } = await supabase
          .from("merchant_payments")
          .select("id")
          .eq("transaction_id", body.transaction_id)
          .maybeSingle();

        if (existing) return jsonResponse({ error: "Duplicate Transaction ID" }, 400);

        // Insert the payment
        const { data: mp, error } = await supabase
          .from("merchant_payments")
          .insert({
            transaction_id: body.transaction_id,
            sender_phone: body.sender_phone,
            amount: body.amount,
            reference: body.reference || null,
            payment_date: body.payment_date || new Date().toISOString(),
            sms_text: body.sms_text || null,
          })
          .select()
          .single();
        if (error) throw error;

        // Business logic: auto-match
        const matchResult = await autoMatchMerchantPayment(supabase, mp);

        // Update the merchant payment with match result
        await supabase.from("merchant_payments").update({
          status: matchResult.status,
          matched_customer_id: matchResult.matched_customer_id || null,
          matched_bill_id: matchResult.matched_bill_id || null,
          notes: matchResult.notes || null,
        }).eq("id", mp.id);

        return jsonResponse({ success: true, match_status: matchResult.status });
      }

      if (action === "match" && req.method === "POST") {
        const { payment_id, bill_id, customer_id } = await req.json();

        const { data: bill } = await supabase.from("bills").select("month").eq("id", bill_id).single();
        const { data: mp } = await supabase.from("merchant_payments").select("amount, transaction_id, payment_date").eq("id", payment_id).single();

        if (!bill || !mp) return jsonResponse({ error: "Bill or payment not found" }, 404);

        // Mark bill as paid
        await supabase.from("bills").update({ status: "paid", paid_date: new Date().toISOString() }).eq("id", bill_id);

        // Create payment record + ledger + reactivation
        const { data: payment } = await supabase.from("payments").insert({
          customer_id,
          bill_id,
          amount: mp.amount,
          payment_method: "bkash_merchant",
          transaction_id: mp.transaction_id,
          status: "completed",
          paid_at: mp.payment_date,
          month: bill.month,
        }).select().single();

        if (payment) {
          await createPaymentLedgerEntry(supabase, payment);
          await handlePaymentReactivation(supabase, { customer_id, bill_id, status: "completed" });
        }

        // Update merchant payment
        await supabase.from("merchant_payments").update({
          status: "matched",
          matched_customer_id: customer_id,
          matched_bill_id: bill_id,
          notes: "Manually matched by admin",
        }).eq("id", payment_id);

        return jsonResponse({ success: true });
      }
    }

    // ─── CUSTOMERS ──────────────────────────────────────────────
    if (resource === "customers") {
      if (action === "create" && req.method === "POST") {
        const body = await req.json();

        // Business logic: generate customer ID
        const customerId = await generateCustomerId(supabase);
        body.customer_id = customerId;

        const { data, error } = await supabase
          .from("customers")
          .insert(body)
          .select()
          .single();
        if (error) throw error;

        return jsonResponse({ success: true, customer: data });
      }
    }

    // ─── TICKETS ────────────────────────────────────────────────
    if (resource === "tickets") {
      if (action === "create" && req.method === "POST") {
        const body = await req.json();

        // Business logic: generate ticket ID
        const ticketId = await generateTicketId(supabase);

        const { data, error } = await supabase
          .from("support_tickets")
          .insert({
            customer_id: body.customer_id,
            subject: body.subject,
            category: body.category || "general",
            priority: body.priority || "medium",
            ticket_id: ticketId,
          })
          .select()
          .single();
        if (error) throw error;

        // Add initial message as reply if provided
        if (body.message) {
          await supabase.from("ticket_replies").insert({
            ticket_id: data.id,
            sender_type: body.sender_type || "customer",
            sender_name: body.sender_name || "Customer",
            message: body.message,
          });
        }

        return jsonResponse({ success: true, ticket: data });
      }
    }

    return jsonResponse({ error: "Not found" }, 404);
  } catch (err: any) {
    console.error("API error:", err);
    return jsonResponse({ error: err.message || "Internal server error" }, 500);
  }
});
