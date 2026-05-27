import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface InterestedLearner {
  listing_id: string;
  learner_user_id: string;
  saved_at: string;
  display_name: string | null;
  city: string | null;
  gender: string | null;
  is_unlocked: boolean;
}

export function useInterestedLearners(listingId?: string) {
  const [rows, setRows] = useState<InterestedLearner[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("get_interested_learners", {
      _listing: listingId ?? null,
    });
    if (!error && data) setRows(data as InterestedLearner[]);
    setLoading(false);
  }, [listingId]);

  useEffect(() => { refresh(); }, [refresh]);

  return { rows, loading, refresh };
}
