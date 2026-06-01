import { createClient } from "npm:@supabase/supabase-js@2";
import { createHmac, timingSafeEqual } from "node:crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-razorpay-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

function planDays(billing?: string): number {
  return billing === "yearly" ? 365 : 30;
}

async function applySubscription(sub: any) {
  const notes = (sub.notes ?? {}) as Record<string, string>;
  const userId = notes.user_id;
  if (!userId) return;
  const status = sub.status as string;
  // current_end is unix seconds for next charge / period end
  const currentEnd = sub.current_end ? new Date(sub.current_end * 1000) : null;
  // charge_at is when the next charge is scheduled
  const chargeAt = sub.charge_at ? new Date(sub.charge_at * 1000) : null;
  const periodEnd = currentEnd ?? chargeAt ?? new Date(Date.now() + planDays(notes.billing) * 24 * 3600 * 1000);

  const activeStatuses = new Set(["active", "authenticated", "pending"]);
  const endStatuses = new Set(["cancelled", "completed", "expired", "halted"]);

  if (activeStatuses.has(status)) {
    await admin.from("profiles").update({
      subscription_tier: "growth",
      subscription_expires_at: periodEnd.toISOString(),
      subscription_status: status,
      razorpay_subscription_id: sub.id,
      subscription_plan: notes.billing ?? null,
    }).eq("user_id", userId);
  } else if (endStatuses.has(status)) {
    await admin.from("profiles").update({
      subscription_tier: "starter",
      subscription_expires_at: null,
      subscription_status: status,
    }).eq("user_id", userId);
  }
}

async function notifyActivated(userId: string, expiresAt: Date) {
  await admin.from("notifications").insert({
    user_id: userId,
    title: "Growth plan activated",
    body: `Your Growth plan is active. Next billing on ${expiresAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}.`,
    kind: "billing",
    link: "/pricing",
    metadata: { expires_at: expiresAt.toISOString() },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  const sig = req.headers.get("x-razorpay-signature");
  if (!sig) return new Response("missing signature", { status: 400, headers: corsHeaders });
  const secret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");
  if (!secret) return new Response("webhook secret not set", { status: 500, headers: corsHeaders });

  const raw = await req.text();
  const expected = createHmac("sha256", secret).update(raw).digest("hex");
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(sig, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return new Response("invalid signature", { status: 400, headers: corsHeaders });
  }

  let event: any;
  try { event = JSON.parse(raw); } catch {
    return new Response("invalid json", { status: 400, headers: corsHeaders });
  }

  try {
    const type = event.event as string;
    const sub = event.payload?.subscription?.entity;
    const payment = event.payload?.payment?.entity;

    switch (type) {
      case "subscription.activated":
      case "subscription.charged":
      case "subscription.updated":
      case "subscription.pending":
      case "subscription.resumed": {
        if (sub) {
          await applySubscription(sub);
          const notes = (sub.notes ?? {}) as Record<string, string>;
          if (type === "subscription.activated" && notes.user_id) {
            const exp = sub.current_end ? new Date(sub.current_end * 1000) : new Date(Date.now() + planDays(notes.billing) * 24 * 3600 * 1000);
            await notifyActivated(notes.user_id, exp);
          }
        }
        break;
      }
      case "subscription.cancelled":
      case "subscription.completed":
      case "subscription.expired": {
        if (sub) {
          await applySubscription(sub);
          const notes = (sub.notes ?? {}) as Record<string, string>;
          if (notes.user_id) {
            await admin.from("notifications").insert({
              user_id: notes.user_id,
              title: type === "subscription.completed" ? "Subscription completed" : "Subscription ended",
              body: type === "subscription.completed"
                ? "Your Growth plan has completed all billing cycles. You're back on Starter — renew anytime from Pricing."
                : "Your Growth subscription has ended. You're back on Starter — you can resubscribe from Pricing.",
              kind: "billing",
              link: "/pricing",
            });
          }
        }
        break;
      }
      case "subscription.halted": {
        if (sub) {
          await applySubscription(sub);
          const notes = (sub.notes ?? {}) as Record<string, string>;
          if (notes.user_id) {
            await admin.from("notifications").insert({
              user_id: notes.user_id,
              title: "Payment failed — subscription halted",
              body: "We couldn't charge your card/UPI for your Growth plan. Please update your payment method in Pricing to keep your benefits.",
              kind: "billing",
              link: "/pricing",
            });
          }
        }
        break;
      }
      case "subscription.paused": {
        if (sub) {
          const notes = (sub.notes ?? {}) as Record<string, string>;
          if (notes.user_id) {
            await admin.from("profiles").update({ subscription_status: "paused" }).eq("user_id", notes.user_id);
          }
        }
        break;
      }
      case "payment.failed": {
        // Notify the user if we can attribute it to a subscription
        const subId = payment?.subscription_id as string | undefined;
        if (subId) {
          const { data: profile } = await admin
            .from("profiles")
            .select("user_id")
            .eq("razorpay_subscription_id", subId)
            .maybeSingle();
          if (profile?.user_id) {
            await admin.from("notifications").insert({
              user_id: profile.user_id,
              title: "Payment attempt failed",
              body: "Razorpay couldn't complete a charge for your Growth plan. We'll retry — if it keeps failing your plan may be halted.",
              kind: "billing",
              link: "/pricing",
            });
          }
        }
        break;
      }
      case "payment.captured":
        // Subscription captures are handled by subscription.charged.
        // Standalone order payments are activated synchronously in razorpay-verify.
        break;
    }
  } catch (err) {
    console.error("webhook handler error", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
