import { AppState, LearnerProfile, ProviderProfile } from "./types";

/**
 * Minimum required for a learner to be considered "set up": name + city.
 * This is intentionally lightweight so users aren't forced to fill the entire form,
 * but enough that listings can be opened with a real identity & locality.
 */
export function isLearnerProfileComplete(l: LearnerProfile): boolean {
  return !!(l.name?.trim() && l.city?.trim());
}

/**
 * Minimum required for a provider to be considered "set up": business name + city.
 */
export function isProviderProfileComplete(p: ProviderProfile): boolean {
  return !!(p.businessName?.trim() && p.city?.trim());
}

export function isCurrentProfileComplete(s: AppState): boolean {
  return s.mode === "provider"
    ? isProviderProfileComplete(s.provider)
    : isLearnerProfileComplete(s.learner);
}
