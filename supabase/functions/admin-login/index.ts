import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import bcryptjs from "https://esm.sh/bcryptjs@2.4.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return new Response(
        JSON.stringify({ error: "Username and password are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find profile by username
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, username, password_hash, email, status, full_name")
      .eq("username", username)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: "Invalid username or password" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check status
    if (profile.status === "disabled") {
      return new Response(
        JSON.stringify({ error: "Your account has been disabled. Please contact a super admin." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify bcrypt password
    if (!profile.password_hash) {
      return new Response(
        JSON.stringify({ error: "Account requires password setup. Please contact a super admin." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const passwordValid = bcryptjs.compareSync(password, profile.password_hash);
    if (!passwordValid) {
      return new Response(
        JSON.stringify({ error: "Invalid username or password" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check user has admin/staff role
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", profile.id);

    const hasAdminRole = roles?.some(
      (r: any) => r.role === "admin" || r.role === "super_admin" || r.role === "staff"
    );

    if (!hasAdminRole) {
      return new Response(
        JSON.stringify({ error: "You do not have admin access" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the auth user's email to allow Supabase Auth sign-in
    const { data: authUser } = await supabase.auth.admin.getUserById(profile.id);
    if (!authUser?.user?.email) {
      return new Response(
        JSON.stringify({ error: "Auth account not found" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Ensure Supabase Auth password is in sync
    await supabase.auth.admin.updateUser(profile.id, { password });

    return new Response(
      JSON.stringify({
        success: true,
        email: authUser.user.email,
        user_id: profile.id,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Admin login error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
