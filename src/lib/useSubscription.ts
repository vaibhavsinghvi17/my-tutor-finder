import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";

export type Tier = "starter" | "growth";

export function useSubscription() {
  const { user } = useAuth();
  const [tier, setTier] = useState<Tier>("starter");
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setTier("starter");
      setExpiresAt(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("subscription_tier, subscription_expires_at")
      .eq("user_id", user.id)
      .maybeSingle();
    const t = (data?.subscription_tier as Tier) ?? "starter";
    const exp = data?.subscription_expires_at as string | null;
    const active = !exp || new Date(exp) > new Date();
    setTier(active ? t : "starter");
    setExpiresAt(exp);
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  // Payment integration not live yet — self-activation is blocked server-side by a
  // DB trigger so the tier can only be changed through a verified payment flow / admin.
  const activateGrowth = useCallback(async () => {
    throw new Error("Payments aren't live yet. Growth activation will open once checkout is connected.");
  }, []);

  const downgrade = useCallback(async () => {
    if (!user) return;
    await supabase
      .from("profiles")
      .update({ subscription_tier: "starter", subscription_expires_at: null })
      .eq("user_id", user.id);
    await refresh();
  }, [user, refresh]);

  return { tier, expiresAt, loading, isGrowth: tier === "growth", refresh, activateGrowth, downgrade };
}
