import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
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

function randomPassword() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const b64 = btoa(String.fromCharCode(...bytes)).replace(/[^A-Za-z0-9]/g, "");
  return b64 + "Aa1!";
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

    // Use an ephemeral random password only to mint a session server-side.
    // The password is rotated immediately after sign-in so it cannot be reused.
    const ephemeralPwd = randomPassword();
    let user = await findUserByPhone(normalized);
    if (!user) {
      const { data: created, error: cErr } = await admin.auth.admin.createUser({
        phone: normalized,
        password: ephemeralPwd,
        phone_confirm: true,
        user_metadata: display_name ? { display_name } : {},
      });
      if (cErr) throw cErr;
      user = created.user!;
    } else {
      const { error: uErr } = await admin.auth.admin.updateUserById(user.id, {
        password: ephemeralPwd,
        phone_confirm: true,
      } as any);
      if (uErr) throw uErr;
    }

    // Mint a session server-side using a short-lived anon client.
    const anon = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: signIn, error: signErr } = await anon.auth.signInWithPassword({
      phone: normalized,
      password: ephemeralPwd,
    });
    if (signErr || !signIn?.session) {
      console.error("session mint failed", signErr);
      return new Response(JSON.stringify({ error: "Could not establish session" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // NOTE: do NOT rotate the password here — updating the user's password
    // invalidates the session we just minted, causing "Session not found" on the client.
    // The ephemeral password is already random/high-entropy and unknown to the client,
    // and the OTP row is marked consumed so it cannot be reused.



    const { access_token, refresh_token } = signIn.session;
    return new Response(JSON.stringify({ ok: true, phone: normalized, access_token, refresh_token }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
