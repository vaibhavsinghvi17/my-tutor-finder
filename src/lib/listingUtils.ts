import { Listing, PriceUnit } from "./types";

export function formatPrice(listing: Pick<Listing, "price" | "priceAmount" | "priceUnit">): string | null {
  if (typeof listing.priceAmount === "number" && listing.priceAmount > 0) {
    const unit: PriceUnit = listing.priceUnit ?? "session";
    const label = unit === "month" ? "/ month" : "/ session";
    return `₹${listing.priceAmount.toLocaleString("en-IN")} ${label}`;
  }
  return listing.price?.trim() || null;
}

export function formatDuration(mins?: number): string | null {
  if (!mins || mins <= 0) return null;
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h} hr` : `${h}h ${m}m`;
}
