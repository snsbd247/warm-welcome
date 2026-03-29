import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import bcryptjs from "https://esm.sh/bcryptjs@2.4.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { pppoe_username, pppoe_password } = await req.json();

    if (!pppoe_username || !pppoe_password) {
      return jsonResponse({ error: "PPPoE username and password are required" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
      return jsonResponse({ error: "Server configuration error" }, 500);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find customer by pppoe_username
    const { data: customer, error } = await supabase
      .from("customers")
      .select(
        "id, customer_id, name, phone, area, road, house, city, email, package_id, monthly_bill, ip_address, pppoe_username, pppoe_password_hash, onu_mac, router_mac, installation_date, status, username, father_name, mother_name, occupation, nid, alt_phone, permanent_address, gateway, subnet, discount, connectivity_fee, due_date_day, photo_url"
      )
      .eq("pppoe_username", pppoe_username)
      .maybeSingle();

    if (error) {
      console.error("DB query error:", error.message);
      return jsonResponse({ error: "Internal server error" }, 500);
    }

    if (!customer) {
      return jsonResponse({ error: "Invalid PPPoE username or password" }, 401);
    }

    // Compare password using bcrypt hash
    const storedHash = customer.pppoe_password_hash;
    if (!storedHash) {
      return jsonResponse(
        { error: "Account requires password reset. Please contact support." },
        401
      );
    }

    let passwordValid = false;
    try {
      passwordValid = bcryptjs.compareSync(pppoe_password, storedHash);
    } catch (e) {
      console.error("bcrypt compare error:", e);
      return jsonResponse({ error: "Internal server error" }, 500);
    }

    if (!passwordValid) {
      return jsonResponse({ error: "Invalid PPPoE username or password" }, 401);
    }

    if (customer.status === "disconnected") {
      return jsonResponse(
        { error: "Your account has been disconnected. Please contact support." },
        403
      );
    }

    // Create a session token
    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();

    // Invalidate existing sessions
    await supabase
      .from("customer_sessions")
      .delete()
      .eq("customer_id", customer.id);

    // Insert new session
    const { error: sessionError } = await supabase
      .from("customer_sessions")
      .insert({
        customer_id: customer.id,
        session_token: sessionToken,
        expires_at: expiresAt,
      });

    if (sessionError) {
      console.error("Session creation failed:", sessionError);
      return jsonResponse({ error: "Internal server error" }, 500);
    }

    const safeCustomer = {
      id: customer.id,
      customer_id: customer.customer_id,
      name: customer.name,
      phone: customer.phone,
      area: customer.area,
      status: customer.status,
      monthly_bill: customer.monthly_bill,
      package_id: customer.package_id,
      photo_url: customer.photo_url,
    };

    return jsonResponse({
      customer: safeCustomer,
      session_token: sessionToken,
      expires_at: expiresAt,
    });
  } catch (err) {
    console.error("Unhandled error:", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
