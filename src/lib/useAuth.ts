import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { store } from "@/lib/store";

function syncAuthToProfile(user: User | null) {
  if (!user) return;
  const phone = (user.phone ? `+${user.phone}` : "").trim();
  const phoneConfirmed = !!user.phone_confirmed_at;
  const email = user.email ?? "";
  const emailConfirmed = !!user.email_confirmed_at;
  const displayName =
    (user.user_metadata?.display_name as string | undefined) ||
    (user.user_metadata?.name as string | undefined) ||
    "";

  const patch: Record<string, any> = {};
  if (phone && phoneConfirmed) {
    patch.phone = phone;
    patch.verifiedPhone = phone;
  }
  if (email) {
    patch.email = email;
    if (emailConfirmed) patch.verifiedEmail = email;
  }
  if (displayName) {
    const s = store.get();
    if (!s.learner.name?.trim()) patch.name = displayName;
  }
  if (Object.keys(patch).length) {
    store.updateLearner(patch);
  }
}

async function checkBanned(userId: string): Promise<{ banned: boolean; reason: string | null }> {
  const { data } = await supabase
    .from("profiles")
    .select("banned_at, banned_reason")
    .eq("user_id", userId)
    .maybeSingle();
  return { banned: !!data?.banned_at, reason: data?.banned_reason ?? null };
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function handle(s: Session | null) {
      if (s?.user) {
        const { banned, reason } = await checkBanned(s.user.id);
        if (banned) {
          await supabase.auth.signOut();
          const { toast } = await import("sonner");
          toast.error(reason ? `Account banned: ${reason}` : "This account has been banned.");
          setSession(null);
          setUser(null);
          store.setAuthUser(null);
          return;
        }
      }
      setSession(s);
      setUser(s?.user ?? null);
      store.setAuthUser(s?.user?.id ?? null);
      syncAuthToProfile(s?.user ?? null);
    }
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      void handle(s);
    });
    supabase.auth.getSession().then(async ({ data }) => {
      await handle(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, user, loading };
}
