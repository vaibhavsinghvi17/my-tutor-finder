import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Loader2, MapPin, AlertCircle, CheckCircle2 } from "lucide-react";

// Country name -> ISO 3166-1 alpha-2 (Zippopotam.us uses these)
const COUNTRY_TO_ISO: Record<string, string> = {
  "India": "IN",
  "United States": "US",
  "United Kingdom": "GB",
  "United Arab Emirates": "AE",
  "Singapore": "SG",
  "Canada": "CA",
  "Australia": "AU",
  "Germany": "DE",
  "France": "FR",
  "Spain": "ES",
  "Italy": "IT",
  "Netherlands": "NL",
  "Brazil": "BR",
  "Mexico": "MX",
  "Japan": "JP",
  "South Africa": "ZA",
  "New Zealand": "NZ",
  "Switzerland": "CH",
  "Sweden": "SE",
  "Belgium": "BE",
  "Portugal": "PT",
  "Poland": "PL",
};

export interface PinLookup {
  pinCode: string;
  place?: string;
  state?: string;
  country?: string;
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  country?: string;
  onResolved?: (lookup: PinLookup | null) => void;
  placeholder?: string;
}

export function PinCodeInput({ value, onChange, country, onResolved, placeholder }: Props) {
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [info, setInfo] = useState<string>("");

  useEffect(() => {
    const v = value.trim();
    if (!v || v.length < 3) { setStatus("idle"); setInfo(""); onResolved?.(null); return; }
    const iso = country ? COUNTRY_TO_ISO[country] : undefined;
    if (!iso) { setStatus("idle"); setInfo("Pick country to validate"); return; }
    setStatus("loading");
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`https://api.zippopotam.us/${iso.toLowerCase()}/${encodeURIComponent(v)}`, { signal: ctrl.signal });
        if (!res.ok) throw new Error("not found");
        const data = await res.json();
        const place = data.places?.[0]?.["place name"];
        const stateName = data.places?.[0]?.state;
        setStatus("ok");
        setInfo(`${place}${stateName ? ", " + stateName : ""}`);
        onResolved?.({ pinCode: v, place, state: stateName, country: data.country });
      } catch (e: any) {
        if (e.name === "AbortError") return;
        setStatus("err");
        setInfo("No match for this pin code");
        onResolved?.(null);
      }
    }, 400);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [value, country]);

  return (
    <div className="space-y-1">
      <div className="relative">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, 12))}
          placeholder={placeholder ?? "e.g. 560038"}
          className="pr-9"
        />
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
          {status === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
          {status === "ok" && <CheckCircle2 className="h-4 w-4 text-success" />}
          {status === "err" && <AlertCircle className="h-4 w-4 text-destructive" />}
        </div>
      </div>
      {info && (
        <p className={`text-xs flex items-center gap-1 ${status === "err" ? "text-destructive" : "text-muted-foreground"}`}>
          <MapPin className="h-3 w-3" /> {info}
        </p>
      )}
    </div>
  );
}

export const COUNTRY_ISO_MAP = COUNTRY_TO_ISO;
