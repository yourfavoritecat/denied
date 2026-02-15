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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify caller is admin using their JWT
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await anonClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Check caller is admin
    const { data: adminRole } = await adminClient
      .from("user_roles")
      .select("id")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!adminRole) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { user_id } = await req.json();
    if (!user_id) {
      return new Response(JSON.stringify({ error: "user_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Don't allow deleting admins
    const { data: targetAdmin } = await adminClient
      .from("user_roles")
      .select("id")
      .eq("user_id", user_id)
      .eq("role", "admin")
      .maybeSingle();

    if (targetAdmin) {
      return new Response(JSON.stringify({ error: "Cannot delete admin users" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get creator profile ids for this user
    const { data: creatorProfiles } = await adminClient
      .from("creator_profiles")
      .select("id")
      .eq("user_id", user_id);

    const creatorIds = (creatorProfiles || []).map((p: any) => p.id);

    // Delete in order
    if (creatorIds.length > 0) {
      await adminClient.from("creator_content").delete().in("creator_id", creatorIds);
    }
    await adminClient.from("creator_profiles").delete().eq("user_id", user_id);
    await adminClient.from("creator_invite_codes").update({ claimed_by: null }).eq("claimed_by", user_id);
    await adminClient.from("user_roles").delete().eq("user_id", user_id);
    await adminClient.from("user_feed_posts").delete().eq("user_id", user_id);
    await adminClient.from("user_profile_extras").delete().eq("user_id", user_id);
    await adminClient.from("profiles").delete().eq("user_id", user_id);

    // Delete auth user
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user_id);
    if (deleteError) {
      return new Response(JSON.stringify({ error: deleteError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
