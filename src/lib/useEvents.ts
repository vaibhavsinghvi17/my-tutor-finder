import { supabase } from "@/integrations/supabase/client";
import { Listing, AgeGroup } from "@/lib/types";
import { ageFromDob } from "@/lib/timeUtils";

export type EventType = "view" | "contact_click" | "request_click" | "message_click";

function ageToGroup(dob?: string): AgeGroup | undefined {
  if (!dob) return undefined;
  const a = ageFromDob(dob);
  if (a == null) return undefined;
  if (a < 13) return "Kids";
  if (a < 20) return "Teens";
  return "Adults";
}

interface ViewerCtx {
  userId?: string;
  city?: string;
  dob?: string;
  gender?: string;
}

/**
 * Record a listing event. Also resolves whether the listing is currently boosted
 * (and matches the viewer's targeting), so insights and chat can attribute leads.
 */
export async function recordEvent(
  listing: Pick<Listing, "id" | "providerUserId" | "city" | "category" | "ageGroup">,
  type: EventType,
  viewer: ViewerCtx = {},
) {
  if (!listing.providerUserId) return; // legacy/seed listings without an owner — skip
  const viaBoostId = await resolveActiveBoostId(listing.id, viewer);
  await supabase.from("listing_events").insert({
    listing_id: listing.id,
    provider_user_id: listing.providerUserId,
    event_type: type,
    viewer_user_id: viewer.userId ?? null,
    viewer_city: viewer.city ?? null,
    viewer_age_group: ageToGroup(viewer.dob) ?? null,
    viewer_gender: viewer.gender ?? null,
    via_boost_id: viaBoostId,
  });
}

/** Returns the id of an active boost on the listing whose targeting matches the viewer, else null. */
export async function resolveActiveBoostId(
  listingId: string,
  viewer: { city?: string; dob?: string; gender?: string },
): Promise<string | null> {
  const { data } = await supabase
    .from("boosts")
    .select("id, city, age_group, gender")
    .eq("listing_id", listingId)
    .eq("status", "active")
    .gt("expires_at", new Date().toISOString());
  const list = (data ?? []) as Array<{ id: string; city: string | null; age_group: string | null; gender: string | null }>;
  const vGroup = ageToGroup(viewer.dob);
  const match = list.find((b) => {
    if (b.city && viewer.city && b.city.toLowerCase() !== viewer.city.toLowerCase()) return false;
    if (b.age_group && vGroup && b.age_group !== vGroup && b.age_group !== "All") return false;
    if (b.gender && viewer.gender && b.gender.toLowerCase() !== viewer.gender.toLowerCase()) return false;
    return true;
  }) ?? list[0];
  return match?.id ?? null;
}
