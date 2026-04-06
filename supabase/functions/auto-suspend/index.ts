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

    const todayStr = new Date().toISOString().split("T")[0];

    // Find overdue unpaid bills — paginate to avoid 1000-row limit
    let allBills: any[] = [];
    let from = 0;
    const pageSize = 500;
    while (true) {
      const { data, error } = await supabase
        .from("bills")
        .select("id, month, customer_id, customers(id, name, phone, pppoe_username, router_id, connection_status, tenant_id)")
        .eq("status", "unpaid")
        .lt("due_date", todayStr)
        .range(from, from + pageSize - 1);
      if (error) throw error;
      if (!data?.length) break;
      allBills = allBills.concat(data);
      if (data.length < pageSize) break;
      from += pageSize;
    }

    let suspended = 0;
    let skipped = 0;
    const errors: string[] = [];
    const processed = new Set<string>();

    for (const bill of allBills) {
      const cust = bill.customers;
      if (!cust || processed.has(cust.id)) continue;
      processed.add(cust.id);

      // Skip already suspended customers
      if (cust.connection_status === "suspended") {
        skipped++;
        continue;
      }

      try {
        // Suspend via MikroTik if PPPoE credentials exist
        if (cust.pppoe_username && cust.router_id) {
          try {
            const resp = await fetch(`${supabaseUrl}/functions/v1/mikrotik-sync`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${anonKey}`,
              },
              body: JSON.stringify({
                action: "disable-pppoe",
                pppoe_username: cust.pppoe_username,
                router_id: cust.router_id,
                customer_id: cust.id,
              }),
            });
            await resp.text(); // consume body
          } catch (e: any) {
            console.error(`[AutoSuspend] MikroTik failed for ${cust.name}: ${e.message}`);
          }
        }

        // Always update status in DB
        await supabase.from("customers").update({
          connection_status: "suspended",
          status: "suspended",
          updated_at: new Date().toISOString(),
        }).eq("id", cust.id);

        // Send suspension SMS (fire and forget)
        if (cust.phone) {
          fetch(`${supabaseUrl}/functions/v1/send-sms`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${anonKey}`,
            },
            body: JSON.stringify({
              to: cust.phone,
              message: `Dear ${cust.name}, your internet service has been suspended due to non-payment. Please pay your outstanding bill to restore service.`,
              sms_type: "suspension",
              customer_id: cust.id,
              tenant_id: cust.tenant_id || null,
            }),
          }).catch(() => {});
        }

        // Log the suspension
        await supabase.from("reminder_logs").insert({
          phone: cust.phone || "",
          message: `Auto-suspended: overdue bill for ${bill.month}`,
          channel: "system",
          status: "sent",
          customer_id: cust.id,
        });

        suspended++;
      } catch (e: any) {
        errors.push(`${cust.name}: ${e.message}`);
      }
    }

    console.log(`[AutoSuspend] Done: suspended=${suspended}, skipped=${skipped}, errors=${errors.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        suspended_count: suspended,
        skipped_already_suspended: skipped,
        total_overdue_bills: allBills.length,
        ...(errors.length ? { warnings: errors.slice(0, 10) } : {}),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error(`[AutoSuspend] Unhandled: ${error.message}`);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
