export type Category = string;

export const CATEGORIES: string[] = [
  "Academics", "Music", "Dance", "Sports", "Art", "Coding", "Yoga", "Languages",
];

export type Mode = "Online" | "Offline" | "Both";
export type AgeGroup = "Kids" | "Teens" | "Adults" | "All";

export const AGE_GROUPS: AgeGroup[] = ["Kids", "Teens", "Adults", "All"];

// City is now any string (free-form with autocomplete via locations.ts)
export type City = string;

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export type Day = (typeof DAYS)[number];

// Time slots: 6am - 10pm in 1-hour blocks => 16 slots
export const TIME_SLOTS = Array.from({ length: 16 }, (_, i) => i + 6); // 6..21 (hour start)

export type SlotKey = `${Day}-${number}`; // e.g. "Mon-18"

export interface FreeTimeBlock {
  id: string;
  days: Day[];
  fromHour: number; // 0-23
  toHour: number;   // 1-24 (exclusive end)
}

export interface KidProfile {
  id: string;
  username?: string;
  name: string;
  dob: string; // YYYY-MM-DD
  school: string;
  schoolClass: string;
  interests: Category[];
  freeBlocks: FreeTimeBlock[];
  avatarColor?: string;
}

export interface AdultProfile {
  id: string;
  username?: string;
  name: string;
  email: string;
  dob: string;
  occupation: string;
  interests: Category[];
  freeBlocks: FreeTimeBlock[];
  avatarColor?: string;
}

export interface LearnerProfile {
  username?: string;
  name: string;
  email: string;
  dob: string; // YYYY-MM-DD
  occupation: string;
  country: string;
  state: string;
  city: string;
  area: string;
  address: string;
  homePin?: string; // Google Maps URL or "lat,lng" — used to compute distance to classes
  interests: Category[];
  preferredMode: Mode | "Any";
  freeBlocks: FreeTimeBlock[];
  kids: KidProfile[];
  adults: AdultProfile[];
  activeKidId: string | null; // null = self
  avatarColor?: string;
  avatarDataUrl?: string;
  savedListings?: string[];
  completedListings?: string[];
}

export interface SocialLinks {
  instagram?: string;
  facebook?: string;
  youtube?: string;
  twitter?: string;
  linkedin?: string;
  whatsapp?: string;
  website?: string;
}

export interface ContactInfo {
  phone?: string;       // raw, used for tel:
  whatsapp?: string;    // raw, used for wa.me (digits only)
  mapsUrl?: string;     // pre-built Google Maps directions URL OR full address
}

export interface ProviderProfile {
  username?: string;
  businessName: string;
  bio: string;
  country: string;
  state: string;
  city: string;
  area: string;
  pinCode?: string;
  address: string;
  contact: string;
  categories: Category[];
  yearsExperience?: number;
  languages?: string[];
  socials?: SocialLinks;
  contactInfo?: ContactInfo;
  email?: string;
  verifiedEmail?: string;       // last-verified email
  verifiedWhatsapp?: string;    // last-verified WhatsApp number (digits)
  avatarDataUrl?: string;
}

export interface SeatInfo {
  total: number;
  occupied: number;
}

export type PriceUnit = "session" | "month";

export interface Listing {
  id: string;
  providerId: string; // "self" for current user, or seed id
  providerUserId?: string; // Supabase auth user id of the provider — required for chat
  providerName: string;
  country: string;
  state: string;
  city: string;
  area: string;
  pinCode?: string;
  title: string;
  description: string;
  category: Category;
  ageGroup: AgeGroup;
  mode: Mode;
  venue?: string;
  price?: string;            // legacy free-form (kept for backward compat)
  priceAmount?: number;      // numeric amount (home country) — offline / default
  priceUnit?: PriceUnit;     // per session or per month
  intlPriceAmount?: number;  // international price (offline / default)
  intlPriceCurrency?: string; // ISO code, default "USD"
  onlinePriceAmount?: number;     // home-country price for online sessions
  onlineIntlPriceAmount?: number; // international price for online sessions
  onlinePriceUnit?: PriceUnit;     // per session or per month for online (defaults to priceUnit)
  onlineSessionsPerMonth?: number; // shown when onlinePriceUnit === "month"
  durationMins?: number;     // class duration in minutes
  sessionsPerMonth?: number; // shown when priceUnit === "month"
  trial: boolean;
  slots: SlotKey[];          // Offline slots when mode === "Both"; otherwise the class's only schedule
  onlineSlots?: SlotKey[];   // Used only when mode === "Both" — separate weekly online batches
  seatsBySlot?: Record<string, SeatInfo>; // seats per offline slot
  onlineSeatsBySlot?: Record<string, SeatInfo>; // seats per online slot (Both mode)
  languages?: string[];
  teachesInternationally?: boolean; // for online/both classes
  locationPin?: string;       // Google Maps URL or "lat,lng" used for Directions button
  startDate?: string;         // YYYY-MM-DD — class start
  endDate?: string;           // YYYY-MM-DD — class end (omit when continuous)
  continuous?: boolean;       // runs continuously until stopped
  draft?: boolean;            // true = saved as draft, hidden from public discovery
  createdAt: number;
  socials?: SocialLinks;     // optional override / for seed providers
  contactInfo?: ContactInfo; // optional override; falls back to provider's
}

export type RequestStatus = "Pending" | "Approved" | "Declined";

export interface JoinRequest {
  id: string;
  listingId: string;
  learnerName: string;
  learnerUsername?: string;
  learnerUserId?: string; // Supabase auth user id of the learner — needed for chat
  forKidName?: string;
  slot: SlotKey;
  note: string;
  isTrial?: boolean;
  status: RequestStatus;
  converted?: boolean;
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  addedByTutor?: boolean;
  createdAt: number;
}

export interface Rating {
  id: string;
  listingId: string;
  byName: string;
  stars: number;     // 1-5
  comment: string;
  createdAt: number;
}

export type AppMode = "learner" | "provider";

export interface AppState {
  onboarded: boolean;
  mode: AppMode;
  city: City | "";
  learner: LearnerProfile;
  provider: ProviderProfile;
  listings: Listing[]; // user-created
  requests: JoinRequest[];
  ratings: Rating[];
}
