import { AppState, LearnerProfile, ProviderProfile } from "./types";

/**
 * "Verified" learner = has name + verified phone (mobile OTP).
 * Required to open class details, send requests, etc.
 */
export function isLearnerVerified(l: LearnerProfile): boolean {
  return !!(l.name?.trim() && l.phone?.trim() && l.verifiedPhone === l.phone);
}

/**
 * "Verified" provider = has business name + verified phone.
 * Required to publish a class.
 */
export function isProviderVerified(p: ProviderProfile): boolean {
  return !!(p.businessName?.trim() && p.phone?.trim() && p.verifiedPhone === p.phone);
}

export function isCurrentProfileVerified(s: AppState): boolean {
  return s.mode === "provider" ? isProviderVerified(s.provider) : isLearnerVerified(s.learner);
}

// Backwards-compatible aliases (older imports).
export const isLearnerProfileComplete = isLearnerVerified;
export const isProviderProfileComplete = isProviderVerified;
export const isCurrentProfileComplete = isCurrentProfileVerified;
