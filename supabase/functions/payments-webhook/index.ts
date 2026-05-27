import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

async function activateGrowth(userId: string, periodEndUnix: number | null) {
  const expiresAt = periodEndUnix ? new Date(periodEndUnix * 1000).toISOString() : null;
  await supabase
    .from("profiles")
    .update({ subscription_tier: "growth", subscription_expires_at: expiresAt })
    .eq("user_id", userId);
}

async function downgradeStarter(userId: string) {
  await supabase
    .from("profiles")
    .update({ subscription_tier: "starter", subscription_expires_at: null })
    .eq("user_id", userId);
}

async function createBoostFromMetadata(meta: Record<string, string>) {
  if (meta.purpose !== "boost" || !meta.listingId || !meta.userId || !meta.durationDays) return;
  const days = parseInt(meta.durationDays, 10);
  if (!Number.isFinite(days) || days <= 0) return;
  const expiresAt = new Date(Date.now() + days * 24 * 3600 * 1000).toISOString();
  await supabase.from("boosts").insert({
    listing_id: meta.listingId,
    provider_user_id: meta.userId,
    city: meta.city ?? null,
    category: meta.category ?? null,
    age_group: meta.ageGroup ?? null,
    gender: meta.gender ?? null,
    expires_at: expiresAt,
  });
}

async function extendGrowthFromMetadata(meta: Record<string, string>) {
  if (meta.purpose !== "growth" || !meta.userId || !meta.durationDays) return;
  const days = parseInt(meta.durationDays, 10);
  if (!Number.isFinite(days) || days <= 0) return;

  // If the user still has time left, add to it; otherwise start from now.
  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_expires_at")
    .eq("user_id", meta.userId)
    .maybeSingle();
  const currentExpiry = profile?.subscription_expires_at
    ? new Date(profile.subscription_expires_at as string)
    : null;
  const base = currentExpiry && currentExpiry > new Date() ? currentExpiry : new Date();
  const newExpiry = new Date(base.getTime() + days * 24 * 3600 * 1000);

  await supabase
    .from("profiles")
    .update({
      subscription_tier: "growth",
      subscription_expires_at: newExpiry.toISOString(),
    })
    .eq("user_id", meta.userId);

  // Confirmation notification
  await supabase.from("notifications").insert({
    user_id: meta.userId,
    title: "Growth plan activated",
    body: `Your Growth plan is active until ${newExpiry.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}. No auto-debit — we'll remind you 3 days before it ends.`,
    kind: "billing",
    link: "/pricing",
    metadata: { expires_at: newExpiry.toISOString(), purpose: "growth_activated" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  const env = (url.searchParams.get("env") === "live" ? "live" : "sandbox") as StripeEnv;
  const secretName = env === "live" ? "PAYMENTS_LIVE_WEBHOOK_SECRET" : "PAYMENTS_SANDBOX_WEBHOOK_SECRET";
  const webhookSecret = Deno.env.get(secretName);
  if (!webhookSecret) {
    return new Response("webhook secret not configured", { status: 500, headers: corsHeaders });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) return new Response("missing signature", { status: 400, headers: corsHeaders });

  const stripe = createStripeClient(env);
  const raw = await req.text();
  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(raw, sig, webhookSecret);
  } catch (err) {
    console.error("signature verify failed", err);
    return new Response("invalid signature", { status: 400, headers: corsHeaders });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;
        const meta = (session.metadata ?? {}) as Record<string, string>;
        // Persist Stripe customer ID on profile
        if (meta.userId && session.customer) {
          await supabase
            .from("profiles")
            .update({ stripe_customer_id: session.customer })
            .eq("user_id", meta.userId);
        }
        // One-off purchases (boosts + growth top-up)
        if (session.mode === "payment" && session.payment_status === "paid") {
          await createBoostFromMetadata(meta);
          await extendGrowthFromMetadata(meta);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as any;
        const meta = (sub.metadata ?? {}) as Record<string, string>;
        const userId = meta.userId;
        if (!userId) break;
        const status = sub.status;
        const periodEnd = sub.current_period_end ?? sub.items?.data?.[0]?.current_period_end ?? null;
        if (status === "active" || status === "trialing" || status === "past_due") {
          await activateGrowth(userId, periodEnd);
        } else if (status === "canceled" || status === "unpaid" || status === "incomplete_expired") {
          await downgradeStarter(userId);
        }
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as any;
        const userId = (sub.metadata ?? {}).userId;
        if (userId) await downgradeStarter(userId);
        break;
      }
    }
  } catch (err) {
    console.error("webhook handler error", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
