import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Expire active/pending sessions older than 24 hours
    const { data: expiredSessions, error: selectError } = await supabase
      .from("admin_sessions")
      .select("id, admin_id")
      .in("status", ["active", "pending"])
      .lt("created_at", cutoff);

    if (selectError) throw selectError;

    if (expiredSessions && expiredSessions.length > 0) {
      const ids = expiredSessions.map((s: any) => s.id);

      const { error: updateError } = await supabase
        .from("admin_sessions")
        .update({ status: "expired", updated_at: new Date().toISOString() })
        .in("id", ids);

      if (updateError) throw updateError;

      // Log each expiry
      const logs = expiredSessions.map((s: any) => ({
        admin_id: s.admin_id,
        action: "session_auto_expired",
        session_id: s.id,
      }));

      await supabase.from("admin_login_logs").insert(logs);
    }

    return new Response(
      JSON.stringify({
        success: true,
        expired_count: expiredSessions?.length || 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
