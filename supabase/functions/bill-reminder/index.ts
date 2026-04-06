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
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";

    let body: any = {};
    try { body = await req.json(); } catch { /* cron calls with empty body */ }
    const action = body.action || "check-reminders";

    if (action !== "check-reminders") {
      return new Response(
        JSON.stringify({ error: "Unknown action. Use 'check-reminders'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if reminders are enabled
    const { data: smsSettings } = await supabase
      .from("sms_settings")
      .select("sms_on_reminder")
      .limit(1)
      .maybeSingle();
    
    if (smsSettings?.sms_on_reminder === false) {
      return new Response(
        JSON.stringify({ success: true, message: "SMS reminders are disabled", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const today = new Date();
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    const in5Days = new Date(today); in5Days.setDate(today.getDate() + 5);

    const todayStr = today.toISOString().split("T")[0];
    const tomorrowStr = tomorrow.toISOString().split("T")[0];
    const in5DaysStr = in5Days.toISOString().split("T")[0];

    // Get unpaid bills with due dates — paginate
    let allBills: any[] = [];
    let from = 0;
    const pageSize = 500;
    while (true) {
      const { data, error } = await supabase
        .from("bills")
        .select("id, amount, month, due_date, customer_id, customers(name, phone, id, tenant_id)")
        .eq("status", "unpaid")
        .not("due_date", "is", null)
        .range(from, from + pageSize - 1);
      if (error) throw error;
      if (!data?.length) break;
      allBills = allBills.concat(data);
      if (data.length < pageSize) break;
      from += pageSize;
    }

    let sent = 0;
    let skipped = 0;
    const dailyLimit = 200; // safety cap per run

    for (const bill of allBills) {
      if (sent >= dailyLimit) {
        console.log(`[BillReminder] Daily limit reached (${dailyLimit}), stopping.`);
        break;
      }
      if (!bill.customers?.phone) { skipped++; continue; }

      const dueDate = bill.due_date;
      let smsType = "";
      let message = "";
      const customerName = bill.customers.name;
      const amount = bill.amount;
      const month = bill.month;

      if (dueDate === tomorrowStr) {
        smsType = "bill_reminder";
        message = `Reminder: Your internet bill of ${amount} BDT is due tomorrow (${dueDate}). Please pay to avoid service suspension.`;
      } else if (dueDate === in5DaysStr) {
        smsType = "bill_reminder";
        message = `Dear ${customerName}, your internet bill of ${amount} BDT for ${month} is due in 5 days. Please pay to avoid service interruption.`;
      } else if (dueDate === todayStr) {
        smsType = "due_date";
        message = `Dear ${customerName}, your internet bill of ${amount} BDT for ${month} is due today. Please pay immediately to avoid service suspension.`;
      } else if (dueDate < todayStr) {
        smsType = "overdue";
        message = `Dear ${customerName}, your internet bill of ${amount} BDT for ${month} is overdue. Your service may be suspended. Please pay immediately.`;
      }

      if (smsType && message) {
        try {
          const resp = await fetch(`${supabaseUrl}/functions/v1/send-sms`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${anonKey}`,
            },
            body: JSON.stringify({
              to: bill.customers.phone,
              message,
              sms_type: smsType,
              customer_id: bill.customers.id,
              tenant_id: bill.customers.tenant_id || null,
            }),
          });
          await resp.text(); // consume body
          sent++;
        } catch (e: any) {
          console.error(`[BillReminder] SMS failed for ${customerName}: ${e.message}`);
        }
      }
    }

    console.log(`[BillReminder] Done: sent=${sent}, skipped=${skipped}, total_bills=${allBills.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        reminders_sent: sent,
        skipped_no_phone: skipped,
        total_unpaid_bills: allBills.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error(`[BillReminder] Unhandled: ${error.message}`);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
