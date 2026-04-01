import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import bcryptjs from "npm:bcryptjs@2.4.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Generate proper hash
    const hash = bcryptjs.hashSync("admin123", 10);
    console.log("Generated hash:", hash);

    // Update the super admin password
    const { error } = await supabase
      .from("super_admins")
      .update({ password_hash: hash, failed_attempts: 0, locked_until: null })
      .eq("username", "superadmin");

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Verify it works
    const verified = bcryptjs.compareSync("admin123", hash);

    return new Response(JSON.stringify({ 
      success: true, 
      verified,
      hash_prefix: hash.substring(0, 10) 
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (err: unknown) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
