import { Listing, PriceUnit } from "./types";
import { FxRates, convertFromINR, currencyForCountry, formatMoney } from "./currency";

type PriceListing = Pick<Listing,
  "price" | "priceAmount" | "priceUnit" | "intlPriceAmount" | "intlPriceCurrency"
  | "onlinePriceAmount" | "onlineIntlPriceAmount" | "country" | "mode"
>;

function unitLabel(unit: PriceUnit) {
  return unit === "month" ? "/ month" : "/ session";
}

function fmt(amount: number, ccy: string, unit: PriceUnit) {
  return `${formatMoney(amount, ccy)} ${unitLabel(unit)}`;
}

/**
 * Resolve a price for a single delivery mode. Behavior:
 *  - Same country: show provider's INR price.
 *  - Different country & provider set intl override: show that.
 *  - Different country & no override: auto-convert INR → viewer's currency
 *    using cached FX rates. Falls back to INR if rates not loaded yet.
 */
function priceForMode(
  l: PriceListing,
  modeKind: "Online" | "Offline",
  viewerCountry?: string,
  rates?: FxRates | null,
): string | null {
  const unit: PriceUnit = l.priceUnit ?? "session";
  const isIntl = !!viewerCountry && !!l.country && viewerCountry !== l.country;

  // Pick the right INR base + intl override for this mode
  const inrBase = modeKind === "Online" && typeof l.onlinePriceAmount === "number" && l.onlinePriceAmount > 0
    ? l.onlinePriceAmount
    : (typeof l.priceAmount === "number" && l.priceAmount > 0 ? l.priceAmount : undefined);

  const intlOverride = modeKind === "Online" && typeof l.onlineIntlPriceAmount === "number" && l.onlineIntlPriceAmount > 0
    ? l.onlineIntlPriceAmount
    : (typeof l.intlPriceAmount === "number" && l.intlPriceAmount > 0 ? l.intlPriceAmount : undefined);

  const intlCcy = l.intlPriceCurrency || currencyForCountry(viewerCountry);

  if (isIntl) {
    // Provider override wins; auto-convert if viewer's currency differs.
    if (typeof intlOverride === "number") {
      const viewerCcy = currencyForCountry(viewerCountry);
      if (viewerCcy && viewerCcy !== intlCcy && rates) {
        // Convert override → INR equivalent → viewer currency.
        // Override is in intlCcy; INR-base rate is units per 1 INR.
        const intlPerInr = rates[intlCcy];
        const viewerPerInr = rates[viewerCcy];
        if (intlPerInr && viewerPerInr) {
          const inrEquivalent = intlOverride / intlPerInr;
          return fmt(inrEquivalent * viewerPerInr, viewerCcy, unit);
        }
      }
      return fmt(intlOverride, intlCcy, unit);
    }
    // No override → auto-convert INR base to viewer's currency.
    if (typeof inrBase === "number") {
      const viewerCcy = currencyForCountry(viewerCountry);
      const converted = convertFromINR(inrBase, viewerCcy, rates ?? null);
      if (converted != null) return fmt(converted, viewerCcy, unit);
      return fmt(inrBase, "INR", unit);
    }
    return null;
  }

  if (typeof inrBase === "number") return fmt(inrBase, "INR", unit);
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
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h} hr` : `${h}h ${m}m`;
}
