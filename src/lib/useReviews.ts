import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Review {
  id: string;
  listing_id: string;
  provider_user_id: string;
  reviewer_user_id: string;
  reviewer_name: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
}

export function useListingReviews(listingId?: string) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!listingId) { setReviews([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("reviews")
      .select("*")
      .eq("listing_id", listingId)
      .order("created_at", { ascending: false });
    setReviews((data as Review[]) ?? []);
    setLoading(false);
  }, [listingId]);

  useEffect(() => { refresh(); }, [refresh]);

  const avg = reviews.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0;
  return { reviews, avg, count: reviews.length, loading, refresh };
}

export async function upsertReview(params: {
  listingId: string;
  providerUserId: string;
  reviewerUserId: string;
  reviewerName: string;
  rating: number;
  comment: string;
}) {
  const { error } = await supabase
    .from("reviews")
    .upsert({
      listing_id: params.listingId,
      provider_user_id: params.providerUserId,
      reviewer_user_id: params.reviewerUserId,
      reviewer_name: params.reviewerName,
      rating: params.rating,
      comment: params.comment || null,
    }, { onConflict: "listing_id,reviewer_user_id" });
  if (error) throw error;
}

export async function deleteReview(id: string) {
  const { error } = await supabase.from("reviews").delete().eq("id", id);
  if (error) throw error;
}
