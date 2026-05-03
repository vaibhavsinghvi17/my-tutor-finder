import { Listing, PriceUnit } from "./types";

type PriceListing = Pick<Listing,
  "price" | "priceAmount" | "priceUnit" | "intlPriceAmount" | "intlPriceCurrency"
  | "onlinePriceAmount" | "onlineIntlPriceAmount" | "country" | "mode"
>;

function fmt(amount: number, ccy: string, unit: PriceUnit) {
  const label = unit === "month" ? "/ month" : "/ session";
  if (ccy === "INR") return `₹${amount.toLocaleString("en-IN")} ${label}`;
  return `${ccy} ${amount.toLocaleString("en-US")} ${label}`;
}

/** Returns the price for a single mode ("Online" or "Offline") taking viewer country into account. */
function priceForMode(listing: PriceListing, modeKind: "Online" | "Offline", viewerCountry?: string): string | null {
  const unit: PriceUnit = listing.priceUnit ?? "session";
  const isIntl = !!viewerCountry && !!listing.country && viewerCountry !== listing.country;
  const intlCcy = listing.intlPriceCurrency || "USD";

  if (modeKind === "Online") {
    if (isIntl && typeof listing.onlineIntlPriceAmount === "number" && listing.onlineIntlPriceAmount > 0) {
      return fmt(listing.onlineIntlPriceAmount, intlCcy, unit);
    }
    if (typeof listing.onlinePriceAmount === "number" && listing.onlinePriceAmount > 0) {
      return fmt(listing.onlinePriceAmount, "INR", unit);
    }
    // fall through to default
  }

  if (isIntl && typeof listing.intlPriceAmount === "number" && listing.intlPriceAmount > 0) {
    return fmt(listing.intlPriceAmount, intlCcy, unit);
  }
  if (typeof listing.priceAmount === "number" && listing.priceAmount > 0) {
    return fmt(listing.priceAmount, "INR", unit);
  }
  return null;
}

export function formatPrice(listing: PriceListing, viewerCountry?: string): string | null {
  if (listing.mode === "Both") {
    const on = priceForMode(listing, "Online", viewerCountry);
    const off = priceForMode(listing, "Offline", viewerCountry);
    if (on && off && on !== off) return `Online ${on} · Offline ${off}`;
    return on || off || listing.price?.trim() || null;
  }
  const kind = listing.mode === "Online" ? "Online" : "Offline";
  return priceForMode(listing, kind, viewerCountry) || listing.price?.trim() || null;
}

export function formatDuration(mins?: number): string | null {
  if (!mins || mins <= 0) return null;
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h} hr` : `${h}h ${m}m`;
}
