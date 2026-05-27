// Lovable AI helper for tutor listings:
// - action "generate-description": writes a class description from title/category/age/mode
// - action "parse-search": converts natural-language learner query into structured filters

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MODEL = "google/gemini-3-flash-preview";
const ENDPOINT = "https://ai.gateway.lovable.dev/v1/chat/completions";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Require an authenticated caller — prevents anonymous abuse / AI credit drain.
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.45.0");
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: claims, error: claimsErr } = await sb.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (claimsErr || !claims?.claims?.sub) {
      return json({ error: "Unauthorized" }, 401);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const body = await req.json();
    const action = String(body?.action ?? "");


    if (action === "generate-description") {
      const { title, category, ageGroup, mode, languages, durationMins, extra } = body ?? {};
      if (!title || typeof title !== "string") {
        return json({ error: "title is required" }, 400);
      }
      if (title.length > 200) return json({ error: "title too long" }, 400);
      if (category && (typeof category !== "string" || category.length > 100)) return json({ error: "category invalid" }, 400);
      if (ageGroup && (typeof ageGroup !== "string" || ageGroup.length > 100)) return json({ error: "ageGroup invalid" }, 400);
      if (mode && (typeof mode !== "string" || mode.length > 50)) return json({ error: "mode invalid" }, 400);
      if (extra && (typeof extra !== "string" || extra.length > 1000)) return json({ error: "extra too long" }, 400);
      if (Array.isArray(languages) && (languages.length > 20 || languages.some((l: any) => typeof l !== "string" || l.length > 50))) {
        return json({ error: "languages invalid" }, 400);
      }
      const sys =
        "You write short, warm, parent-friendly class descriptions for a tutor marketplace. " +
        "2-4 sentences, plain prose, no emojis, no headings, no bullet points, no markdown. " +
        "Mention what learners do, who it's for, and the vibe. Keep under 600 characters.";
      const user = [
        `Title: ${title}`,
        category && `Category: ${category}`,
        ageGroup && `Age group: ${ageGroup}`,
        mode && `Mode: ${mode}`,
        durationMins && `Duration: ${durationMins} min`,
        Array.isArray(languages) && languages.length && `Languages: ${languages.join(", ")}`,
        extra && `Extra notes from tutor: ${extra}`,
      ].filter(Boolean).join("\n");

      const resp = await callAI([
        { role: "system", content: sys },
        { role: "user", content: user },
      ], LOVABLE_API_KEY);
      if (!resp.ok) return resp;
      const text = (await resp.json()).choices?.[0]?.message?.content?.trim() ?? "";
      return json({ description: text });
    }

    if (action === "parse-search") {
      const { query, categories } = body ?? {};
      if (!query || typeof query !== "string") {
        return json({ error: "query is required" }, 400);
      }
      if (query.length > 500) return json({ error: "query too long" }, 400);
      if (categories !== undefined) {
        if (!Array.isArray(categories)) return json({ error: "categories invalid" }, 400);
        if (categories.length > 100) return json({ error: "too many categories" }, 400);
        if (categories.some((c: any) => typeof c !== "string" || c.length > 100)) {
          return json({ error: "categories invalid" }, 400);
        }
      }
      const sys =
        "You convert a learner's natural-language request into structured search filters " +
        "for a tutor marketplace. Always call the apply_filters tool. " +
        "Pick category from the provided list ONLY if there is a clear match, otherwise omit it. " +
        "Map ages: under 13 → Kids, 13-19 → Teens, 20+ → Adults. " +
        "Use timeOfDay only when the user mentions time. " +
        "Use the keywords field for any free-text search terms (instrument, language, sport, etc).";

      const tools = [{
        type: "function",
        function: {
          name: "apply_filters",
          description: "Apply structured filters to the class search.",
          parameters: {
            type: "object",
            properties: {
              keywords: { type: "string", description: "Free-text search words" },
              category: { type: "string" },
              mode: { type: "string", enum: ["Online", "Offline", "all"] },
              ageGroup: { type: "string", enum: ["Kids", "Teens", "Adults", "All"] },
              timeOfDay: { type: "string", enum: ["morning", "afternoon", "evening", "all"] },
            },
            additionalProperties: false,
          },
        },
      }];

      const resp = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: "system", content: sys },
            { role: "user", content: `Available categories: ${(categories ?? []).join(", ")}\n\nLearner says: ${query}` },
          ],
          tools,
          tool_choice: { type: "function", function: { name: "apply_filters" } },
        }),
      });
      if (!resp.ok) return passthroughError(resp);
      const data = await resp.json();
      const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
      let filters: any = {};
      try { filters = args ? JSON.parse(args) : {}; } catch { filters = {}; }
      return json({ filters });
    }

    return json({ error: "unknown action" }, 400);
  } catch (e) {
    console.error("ai-listing error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

async function callAI(messages: any[], key: string) {
  const r = await fetch(ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, messages }),
  });
  if (!r.ok) return passthroughError(r);
  return r;
}

async function passthroughError(r: Response) {
  if (r.status === 429) return json({ error: "Rate limit exceeded, try again shortly." }, 429);
  if (r.status === 402) return json({ error: "AI credits exhausted. Add funds in Settings → Workspace → Usage." }, 402);
  const t = await r.text().catch(() => "");
  console.error("AI gateway error", r.status, t);
  return json({ error: "AI gateway error" }, 500);
}

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
