import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PLAN_IDS: Record<string, { plan_id: string; total_count: number; days: number }> = {
  monthly: { plan_id: "plan_SwK7XY1tBo79Tz", total_count: 12, days: 30 },
  yearly: { plan_id: "plan_SwKBUXG4fc1aKv", total_count: 3, days: 365 },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: authErr } = await supabase.auth.getClaims(token);
    if (authErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claims.claims.sub as string;
    const email = (claims.claims as any).email as string | undefined;

    const body = await req.json();
    const billing = body?.billing === "yearly" ? "yearly" : "monthly";
    const plan = PLAN_IDS[billing];

    const keyId = Deno.env.get("RAZORPAY_KEY_ID")!;
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET")!;
    const basicAuth = "Basic " + btoa(`${keyId}:${keySecret}`);

    const rzpResp = await fetch("https://api.razorpay.com/v1/subscriptions", {
      method: "POST",
      headers: { Authorization: basicAuth, "Content-Type": "application/json" },
      body: JSON.stringify({
        plan_id: plan.plan_id,
        total_count: plan.total_count,
        customer_notify: 1,
        notes: { user_id: userId, billing, purpose: "growth" },
      }),
    });
    const sub = await rzpResp.json();
    if (!rzpResp.ok) {
      console.error("Razorpay subscription create failed", sub);
      return new Response(JSON.stringify({ error: sub?.error?.description || "Failed to create subscription" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Persist subscription id on profile (status will be filled in by webhook)
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    await admin
      .from("profiles")
      .update({
        razorpay_subscription_id: sub.id,
        subscription_plan: billing,
        subscription_status: sub.status,
      })
      .eq("user_id", userId);

    return new Response(JSON.stringify({
      subscription_id: sub.id,
      key_id: keyId,
      email,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("create-subscription error", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
