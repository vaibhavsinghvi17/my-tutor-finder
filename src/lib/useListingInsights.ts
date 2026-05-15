import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";

export interface ListingStats {
  views: number;
  clicks: number;
  views7d: number;
  views7dPrev: number;
  clicks7d: number;
  uniqueViewers: number;
}

export interface ListingInsights {
  byListing: Record<string, ListingStats>;
  loading: boolean;
}

const CLICK_TYPES = new Set(["contact_click", "request_click", "message_click"]);

/** Aggregate listing_events for the current provider, grouped by listing_id. */
export function useProviderListingInsights(): ListingInsights {
  const { user } = useAuth();
  const [byListing, setByListing] = useState<Record<string, ListingStats>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user) {
        setByListing({});
        setLoading(false);
        return;
      }
      setLoading(true);
      const since = new Date();
      since.setDate(since.getDate() - 14);
      const { data, error } = await supabase
        .from("listing_events")
        .select("listing_id, event_type, viewer_user_id, created_at")
        .eq("provider_user_id", user.id)
        .gte("created_at", since.toISOString());

      if (cancelled) return;
      if (error || !data) {
        setByListing({});
        setLoading(false);
        return;
      }

      const now = Date.now();
      const day = 24 * 60 * 60 * 1000;
      const map: Record<string, ListingStats & { _viewers: Set<string> }> = {};

      for (const row of data as any[]) {
        const id = row.listing_id as string;
        if (!map[id]) {
          map[id] = {
            views: 0, clicks: 0,
            views7d: 0, views7dPrev: 0, clicks7d: 0,
            uniqueViewers: 0,
            _viewers: new Set<string>(),
          };
        }
        const m = map[id];
        const t = new Date(row.created_at).getTime();
        const ageDays = (now - t) / day;
        const isView = row.event_type === "view" || row.event_type === "boost_view";
        const isClick = CLICK_TYPES.has(row.event_type);
        if (isView) {
          m.views++;
          if (ageDays <= 7) m.views7d++;
          else m.views7dPrev++;
          if (row.viewer_user_id) m._viewers.add(row.viewer_user_id);
        }
        if (isClick) {
          m.clicks++;
          if (ageDays <= 7) m.clicks7d++;
        }
      }
      const out: Record<string, ListingStats> = {};
      for (const [id, m] of Object.entries(map)) {
        out[id] = {
          views: m.views, clicks: m.clicks,
          views7d: m.views7d, views7dPrev: m.views7dPrev,
          clicks7d: m.clicks7d,
          uniqueViewers: m._viewers.size,
        };
      }
      setByListing(out);
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [user?.id]);

  return { byListing, loading };
}

export interface InsightSuggestion {
  tone: "boost" | "hot" | "warm" | "cold" | "neutral";
  text: string;
}

/** Heuristic AI-style suggestion based on view/click counts and trend. */
export function suggestForListing(stats: ListingStats | undefined, isBoosted: boolean): InsightSuggestion {
  if (!stats || (stats.views === 0 && stats.clicks === 0)) {
    return {
      tone: "cold",
      text: isBoosted
        ? "Boosted but no views yet — try widening your target locations or age range."
        : "No views yet — boost this class to put it in front of nearby learners.",
    };
  }
  const ctr = stats.views > 0 ? stats.clicks / stats.views : 0;
  const trendUp = stats.views7d > stats.views7dPrev * 1.3 && stats.views7d >= 5;
  const trendDown = stats.views7dPrev > 0 && stats.views7d < stats.views7dPrev * 0.6;

  if (trendUp && !isBoosted) {
    return {
      tone: "hot",
      text: `🔥 Searches are spiking (${stats.views7d} views this week vs ${stats.views7dPrev} last week). Boosting now could 2–3× your leads.`,
    };
  }
  if (ctr >= 0.25 && stats.views >= 10 && !isBoosted) {
    return {
      tone: "boost",
      text: `Strong interest — ${Math.round(ctr * 100)}% of viewers click through. A boost would get you in front of more learners fast.`,
    };
  }
  if (ctr < 0.05 && stats.views >= 20) {
    return {
      tone: "warm",
      text: `Lots of views but few clicks (${Math.round(ctr * 100)}%). Try a sharper title, a clearer price, or a fresh flier image.`,
    };
  }
  if (trendDown) {
    return {
      tone: "warm",
      text: `Views dipped this week (${stats.views7d} vs ${stats.views7dPrev}). A short 3-day boost can re-energise discovery.`,
    };
  }
  if (isBoosted) {
    return { tone: "boost", text: `Boost is live — ${stats.views7d} views & ${stats.clicks7d} clicks in the last 7 days.` };
  }
  return {
    tone: "neutral",
    text: `${stats.views} total views and ${stats.clicks} clicks so far. Keep your details fresh to stay discoverable.`,
  };
}
