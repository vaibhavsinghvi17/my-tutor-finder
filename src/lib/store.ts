import { useSyncExternalStore } from "react";
import { AppMode, AppState, JoinRequest, Listing, KidProfile } from "./types";
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
    city: "",
    area: "",
    address: "",
    interests: [],
    preferredMode: "Any",
    freeBlocks: [],
    kids: [],
    activeKidId: null,
  },
  provider: {
    businessName: "",
    bio: "",
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
    return { ...initialState, ...JSON.parse(raw) };
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
