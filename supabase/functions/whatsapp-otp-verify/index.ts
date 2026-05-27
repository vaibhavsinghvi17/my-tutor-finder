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

function normalizePhone(p: string) {
  return p.replace(/[^\d]/g, "");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { phone, code, display_name } = await req.json();
    if (!phone || !code) {
      return new Response(JSON.stringify({ error: "phone and code required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const normalized = normalizePhone(phone);
    const codeStr = String(code).trim();
    const hash = await sha256(codeStr);

    // Find latest unconsumed otp for phone
    const { data: rows, error } = await admin
      .from("whatsapp_otps")
      .select("*")
      .eq("phone", normalized)
      .is("consumed_at", null)
      .order("created_at", { ascending: false })
      .limit(1);
    if (error) throw error;
    const row = rows?.[0];
    if (!row) {
      return new Response(JSON.stringify({ error: "No active code. Please request a new one." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (new Date(row.expires_at).getTime() < Date.now()) {
      return new Response(JSON.stringify({ error: "Code expired. Please request a new one." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if ((row.attempts ?? 0) >= 5) {
      return new Response(JSON.stringify({ error: "Too many attempts. Please request a new code." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (row.code_hash !== hash) {
      await admin.from("whatsapp_otps").update({ attempts: (row.attempts ?? 0) + 1 }).eq("id", row.id);
      return new Response(JSON.stringify({ error: "Incorrect code" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Mark consumed
    await admin.from("whatsapp_otps").update({ consumed_at: new Date().toISOString() }).eq("id", row.id);

    // Find or create user by phone
    const e164 = `+${normalized}`;
    let userId: string | null = null;
    // List users (paginated lookup by phone)
    const { data: list, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (listErr) throw listErr;
    const existing = list.users.find((u) => (u.phone ? `+${u.phone}` : "") === e164);
    if (existing) {
      userId = existing.id;
      // Ensure phone confirmed
      if (!existing.phone_confirmed_at) {
        await admin.auth.admin.updateUserById(existing.id, { phone_confirm: true } as any);
      }
    } else {
      const { data: created, error: cErr } = await admin.auth.admin.createUser({
        phone: normalized,
        phone_confirm: true,
        user_metadata: display_name ? { display_name } : {},
      });
      if (cErr) throw cErr;
      userId = created.user!.id;
    }

    // Generate a magic link to extract tokens, then return them so client can setSession
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: "magiclink",
      // generateLink requires email for magiclink; fall back to a session via token endpoint
      // Workaround: use 'recovery'-style? Instead create session using OTP signin server-side.
      email: `${userId}@phone.local`,
    } as any);

    // Above may fail when user has no email; use alternate path: create a one-time sign-in via password-less flow is unavailable.
    // Reliable approach: set a random password on the user, then sign in from client.
    if (linkErr || !linkData) {
      const tempPwd = crypto.randomUUID() + "Aa1!";
      await admin.auth.admin.updateUserById(userId!, { password: tempPwd });
      return new Response(JSON.stringify({ ok: true, mode: "password", user_id: userId, phone: normalized, temp_password: tempPwd }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, mode: "magic", action_link: linkData.properties?.action_link }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
