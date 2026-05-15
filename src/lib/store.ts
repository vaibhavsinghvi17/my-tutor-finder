import { useSyncExternalStore } from "react";
import { AppMode, AppState, JoinRequest, Listing, KidProfile, AdultProfile, Rating } from "./types";
import { SEED_LISTINGS } from "./seed";

const STORAGE_KEY = "learnlocal-state-v1";

const initialState: AppState = {
  onboarded: false,
  mode: "learner",
  city: "",
  learner: {
    name: "",
    email: "",
    dob: "",
    occupation: "",
    country: "",
    state: "",
    city: "",
    area: "",
    address: "",
    interests: [],
    preferredMode: "Any",
    freeBlocks: [],
    kids: [],
    adults: [],
    activeKidId: null,
    savedListings: [],
    completedListings: [],
  },
  provider: {
    businessName: "",
    bio: "",
    country: "",
    state: "",
    city: "",
    area: "",
    address: "",
    contact: "",
    categories: [],
  },
  listings: [],
  requests: [],
  ratings: [],
};

function load(): AppState {
  if (typeof window === "undefined") return initialState;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    const parsed = JSON.parse(raw);
    return {
      ...initialState,
      ...parsed,
      learner: {
        ...initialState.learner,
        ...(parsed.learner ?? {}),
        kids: Array.isArray(parsed.learner?.kids)
          ? parsed.learner.kids.map((k: any) => ({
              id: k.id,
              username: k.username,
              name: k.name ?? "",
              dob: k.dob ?? "",
              school: k.school ?? "",
              schoolClass: k.schoolClass ?? "",
              interests: Array.isArray(k.interests) ? k.interests : [],
              freeBlocks: Array.isArray(k.freeBlocks) ? k.freeBlocks : [],
            }))
          : [],
        adults: Array.isArray(parsed.learner?.adults)
          ? parsed.learner.adults.map((a: any) => ({
              id: a.id,
              username: a.username,
              name: a.name ?? "",
              email: a.email ?? "",
              dob: a.dob ?? "",
              occupation: a.occupation ?? "",
              interests: Array.isArray(a.interests) ? a.interests : [],
              freeBlocks: Array.isArray(a.freeBlocks) ? a.freeBlocks : [],
              avatarColor: a.avatarColor,
            }))
          : [],
        freeBlocks: Array.isArray(parsed.learner?.freeBlocks) ? parsed.learner.freeBlocks : [],
        interests: Array.isArray(parsed.learner?.interests) ? parsed.learner.interests : [],
        savedListings: Array.isArray(parsed.learner?.savedListings) ? parsed.learner.savedListings : [],
        completedListings: Array.isArray(parsed.learner?.completedListings) ? parsed.learner.completedListings : [],
      },
      provider: { ...initialState.provider, ...(parsed.provider ?? {}) },
      listings: Array.isArray(parsed.listings) ? parsed.listings : [],
      requests: Array.isArray(parsed.requests) ? parsed.requests : [],
      ratings: Array.isArray(parsed.ratings) ? parsed.ratings : [],
    };
  } catch {
    return initialState;
  }
}

/** Fields that should mirror across learner & provider profiles for the same person. */
const SHARED_KEYS = ["phone", "verifiedPhone", "email", "verifiedEmail", "avatarDataUrl"] as const;
function pickShared(patch: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const k of SHARED_KEYS) {
    if (k in patch) out[k] = patch[k];
  }
  return out;
}

let state: AppState = load();
const listeners = new Set<() => void>();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

function set(updater: (s: AppState) => AppState) {
  state = updater(state);
  persist();
  listeners.forEach((l) => l());
}

export const store = {
  get: () => state,
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  setMode(mode: AppMode) {
    set((s) => ({ ...s, mode }));
  },
  switchProfile(target: AppMode, prefillFromOther: boolean) {
    set((s) => {
      let learner = s.learner;
      let provider = s.provider;
      if (prefillFromOther) {
        if (target === "provider") {
          provider = {
            ...provider,
            businessName: provider.businessName || learner.name || "",
            country: provider.country || learner.country,
            state: provider.state || learner.state,
            city: provider.city || learner.city,
            area: provider.area || learner.area,
            pinCode: provider.pinCode || learner.pinCode,
            address: provider.address || learner.address,
            phone: provider.phone || learner.phone,
            verifiedPhone: provider.verifiedPhone || learner.verifiedPhone,
            email: provider.email || learner.email,
            verifiedEmail: provider.verifiedEmail || (learner as any).verifiedEmail,
            avatarDataUrl: provider.avatarDataUrl || learner.avatarDataUrl,
          };
        } else {
          learner = {
            ...learner,
            name: learner.name || provider.businessName || "",
            country: learner.country || provider.country,
            state: learner.state || provider.state,
            city: learner.city || provider.city,
            area: learner.area || provider.area,
            pinCode: learner.pinCode || provider.pinCode,
            address: learner.address || provider.address,
            phone: learner.phone || provider.phone,
            verifiedPhone: learner.verifiedPhone || provider.verifiedPhone,
            email: learner.email || provider.email,
            avatarDataUrl: learner.avatarDataUrl || provider.avatarDataUrl,
          };
        }
      }
      return { ...s, mode: target, learner, provider };
    });
  },
  setOnboarded(mode: AppMode) {
    set((s) => ({ ...s, onboarded: true, mode }));
  },
  setCity(city: AppState["city"]) {
    set((s) => ({ ...s, city }));
  },
  updateLearner(patch: Partial<AppState["learner"]>) {
    set((s) => {
      const learner = { ...s.learner, ...patch };
      const shared = pickShared(patch);
      const provider = Object.keys(shared).length ? { ...s.provider, ...shared } : s.provider;
      return { ...s, learner, provider };
    });
  },
  updateProvider(patch: Partial<AppState["provider"]>) {
    set((s) => {
      const provider = { ...s.provider, ...patch };
      const shared = pickShared(patch);
      const learner = Object.keys(shared).length ? { ...s.learner, ...shared } : s.learner;
      return { ...s, provider, learner };
    });
  },
  addKid(kid: Omit<KidProfile, "id">) {
    set((s) => ({
      ...s,
      learner: { ...s.learner, kids: [...s.learner.kids, { ...kid, id: crypto.randomUUID() }] },
    }));
  },
  updateKid(id: string, patch: Partial<KidProfile>) {
    set((s) => ({
      ...s,
      learner: {
        ...s.learner,
        kids: s.learner.kids.map((k) => (k.id === id ? { ...k, ...patch } : k)),
      },
    }));
  },
  removeKid(id: string) {
    set((s) => ({
      ...s,
      learner: {
        ...s.learner,
        kids: s.learner.kids.filter((k) => k.id !== id),
        activeKidId: s.learner.activeKidId === id ? null : s.learner.activeKidId,
      },
    }));
  },
  setActiveKid(id: string | null) {
    set((s) => ({ ...s, learner: { ...s.learner, activeKidId: id } }));
  },
  addAdult(adult: Omit<AdultProfile, "id">) {
    set((s) => ({
      ...s,
      learner: { ...s.learner, adults: [...s.learner.adults, { ...adult, id: crypto.randomUUID() }] },
    }));
  },
  updateAdult(id: string, patch: Partial<AdultProfile>) {
    set((s) => ({
      ...s,
      learner: {
        ...s.learner,
        adults: s.learner.adults.map((a) => (a.id === id ? { ...a, ...patch } : a)),
      },
    }));
  },
  removeAdult(id: string) {
    set((s) => ({
      ...s,
      learner: { ...s.learner, adults: s.learner.adults.filter((a) => a.id !== id) },
    }));
  },
  addListing(listing: Omit<Listing, "id" | "createdAt" | "providerId" | "providerName">, providerUserId?: string) {
    set((s) => ({
      ...s,
      listings: [
        {
          ...listing,
          id: crypto.randomUUID(),
          providerId: "self",
          providerName: s.provider.businessName || "My Class",
          providerUserId: providerUserId ?? listing.providerUserId,
          createdAt: Date.now(),
        },
        ...s.listings,
      ],
    }));
  },
  updateListing(id: string, patch: Partial<Listing>) {
    set((s) => ({ ...s, listings: s.listings.map((l) => (l.id === id ? { ...l, ...patch } : l)) }));
  },
  removeListing(id: string) {
    set((s) => ({ ...s, listings: s.listings.filter((l) => l.id !== id) }));
  },
  addRequest(req: Omit<JoinRequest, "id" | "createdAt" | "status"> & { status?: JoinRequest["status"] }) {
    set((s) => ({
      ...s,
      requests: [
        { ...req, id: crypto.randomUUID(), createdAt: Date.now(), status: req.status ?? "Pending" },
        ...s.requests,
      ],
    }));
  },
  setRequestStatus(id: string, status: JoinRequest["status"]) {
    set((s) => ({ ...s, requests: s.requests.map((r) => (r.id === id ? { ...r, status } : r)) }));
  },
  updateRequest(id: string, patch: Partial<JoinRequest>) {
    set((s) => ({ ...s, requests: s.requests.map((r) => (r.id === id ? { ...r, ...patch } : r)) }));
  },
  removeRequest(id: string) {
    set((s) => ({ ...s, requests: s.requests.filter((r) => r.id !== id) }));
  },
  addRequestRaw(req: Omit<JoinRequest, "id" | "createdAt">) {
    set((s) => ({
      ...s,
      requests: [
        { ...req, id: crypto.randomUUID(), createdAt: Date.now() },
        ...s.requests,
      ],
    }));
  },
  addRating(rating: Omit<Rating, "id" | "createdAt">) {
    set((s) => ({
      ...s,
      ratings: [
        { ...rating, id: crypto.randomUUID(), createdAt: Date.now() },
        ...s.ratings,
      ],
    }));
  },
  toggleSaved(listingId: string) {
    set((s) => {
      const cur = s.learner.savedListings || [];
      const next = cur.includes(listingId) ? cur.filter((x) => x !== listingId) : [...cur, listingId];
      return { ...s, learner: { ...s.learner, savedListings: next } };
    });
  },
  toggleCompleted(listingId: string) {
    set((s) => {
      const cur = s.learner.completedListings || [];
      const next = cur.includes(listingId) ? cur.filter((x) => x !== listingId) : [...cur, listingId];
      return { ...s, learner: { ...s.learner, completedListings: next } };
    });
  },
  reset() {
    state = initialState;
    persist();
    listeners.forEach((l) => l());
  },
};

export function useStore<T>(selector: (s: AppState) => T): T {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.get()),
    () => selector(initialState),
  );
}

export function getAllListings(): Listing[] {
  // Public/learner-facing list — exclude tutor drafts.
  return [...store.get().listings.filter((l) => !l.draft), ...SEED_LISTINGS];
}
