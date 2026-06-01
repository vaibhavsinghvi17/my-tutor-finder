import { createClient } from "npm:@supabase/supabase-js@2";
import { createHmac } from "node:crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function hmacHex(secret: string, payload: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

async function activateBoostFromOrder(admin: ReturnType<typeof createClient>, orderId: string) {
  const keyId = Deno.env.get("RAZORPAY_KEY_ID")!;
  const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET")!;
  const basicAuth = "Basic " + btoa(`${keyId}:${keySecret}`);
  const r = await fetch(`https://api.razorpay.com/v1/orders/${orderId}`, {
    headers: { Authorization: basicAuth },
  });
  const order = await r.json();
  if (!r.ok) throw new Error("Order fetch failed");
  const notes = (order.notes ?? {}) as Record<string, string>;
  if (notes.purpose !== "boost" || !notes.listingId || !notes.user_id || !notes.durationDays) return;
  const days = parseInt(notes.durationDays, 10);
  if (!Number.isFinite(days) || days <= 0) return;
  const expiresAt = new Date(Date.now() + days * 24 * 3600 * 1000).toISOString();
  await admin.from("boosts").insert({
    listing_id: notes.listingId,
    provider_user_id: notes.user_id,
    city: notes.city ?? null,
    category: notes.category ?? null,
    age_group: notes.ageGroup ?? null,
    gender: notes.gender ?? null,
    expires_at: expiresAt,
  });
}

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

    const body = await req.json();
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_subscription_id,
      razorpay_signature,
    } = body ?? {};

    if (!razorpay_payment_id || !razorpay_signature) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const secret = Deno.env.get("RAZORPAY_KEY_SECRET")!;
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    if (razorpay_subscription_id) {
      // Subscription verification: HMAC(payment_id + "|" + subscription_id)
      const expected = hmacHex(secret, `${razorpay_payment_id}|${razorpay_subscription_id}`);
      if (expected !== razorpay_signature) {
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Webhook will set tier/expiry authoritatively; mark status optimistically.
      await admin.from("profiles")
        .update({ subscription_status: "authenticated" })
        .eq("user_id", userId)
        .eq("razorpay_subscription_id", razorpay_subscription_id);

      return new Response(JSON.stringify({ ok: true, type: "subscription" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (razorpay_order_id) {
      // Order verification: HMAC(order_id + "|" + payment_id)
      const expected = hmacHex(secret, `${razorpay_order_id}|${razorpay_payment_id}`);
      if (expected !== razorpay_signature) {
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      await activateBoostFromOrder(admin, razorpay_order_id);
      return new Response(JSON.stringify({ ok: true, type: "order" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Missing order or subscription id" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("verify error", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
