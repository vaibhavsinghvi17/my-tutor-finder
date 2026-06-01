import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Server-side price catalog (paise)
const PRICES: Record<string, number> = {
  boost_starter_3d: 50000,  // ₹500
  boost_growth_7d: 50000,   // ₹500
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
    const priceId = String(body?.priceId ?? "");
    if (!(priceId in PRICES)) {
      return new Response(JSON.stringify({ error: "Invalid priceId" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const amount = PRICES[priceId];

    const notes: Record<string, string> = {
      user_id: userId,
      purpose: String(body?.purpose ?? "").slice(0, 64),
      price_id: priceId,
    };
    for (const k of ["listingId", "durationDays", "city", "category", "ageGroup", "gender"]) {
      if (body?.[k] != null) notes[k] = String(body[k]).slice(0, 256);
    }

    const keyId = Deno.env.get("RAZORPAY_KEY_ID")!;
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET")!;
    const basicAuth = "Basic " + btoa(`${keyId}:${keySecret}`);

    const resp = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { Authorization: basicAuth, "Content-Type": "application/json" },
      body: JSON.stringify({
        amount,
        currency: "INR",
        receipt: `r_${Date.now()}_${userId.slice(0, 8)}`,
        notes,
      }),
    });
    const order = await resp.json();
    if (!resp.ok) {
      console.error("Razorpay order create failed", order);
      return new Response(JSON.stringify({ error: order?.error?.description || "Failed to create order" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      order_id: order.id,
      amount,
      currency: "INR",
      key_id: keyId,
      email,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("create-order error", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
