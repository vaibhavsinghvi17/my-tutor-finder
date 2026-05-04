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

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listener FIRST, then getSession (per Supabase guidance)
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      syncAuthToProfile(s?.user ?? null);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      syncAuthToProfile(data.session?.user ?? null);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, user, loading };
}
