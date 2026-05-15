import { Listing, PriceUnit } from "./types";
import { FxRates, convertFromINR, currencyForCountry, formatMoney } from "./currency";

type PriceListing = Pick<Listing,
  "price" | "priceAmount" | "priceUnit" | "intlPriceAmount" | "intlPriceCurrency"
  | "onlinePriceAmount" | "onlineIntlPriceAmount" | "onlinePriceUnit" | "onlineSessionsPerMonth"
  | "country" | "mode" | "sessionsPerMonth"
>;

function unitLabel(unit: PriceUnit, sessionsPerMonth?: number) {
  if (unit === "month") {
    return sessionsPerMonth && sessionsPerMonth > 0
      ? `/ month · ${sessionsPerMonth} session${sessionsPerMonth === 1 ? "" : "s"}`
      : "/ month";
  }
  return "/ session";
}

function fmt(amount: number, ccy: string, unit: PriceUnit, sessionsPerMonth?: number) {
  return `${formatMoney(amount, ccy)} ${unitLabel(unit, sessionsPerMonth)}`;
}

function priceForMode(
  l: PriceListing,
  modeKind: "Online" | "Offline",
  viewerCountry?: string,
  rates?: FxRates | null,
): string | null {
  const isOnline = modeKind === "Online";
  const unit: PriceUnit = isOnline
    ? (l.onlinePriceUnit ?? l.priceUnit ?? "session")
    : (l.priceUnit ?? "session");
  const sessionsPM = isOnline
    ? (l.onlineSessionsPerMonth ?? (l.onlinePriceUnit ? undefined : l.sessionsPerMonth))
    : l.sessionsPerMonth;
  const isIntl = !!viewerCountry && !!l.country && viewerCountry !== l.country;

  const inrBase = isOnline && typeof l.onlinePriceAmount === "number" && l.onlinePriceAmount > 0
    ? l.onlinePriceAmount
    : (typeof l.priceAmount === "number" && l.priceAmount > 0 ? l.priceAmount : undefined);

  const intlOverride = isOnline && typeof l.onlineIntlPriceAmount === "number" && l.onlineIntlPriceAmount > 0
    ? l.onlineIntlPriceAmount
    : (typeof l.intlPriceAmount === "number" && l.intlPriceAmount > 0 ? l.intlPriceAmount : undefined);

  if (isIntl) {
    const baseInr = typeof intlOverride === "number" ? intlOverride : (typeof inrBase === "number" ? inrBase : undefined);
    if (typeof baseInr === "number") {
      const viewerCcy = currencyForCountry(viewerCountry);
      const converted = convertFromINR(baseInr, viewerCcy, rates ?? null);
      if (converted != null) return fmt(converted, viewerCcy, unit, sessionsPM);
      return fmt(baseInr, "INR", unit, sessionsPM);
    }
    return null;
  }

  if (typeof inrBase === "number") return fmt(inrBase, "INR", unit, sessionsPM);
  return null;
}

export function formatPrice(
  listing: PriceListing,
  viewerCountry?: string,
  rates?: FxRates | null,
): string | null {
  if (listing.mode === "Both") {
    const on = priceForMode(listing, "Online", viewerCountry, rates);
    const off = priceForMode(listing, "Offline", viewerCountry, rates);
    if (on && off && on !== off) return `Online ${on} · Offline ${off}`;
    return on || off || listing.price?.trim() || null;
  }
  const kind = listing.mode === "Online" ? "Online" : "Offline";
  return priceForMode(listing, kind, viewerCountry, rates) || listing.price?.trim() || null;
}

export function formatDuration(mins?: number): string | null {
  if (!mins || mins <= 0) return null;
  if (mins < 60) return `${mins} min / session`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h} hr / session` : `${h}h ${m}m / session`;
}

export function formatCourseLength(days?: number): string | null {
  if (!days || days <= 0) return null;
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} course`;
  if (days % 7 === 0 && days < 60) {
    const w = days / 7;
    return `${w} week${w === 1 ? "" : "s"} course`;
  }
  if (days % 30 === 0) {
    const mo = days / 30;
    return `${mo} month${mo === 1 ? "" : "s"} course`;
  }
  return `${days} days course`;
}
