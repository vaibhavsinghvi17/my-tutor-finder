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

  // BYPASS: Razorpay test mode — pretend payment succeeded and activate Growth for 30 days.
  const activateGrowth = useCallback(async () => {
    if (!user) throw new Error("Please sign in first");
    const expires = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
    const { error } = await supabase
      .from("profiles")
      .update({ subscription_tier: "growth", subscription_expires_at: expires })
      .eq("user_id", user.id);
    if (error) throw error;
    await refresh();
  }, [user, refresh]);

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
