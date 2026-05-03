import { useSyncExternalStore } from "react";
import { AppMode, AppState, JoinRequest, Listing, KidProfile, AdultProfile } from "./types";
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
      },
      provider: { ...initialState.provider, ...(parsed.provider ?? {}) },
      listings: Array.isArray(parsed.listings) ? parsed.listings : [],
      requests: Array.isArray(parsed.requests) ? parsed.requests : [],
    };
  } catch {
    return initialState;
  }
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
  setOnboarded(mode: AppMode) {
    set((s) => ({ ...s, onboarded: true, mode }));
  },
  setCity(city: AppState["city"]) {
    set((s) => ({ ...s, city }));
  },
  updateLearner(patch: Partial<AppState["learner"]>) {
    set((s) => ({ ...s, learner: { ...s.learner, ...patch } }));
  },
  updateProvider(patch: Partial<AppState["provider"]>) {
    set((s) => ({ ...s, provider: { ...s.provider, ...patch } }));
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
  addListing(listing: Omit<Listing, "id" | "createdAt" | "providerId" | "providerName">) {
    set((s) => ({
      ...s,
      listings: [
        {
          ...listing,
          id: crypto.randomUUID(),
          providerId: "self",
          providerName: s.provider.businessName || "My Studio",
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
  addRequest(req: Omit<JoinRequest, "id" | "createdAt" | "status">) {
    set((s) => ({
      ...s,
      requests: [
        { ...req, id: crypto.randomUUID(), createdAt: Date.now(), status: "Pending" },
        ...s.requests,
      ],
    }));
  },
  setRequestStatus(id: string, status: JoinRequest["status"]) {
    set((s) => ({ ...s, requests: s.requests.map((r) => (r.id === id ? { ...r, status } : r)) }));
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
  return [...store.get().listings, ...SEED_LISTINGS];
}
