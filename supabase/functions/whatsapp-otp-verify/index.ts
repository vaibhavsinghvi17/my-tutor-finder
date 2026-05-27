import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

async function sha256(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

const normalizePhone = (p: string) => p.replace(/[^\d]/g, "");

async function findUserByPhone(phoneDigits: string) {
  const e164 = `+${phoneDigits}`;
  let page = 1;
  while (page <= 20) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const u = data.users.find((x) => (x.phone ? `+${x.phone}` : "") === e164 || x.phone === phoneDigits);
    if (u) return u;
    if (data.users.length < 200) return null;
    page++;
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { phone, code, display_name } = await req.json();
    if (!phone || !code) {
      return new Response(JSON.stringify({ error: "phone and code required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const normalized = normalizePhone(phone);
    const hash = await sha256(String(code).trim());

    const { data: rows, error } = await admin
      .from("whatsapp_otps")
      .select("*")
      .eq("phone", normalized)
      .is("consumed_at", null)
      .order("created_at", { ascending: false })
      .limit(1);
    if (error) throw error;
    const row = rows?.[0];
    if (!row) return new Response(JSON.stringify({ error: "No active code. Please request a new one." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (new Date(row.expires_at).getTime() < Date.now()) return new Response(JSON.stringify({ error: "Code expired. Please request a new one." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if ((row.attempts ?? 0) >= 5) return new Response(JSON.stringify({ error: "Too many attempts. Please request a new code." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    if (row.code_hash !== hash) {
      await admin.from("whatsapp_otps").update({ attempts: (row.attempts ?? 0) + 1 }).eq("id", row.id);
      return new Response(JSON.stringify({ error: "Incorrect code" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    await admin.from("whatsapp_otps").update({ consumed_at: new Date().toISOString() }).eq("id", row.id);

    const tempPwd = crypto.randomUUID() + "Aa1!";
    let user = await findUserByPhone(normalized);
    if (!user) {
      const { data: created, error: cErr } = await admin.auth.admin.createUser({
        phone: normalized,
        password: tempPwd,
        phone_confirm: true,
        user_metadata: display_name ? { display_name } : {},
      });
      if (cErr) throw cErr;
      user = created.user!;
    } else {
      const { error: uErr } = await admin.auth.admin.updateUserById(user.id, {
        password: tempPwd,
        phone_confirm: true,
      } as any);
      if (uErr) throw uErr;
    }

    return new Response(JSON.stringify({ ok: true, phone: normalized, temp_password: tempPwd }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
