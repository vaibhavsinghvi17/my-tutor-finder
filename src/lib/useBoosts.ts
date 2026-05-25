import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Boost {
  id: string;
  listing_id: string;
  provider_user_id: string;
  starts_at: string;
  expires_at: string;
  city: string | null;
  category: string | null;
  age_group: string | null;
  gender: string | null;
  status: string;
  provider_tier?: "starter" | "growth";
}

export function useActiveBoosts() {
  const [boosts, setBoosts] = useState<Boost[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("boosts")
      .select("*")
      .eq("status", "active")
      .gt("expires_at", new Date().toISOString());
    const list = (data as Boost[]) ?? [];
    // Look up each provider's current subscription tier so Growth boosts can outrank Starter ones.
    const ids = Array.from(new Set(list.map((b) => b.provider_user_id)));
    if (ids.length) {
      const { data: growth } = await supabase
        .rpc("get_active_growth_providers", { _ids: ids });
      const growthSet = new Set<string>((growth ?? []).map((g: any) => g.user_id));
      list.forEach((b) => { b.provider_tier = growthSet.has(b.provider_user_id) ? "growth" : "starter"; });
    }
    setBoosts(list);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  return { boosts, loading, refresh };
}

// BYPASS: Razorpay test mode — pretend the ₹500 boost payment succeeded.
// Duration depends on tier: Starter = 3 days, Growth = 7 days.
export async function createBoost(params: {
  listingId: string;
  providerUserId: string;
  durationDays: number;
  city?: string | null;
  category?: string | null;
  ageGroup?: string | null;
  gender?: string | null;
}) {
  const expiresAt = new Date(Date.now() + params.durationDays * 24 * 3600 * 1000).toISOString();
  const { error, data } = await supabase
    .from("boosts")
    .insert({
      listing_id: params.listingId,
      provider_user_id: params.providerUserId,
      city: params.city ?? null,
      category: params.category ?? null,
      age_group: params.ageGroup ?? null,
      gender: params.gender ?? null,
      expires_at: expiresAt,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export function isBoosted(listingId: string, boosts: Boost[]) {
  return boosts.some((b) => b.listing_id === listingId);
}
