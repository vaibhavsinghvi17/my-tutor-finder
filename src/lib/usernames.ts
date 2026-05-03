import { AppState } from "./types";

export function slugifyUsername(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
}

export interface ProfileLookup {
  username: string;
  name: string;
  kind: "learner" | "kid" | "adult" | "provider";
  parentName?: string;
}

export function listAllProfiles(s: AppState): ProfileLookup[] {
  const out: ProfileLookup[] = [];
  if (s.learner.username) out.push({ username: s.learner.username, name: s.learner.name || s.learner.username, kind: "learner" });
  for (const k of s.learner.kids) if (k.username) out.push({ username: k.username, name: k.name, kind: "kid", parentName: s.learner.name });
  for (const a of s.learner.adults) if (a.username) out.push({ username: a.username, name: a.name, kind: "adult", parentName: s.learner.name });
  if (s.provider.username) out.push({ username: s.provider.username, name: s.provider.businessName || s.provider.username, kind: "provider" });
  return out;
}

export function findProfileByUsername(s: AppState, username: string): ProfileLookup | undefined {
  const u = username.toLowerCase().trim();
  return listAllProfiles(s).find((p) => p.username.toLowerCase() === u);
}

export function isUsernameTaken(s: AppState, username: string, ignoreOwner?: string): boolean {
  const u = username.toLowerCase().trim();
  return listAllProfiles(s).some((p) => p.username.toLowerCase() === u && p.username !== ignoreOwner);
}
