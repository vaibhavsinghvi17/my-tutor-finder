// Lightweight FX utility: fetches INR-based rates from a free public API,
// caches them in localStorage for 12h, and maps country → currency.

const API = "https://open.er-api.com/v6/latest/INR";
const CACHE_KEY = "fx_rates_inr_v1";
const TTL_MS = 12 * 60 * 60 * 1000; // 12h

export type FxRates = Record<string, number>; // currency code -> units per 1 INR

// Most common country → currency mapping (ISO 3166 → ISO 4217)
const COUNTRY_TO_CURRENCY: Record<string, string> = {
  India: "INR",
  "United States": "USD", USA: "USD", "United States of America": "USD",
  Canada: "CAD",
  "United Kingdom": "GBP", UK: "GBP", England: "GBP",
  Australia: "AUD", "New Zealand": "NZD",
  Singapore: "SGD", Malaysia: "MYR", Indonesia: "IDR", Philippines: "PHP",
  Thailand: "THB", Vietnam: "VND", Japan: "JPY", "South Korea": "KRW", China: "CNY",
  "Hong Kong": "HKD", Taiwan: "TWD",
  "United Arab Emirates": "AED", UAE: "AED", "Saudi Arabia": "SAR", Qatar: "QAR",
  Kuwait: "KWD", Oman: "OMR", Bahrain: "BHD", Israel: "ILS",
  Germany: "EUR", France: "EUR", Italy: "EUR", Spain: "EUR", Netherlands: "EUR",
  Belgium: "EUR", Ireland: "EUR", Portugal: "EUR", Austria: "EUR", Greece: "EUR",
  Finland: "EUR", Luxembourg: "EUR",
  Switzerland: "CHF", Sweden: "SEK", Norway: "NOK", Denmark: "DKK", Poland: "PLN",
  Turkey: "TRY", Russia: "RUB",
  "South Africa": "ZAR", Egypt: "EGP", Nigeria: "NGN", Kenya: "KES",
  Brazil: "BRL", Mexico: "MXN", Argentina: "ARS", Chile: "CLP", Colombia: "COP",
  Pakistan: "PKR", Bangladesh: "BDT", "Sri Lanka": "LKR", Nepal: "NPR",
};

export const CURRENCY_SYMBOL: Record<string, string> = {
  INR: "₹", USD: "$", EUR: "€", GBP: "£", JPY: "¥", AUD: "A$", CAD: "C$",
  SGD: "S$", AED: "AED", HKD: "HK$", NZD: "NZ$", CHF: "CHF",
};

export function currencyForCountry(country?: string): string {
  if (!country) return "USD";
  return COUNTRY_TO_CURRENCY[country.trim()] || "USD";
}

export function formatMoney(amount: number, currency: string): string {
  const sym = CURRENCY_SYMBOL[currency];
  const rounded = amount >= 100 ? Math.round(amount) : Math.round(amount * 100) / 100;
  const locale = currency === "INR" ? "en-IN" : "en-US";
  const num = rounded.toLocaleString(locale, { maximumFractionDigits: rounded >= 100 ? 0 : 2 });
  return sym ? `${sym}${num}` : `${currency} ${num}`;
}

/** Convert an INR amount into the target currency using cached rates. */
export function convertFromINR(inrAmount: number, targetCurrency: string, rates: FxRates | null): number | null {
  if (!rates) return null;
  if (targetCurrency === "INR") return inrAmount;
  const r = rates[targetCurrency];
  if (!r || !isFinite(r)) return null;
  return inrAmount * r;
}

interface Cached { ts: number; rates: FxRates }

export async function getFxRates(): Promise<FxRates | null> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      const c: Cached = JSON.parse(raw);
      if (c && Date.now() - c.ts < TTL_MS && c.rates) return c.rates;
    }
  } catch { /* ignore */ }

  try {
    const r = await fetch(API);
    if (!r.ok) return null;
    const j = await r.json();
    const rates: FxRates | undefined = j?.rates;
    if (!rates) return null;
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), rates })); } catch {}
    return rates;
  } catch {
    return null;
  }
}
