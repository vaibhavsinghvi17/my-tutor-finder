// Admin-only notification sender.
// Modes:
//  - action "preview": resolves the target audience and returns count + sample
//  - action "send"   : same resolve + writes notifications rows (optionally generates body via AI)
//  - action "ai-suggest": returns an AI-generated {title, body} for a given audience description
//  - action "auto-run" : generates per-user AI nudges for tutors / learners / engagement
//
// Filters:
//   role        : "tutor" | "learner" | "all"
//   cities      : string[] (case-insensitive match against profiles.city)
//   categories  : string[] (matched against boosts.category for tutors, listing_events.viewer_age_group ignored)
//   tier        : "starter" | "growth" | "all"
//   activity    : "all" | "inactive_30d" | "no_avatar" | "no_listings"

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};
const MODEL = "google/gemini-3-flash-preview";
const AI_ENDPOINT = "https://ai.gateway.lovable.dev/v1/chat/completions";

interface Filters {
  role?: "tutor" | "learner" | "all";
  cities?: string[];
  categories?: string[];
  tier?: "starter" | "growth" | "all";
  activity?: "all" | "inactive_30d" | "no_avatar" | "no_listings";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: userRes } = await userClient.auth.getUser();
    const caller = userRes?.user;
    if (!caller) return json({ error: "Not authenticated" }, 401);

    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) return json({ error: "Admins only" }, 403);

    const body = await req.json().catch(() => ({}));
    const action = String(body?.action ?? "send");

    if (action === "ai-suggest") {
      if (!LOVABLE_API_KEY) return json({ error: "LOVABLE_API_KEY not configured" }, 500);
      const { audience, intent } = body ?? {};
      const text = await aiGenerate(LOVABLE_API_KEY, audience ?? "all users", intent ?? "engagement");
      return json(text);
    }

    const filters: Filters = body?.filters ?? {};
    const userIds = await resolveAudience(admin, filters);

    if (action === "preview") {
      const sample = await admin
        .from("profiles")
        .select("user_id, display_name, city, subscription_tier, avatar_url")
        .in("user_id", userIds.slice(0, 10));
      return json({ count: userIds.length, sample: sample.data ?? [] });
    }

    if (action === "send") {
      const { title, body: msgBody, link, useAi, aiIntent } = body ?? {};
      let finalTitle = String(title ?? "").trim();
      let finalBody = String(msgBody ?? "").trim();

      if (useAi) {
        if (!LOVABLE_API_KEY) return json({ error: "LOVABLE_API_KEY not configured" }, 500);
        const audience = describeAudience(filters);
        const ai = await aiGenerate(LOVABLE_API_KEY, audience, aiIntent ?? "engagement");
        if (!finalTitle) finalTitle = ai.title;
        if (!finalBody) finalBody = ai.body;
      }
      if (!finalTitle) return json({ error: "Title required" }, 400);
      if (userIds.length === 0) return json({ error: "No matching users" }, 400);

      const rows = userIds.map((uid) => ({
        user_id: uid,
        title: finalTitle.slice(0, 160),
        body: finalBody?.slice(0, 600) || null,
        link: link?.toString().slice(0, 500) || null,
        kind: "admin",
        created_by: caller.id,
        metadata: { filters },
      }));

      // chunk insert to avoid payload limits
      let inserted = 0;
      for (let i = 0; i < rows.length; i += 500) {
        const chunk = rows.slice(i, i + 500);
        const { error, count } = await admin.from("notifications").insert(chunk, { count: "exact" });
        if (error) return json({ error: error.message }, 500);
        inserted += count ?? chunk.length;
      }
      return json({ sent: inserted });
    }

    if (action === "auto-run") {
      if (!LOVABLE_API_KEY) return json({ error: "LOVABLE_API_KEY not configured" }, 500);
      const intent = String(body?.intent ?? "engagement"); // tutor_insights | learner_recs | engagement
      const result = await runAutoNudges(admin, LOVABLE_API_KEY, intent, caller.id);
      return json(result);
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    console.error("notifications-send error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

/* ----------------- audience resolution ----------------- */

async function resolveAudience(admin: any, f: Filters): Promise<string[]> {
  const role = f.role ?? "all";
  const tier = f.tier ?? "all";
  const cities = (f.cities ?? []).map((c) => c.trim().toLowerCase()).filter(Boolean);
  const categories = (f.categories ?? []).map((c) => c.trim().toLowerCase()).filter(Boolean);
  const activity = f.activity ?? "all";

  // 1) base set: profiles
  let q = admin.from("profiles").select("user_id, city, subscription_tier, avatar_url, updated_at");
  if (tier !== "all") q = q.eq("subscription_tier", tier);
  const { data: profs } = await q;
  let pool = (profs ?? []) as any[];

  // 2) city filter
  if (cities.length) {
    pool = pool.filter((p) => p.city && cities.includes(String(p.city).toLowerCase()));
  }

  // 3) role: derive tutor IDs from boosts/messages/listing_events; learner = not in tutor set
  if (role !== "all") {
    const tutorIds = new Set<string>();
    const [{ data: b }, { data: e }, { data: m }] = await Promise.all([
      admin.from("boosts").select("provider_user_id"),
      admin.from("listing_events").select("provider_user_id"),
      admin.from("messages").select("provider_user_id"),
    ]);
    (b ?? []).forEach((r: any) => r.provider_user_id && tutorIds.add(r.provider_user_id));
    (e ?? []).forEach((r: any) => r.provider_user_id && tutorIds.add(r.provider_user_id));
    (m ?? []).forEach((r: any) => r.provider_user_id && tutorIds.add(r.provider_user_id));

    if (role === "tutor") pool = pool.filter((p) => tutorIds.has(p.user_id));
    else if (role === "learner") pool = pool.filter((p) => !tutorIds.has(p.user_id));
  }

  // 4) category filter (uses boosts.category for tutors, messages.listing_id history is too coarse)
  if (categories.length) {
    const { data: b } = await admin
      .from("boosts")
      .select("provider_user_id, category");
    const matched = new Set<string>();
    (b ?? []).forEach((r: any) => {
      if (r.category && categories.includes(String(r.category).toLowerCase())) {
        matched.add(r.provider_user_id);
      }
    });
    pool = pool.filter((p) => matched.has(p.user_id));
  }

  // 5) activity
  if (activity === "no_avatar") {
    pool = pool.filter((p) => !p.avatar_url);
  } else if (activity === "inactive_30d") {
    const cutoff = Date.now() - 30 * 24 * 3600 * 1000;
    const { data: ev } = await admin
      .from("listing_events")
      .select("provider_user_id, viewer_user_id, created_at")
      .gte("created_at", new Date(cutoff).toISOString());
    const active = new Set<string>();
    (ev ?? []).forEach((r: any) => {
      if (r.provider_user_id) active.add(r.provider_user_id);
      if (r.viewer_user_id) active.add(r.viewer_user_id);
    });
    pool = pool.filter((p) => !active.has(p.user_id));
  } else if (activity === "no_listings") {
    const { data: b } = await admin.from("boosts").select("provider_user_id");
    const { data: e } = await admin.from("listing_events").select("provider_user_id");
    const have = new Set<string>();
    (b ?? []).forEach((r: any) => r.provider_user_id && have.add(r.provider_user_id));
    (e ?? []).forEach((r: any) => r.provider_user_id && have.add(r.provider_user_id));
    pool = pool.filter((p) => !have.has(p.user_id));
  }

  return Array.from(new Set(pool.map((p) => p.user_id)));
}

function describeAudience(f: Filters): string {
  const bits: string[] = [];
  bits.push(f.role && f.role !== "all" ? `${f.role}s` : "users");
  if (f.cities?.length) bits.push(`in ${f.cities.join(", ")}`);
  if (f.categories?.length) bits.push(`interested in ${f.categories.join(", ")}`);
  if (f.tier && f.tier !== "all") bits.push(`on ${f.tier} plan`);
  if (f.activity && f.activity !== "all") bits.push(`(${f.activity.replace(/_/g, " ")})`);
  return bits.join(" ");
}

/* ----------------- AI generation ----------------- */

async function aiGenerate(key: string, audience: string, intent: string): Promise<{ title: string; body: string }> {
  const sys =
    "You write short, warm push notifications for a tutor marketplace called Scholarr. " +
    "Return STRICT JSON with two fields: title (max 60 chars, no emojis) and body (max 140 chars, friendly, action-oriented). " +
    "Do NOT use markdown, headings, or bullets.";
  const user = `Audience: ${audience}\nIntent: ${intent}\nWrite the notification.`;

  const r = await fetch(AI_ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
    }),
  });
  if (!r.ok) {
    const t = await r.text().catch(() => "");
    throw new Error(`AI gateway ${r.status}: ${t}`);
  }
  const data = await r.json();
  const raw = data.choices?.[0]?.message?.content ?? "{}";
  try {
    const obj = JSON.parse(raw);
    return {
      title: String(obj.title ?? "Update from Scholarr").slice(0, 80),
      body: String(obj.body ?? "").slice(0, 200),
    };
  } catch {
    return { title: "Update from Scholarr", body: String(raw).slice(0, 140) };
  }
}

/* ----------------- per-user auto nudges ----------------- */

async function runAutoNudges(admin: any, key: string, intent: string, callerId: string) {
  // Pick a target list. For brevity: at most 25 users per run to control AI usage.
  const filters: Filters =
    intent === "tutor_insights"
      ? { role: "tutor", activity: "all" }
      : intent === "learner_recs"
      ? { role: "learner", activity: "all" }
      : { role: "all", activity: "inactive_30d" };

  const userIds = (await resolveAudience(admin, filters)).slice(0, 25);
  if (userIds.length === 0) return { sent: 0 };

  // Skip users who already received an AI nudge in the past 24h
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { data: recent } = await admin
    .from("notifications")
    .select("user_id")
    .eq("kind", `ai_${intent}`)
    .gte("created_at", since)
    .in("user_id", userIds);
  const skip = new Set((recent ?? []).map((r: any) => r.user_id));
  const targets = userIds.filter((u) => !skip.has(u));
  if (targets.length === 0) return { sent: 0, skipped: userIds.length };

  // One AI generation per user, lightweight prompt
  const audienceLabel =
    intent === "tutor_insights" ? "a tutor" : intent === "learner_recs" ? "a learner" : "an inactive user";
  const rows: any[] = [];
  for (const uid of targets) {
    try {
      const ai = await aiGenerate(key, audienceLabel, intent);
      rows.push({
        user_id: uid,
        title: ai.title,
        body: ai.body,
        kind: `ai_${intent}`,
        created_by: callerId,
        metadata: { auto: true, intent },
      });
    } catch (e) {
      console.error("ai gen failed for user", uid, e);
    }
  }
  if (rows.length === 0) return { sent: 0 };
  const { error, count } = await admin.from("notifications").insert(rows, { count: "exact" });
  if (error) return { error: error.message, sent: 0 };
  return { sent: count ?? rows.length, skipped: skip.size };
}

/* ----------------- helpers ----------------- */

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
