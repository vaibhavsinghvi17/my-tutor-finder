import { AppState, Category, Listing } from "./types";
import { blocksToSlots, ageFromDob } from "./timeUtils";

export interface ScoredListing {
  listing: Listing;
  score: number;
  reasons: string[];
}

export function scoreListings(state: AppState, listings: Listing[]): ScoredListing[] {
  const learner = state.learner;
  const kid = learner.activeKidId
    ? learner.kids.find((k) => k.id === learner.activeKidId) ?? null
    : null;

  const interests: Category[] = kid ? kid.interests : learner.interests;
  const freeSlots = kid ? blocksToSlots(kid.freeBlocks) : blocksToSlots(learner.freeBlocks);
  const city = learner.city || state.city;
  const area = learner.area;
  const preferredMode = learner.preferredMode;
  const isKid = !!kid;
  const isAdult = !kid;

  return listings
    .map<ScoredListing>((listing) => {
      let score = 0;
      const reasons: string[] = [];

      if (city && listing.city === city) {
        score += 3;
        if (area && listing.area.toLowerCase() === area.toLowerCase()) {
          score += 1;
          reasons.push("Near you");
        } else {
          reasons.push("In your city");
        }
      }
      if (interests.length && interests.includes(listing.category)) {
        score += 2;
        reasons.push("Matches your interests");
      }
      const allSlots = [...listing.slots, ...((listing.onlineSlots ?? []) as typeof listing.slots)];
      if (freeSlots.length && allSlots.some((s) => freeSlots.includes(s))) {
        score += 2;
        reasons.push("Fits your schedule");
      }
      if (preferredMode !== "Any" && (listing.mode === preferredMode || listing.mode === "Both")) {
        score += 1;
      }
      if (isKid && (listing.ageGroup === "Kids" || listing.ageGroup === "All")) {
        score += 1;
        reasons.push("Great for kids");
      }
      if (isAdult && (listing.ageGroup === "Adults" || listing.ageGroup === "All")) {
        score += 1;
      }

      return { listing, score, reasons: Array.from(new Set(reasons)) };
    })
    .sort((a, b) => b.score - a.score || b.listing.createdAt - a.listing.createdAt);
}

export { ageFromDob };
