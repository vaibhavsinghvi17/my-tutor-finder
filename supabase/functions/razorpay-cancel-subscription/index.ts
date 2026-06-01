import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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

    const body = await req.json().catch(() => ({}));
    const cancelAtCycleEnd = body?.cancel_at_cycle_end !== false; // default true

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: profile } = await admin
      .from("profiles")
      .select("razorpay_subscription_id, subscription_tier")
      .eq("user_id", userId)
      .maybeSingle();

    if (!profile?.razorpay_subscription_id) {
      // Nothing to cancel on Razorpay's side; just ensure local state is starter.
      await admin.from("profiles").update({
        subscription_tier: "starter",
        subscription_expires_at: null,
        subscription_status: "cancelled",
      }).eq("user_id", userId);
      return new Response(JSON.stringify({ ok: true, type: "local_only" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const keyId = Deno.env.get("RAZORPAY_KEY_ID")!;
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET")!;
    const basicAuth = "Basic " + btoa(`${keyId}:${keySecret}`);

    const resp = await fetch(
      `https://api.razorpay.com/v1/subscriptions/${profile.razorpay_subscription_id}/cancel`,
      {
        method: "POST",
        headers: { Authorization: basicAuth, "Content-Type": "application/json" },
        body: JSON.stringify({ cancel_at_cycle_end: cancelAtCycleEnd ? 1 : 0 }),
      },
    );
    const sub = await resp.json();
    if (!resp.ok) {
      console.error("Razorpay cancel failed", sub);
      return new Response(JSON.stringify({ error: sub?.error?.description || "Cancel failed" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Reflect status locally. If cancel-at-cycle-end, the user keeps access until current_end.
    const currentEnd = sub.current_end ? new Date(sub.current_end * 1000).toISOString() : null;
    await admin.from("profiles").update({
      subscription_status: sub.status,
      ...(cancelAtCycleEnd
        ? { subscription_expires_at: currentEnd }
        : { subscription_tier: "starter", subscription_expires_at: null }),
    }).eq("user_id", userId);

    await admin.from("notifications").insert({
      user_id: userId,
      title: "Subscription cancelled",
      body: cancelAtCycleEnd
        ? `Your Growth plan will stay active until ${currentEnd ? new Date(currentEnd).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "the end of the current cycle"}, then switch to Starter.`
        : "Your Growth plan has been cancelled and you're back on Starter.",
      kind: "billing",
      link: "/pricing",
    });

    return new Response(JSON.stringify({ ok: true, status: sub.status, current_end: currentEnd }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("cancel error", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
