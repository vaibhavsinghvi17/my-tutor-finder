import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MSG91_AUTH_KEY = Deno.env.get("MSG91_AUTH_KEY")!;
const INTEGRATED_NUMBER = Deno.env.get("MSG91_WA_INTEGRATED_NUMBER")!;
const TEMPLATE_NAME = Deno.env.get("MSG91_WA_TEMPLATE_NAME")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

async function sha256(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function normalizePhone(p: string) {
  return p.replace(/[^\d]/g, "");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { phone } = await req.json();
    if (!phone || typeof phone !== "string") {
      return new Response(JSON.stringify({ error: "phone required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const normalized = normalizePhone(phone);
    if (normalized.length < 8 || normalized.length > 15) {
      return new Response(JSON.stringify({ error: "invalid phone" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Rate limit: max 3 sends per phone per 10 minutes
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { count } = await admin
      .from("whatsapp_otps")
      .select("id", { count: "exact", head: true })
      .eq("phone", normalized)
      .gte("created_at", tenMinAgo);
    if ((count ?? 0) >= 3) {
      return new Response(JSON.stringify({ error: "Too many OTP requests. Try again in a few minutes." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const code_hash = await sha256(code);
    const expires_at = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    const { error: insErr } = await admin.from("whatsapp_otps").insert({ phone: normalized, code_hash, expires_at });
    if (insErr) throw insErr;

    // MSG91 WhatsApp message via template
    const payload = {
      integrated_number: INTEGRATED_NUMBER,
      content_type: "template",
      payload: {
        messaging_product: "whatsapp",
        type: "template",
        template: {
          name: TEMPLATE_NAME,
          language: { code: "en", policy: "deterministic" },
          namespace: null,
          to_and_components: [
            {
              to: [normalized],
              components: {
                body_1: { type: "text", value: code },
                button_1: { subtype: "url", type: "text", value: code },
              },
            },
          ],
        },
      },
    };

    const resp = await fetch("https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/", {
      method: "POST",
      headers: { "Content-Type": "application/json", authkey: MSG91_AUTH_KEY },
      body: JSON.stringify(payload),
    });
    const respText = await resp.text();
    console.log("MSG91 response", resp.status, respText);
    if (!resp.ok) {
      return new Response(JSON.stringify({ error: "Failed to send WhatsApp OTP", detail: respText }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
