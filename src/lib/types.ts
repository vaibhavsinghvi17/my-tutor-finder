export type Category =
  | "Academics"
  | "Music"
  | "Dance"
  | "Sports"
  | "Art"
  | "Coding"
  | "Yoga"
  | "Languages"
  | "Other";

export const CATEGORIES: Category[] = [
  "Academics", "Music", "Dance", "Sports", "Art", "Coding", "Yoga", "Languages", "Other",
];

export type Mode = "Online" | "Offline" | "Both";
export type AgeGroup = "Kids" | "Teens" | "Adults" | "All";

export const AGE_GROUPS: AgeGroup[] = ["Kids", "Teens", "Adults", "All"];

export const CITIES = [
  "Bengaluru", "Mumbai", "Delhi", "Hyderabad", "Chennai", "Pune", "Kolkata",
  "Ahmedabad", "Jaipur", "Other",
] as const;
export type City = (typeof CITIES)[number];

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
  name: string;
  dob: string; // YYYY-MM-DD
  school: string;
  schoolClass: string;
  interests: Category[];
  freeBlocks: FreeTimeBlock[];
}

export interface LearnerProfile {
  name: string;
  email: string;
  dob: string; // YYYY-MM-DD
  occupation: string;
  city: City | "";
  area: string;
  address: string;
  interests: Category[];
  preferredMode: Mode | "Any";
  freeBlocks: FreeTimeBlock[];
  kids: KidProfile[];
  activeKidId: string | null; // null = self
}

export interface ProviderProfile {
  businessName: string;
  bio: string;
  city: City | "";
  area: string;
  address: string;
  contact: string;
  categories: Category[];
}

export interface Listing {
  id: string;
  providerId: string; // "self" for current user, or seed id
  providerName: string;
  city: City;
  area: string;
  title: string;
  description: string;
  category: Category;
  ageGroup: AgeGroup;
  mode: Mode;
  venue?: string;
  price?: string;
  trial: boolean;
  slots: SlotKey[];
  createdAt: number;
}

export type RequestStatus = "Pending" | "Approved" | "Declined";

export interface JoinRequest {
  id: string;
  listingId: string;
  learnerName: string;
  forKidName?: string;
  slot: SlotKey;
  note: string;
  status: RequestStatus;
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
}
