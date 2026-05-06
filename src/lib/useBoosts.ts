import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";

export interface Boost {
  id: string;
  listing_id: string;
  provider_user_id: string;
  starts_at: string;
  expires_at: string;
  city: string | null;
  category: string | null;
  age_group: string | null;
  status: string;
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
    setBoosts((data as Boost[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  return { boosts, loading, refresh };
}

// BYPASS: Razorpay test mode — pretend the ₹500 boost payment succeeded and write a 7-day boost row.
export async function createBoost(params: {
  listingId: string;
  providerUserId: string;
  city?: string;
  category?: string;
  ageGroup?: string;
}) {
  const { error, data } = await supabase
    .from("boosts")
    .insert({
      listing_id: params.listingId,
      provider_user_id: params.providerUserId,
      city: params.city ?? null,
      category: params.category ?? null,
      age_group: params.ageGroup ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export function isBoosted(listingId: string, boosts: Boost[]) {
  return boosts.some((b) => b.listing_id === listingId);
}
