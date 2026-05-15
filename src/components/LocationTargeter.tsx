import { useMemo, useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  COUNTRIES, STATES_BY_COUNTRY, LOCALITIES_BY_CITY, allKnownCities,
} from "@/lib/locations";
import { MapPin, X, Globe2, Building2, Map as MapIcon, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";

export type TargetKind = "country" | "state" | "city" | "area";

export interface TargetEntry {
  kind: TargetKind;
  value: string;
}

interface Props {
  value: TargetEntry[];
  onChange: (next: TargetEntry[]) => void;
  placeholder?: string;
}

const KIND_META: Record<TargetKind, { label: string; icon: any; color: string }> = {
  country: { label: "Country", icon: Globe2, color: "text-blue-600" },
  state: { label: "State", icon: MapIcon, color: "text-violet-600" },
  city: { label: "City", icon: Building2, color: "text-emerald-600" },
  area: { label: "Area", icon: Navigation, color: "text-amber-600" },
};

interface Suggestion extends TargetEntry {
  context?: string;
}

function buildSuggestions(query: string): Suggestion[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const out: Suggestion[] = [];

  // Countries
  for (const c of COUNTRIES) {
    if (c.name.toLowerCase().includes(q)) {
      out.push({ kind: "country", value: c.name });
    }
  }
  // States + Cities
  for (const [country, states] of Object.entries(STATES_BY_COUNTRY)) {
    for (const [state, cities] of Object.entries(states)) {
      if (state.toLowerCase().includes(q)) {
        out.push({ kind: "state", value: state, context: country });
      }
      for (const city of cities) {
        if (city.toLowerCase().includes(q)) {
          out.push({ kind: "city", value: city, context: `${state}, ${country}` });
        }
      }
    }
  }
  // Localities / areas
  for (const [city, areas] of Object.entries(LOCALITIES_BY_CITY)) {
    for (const a of areas) {
      if (a.toLowerCase().includes(q)) {
        out.push({ kind: "area", value: a, context: city });
      }
    }
  }
  // De-dupe by kind+value
  const seen = new Set<string>();
  return out.filter((s) => {
    const k = `${s.kind}:${s.value}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  }).slice(0, 8);
}

export function LocationTargeter({ value, onChange, placeholder }: Props) {
  const [q, setQ] = useState("");
  const [openList, setOpenList] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => buildSuggestions(q), [q]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpenList(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function add(entry: TargetEntry) {
    if (value.some((v) => v.kind === entry.kind && v.value.toLowerCase() === entry.value.toLowerCase())) {
      setQ("");
      return;
    }
    onChange([...value, entry]);
    setQ("");
    setOpenList(false);
  }

  function remove(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && q.trim()) {
      e.preventDefault();
      // First suggestion if any, else add as free-text city
      if (suggestions.length > 0) add(suggestions[0]);
      else add({ kind: "city", value: q.trim() });
    } else if (e.key === "Backspace" && !q && value.length) {
      remove(value.length - 1);
    }
  }

  return (
    <div ref={wrapRef} className="relative">
      <div className="min-h-9 flex flex-wrap items-center gap-1 rounded-md border border-input bg-background px-2 py-1.5 focus-within:ring-2 focus-within:ring-ring">
        {value.map((v, i) => {
          const meta = KIND_META[v.kind];
          const Icon = meta.icon;
          return (
            <Badge key={`${v.kind}-${v.value}-${i}`} variant="secondary" className="gap-1 pr-1 font-normal">
              <Icon className={cn("h-3 w-3", meta.color)} />
              <span className="text-xs">{v.value}</span>
              <button
                type="button"
                onClick={() => remove(i)}
                className="ml-0.5 rounded hover:bg-muted-foreground/20 p-0.5"
                aria-label={`Remove ${v.value}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          );
        })}
        <Input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpenList(true); }}
          onFocus={() => setOpenList(true)}
          onKeyDown={onKeyDown}
          placeholder={value.length ? "" : (placeholder ?? "Search countries, cities, areas…")}
          className="flex-1 min-w-[120px] h-7 border-0 px-1 py-0 text-sm shadow-none focus-visible:ring-0"
        />
      </div>

      {openList && (q.trim() ? suggestions.length > 0 : value.length === 0) && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg overflow-hidden">
          {q.trim() === "" ? (
            <div className="p-2 text-xs text-muted-foreground">
              Type to search locations — countries, states, cities, or areas.
            </div>
          ) : (
            <ul className="max-h-60 overflow-y-auto py-1">
              {suggestions.map((s, i) => {
                const meta = KIND_META[s.kind];
                const Icon = meta.icon;
                return (
                  <li key={`${s.kind}-${s.value}-${i}`}>
                    <button
                      type="button"
                      onClick={() => add(s)}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-left hover:bg-muted"
                    >
                      <Icon className={cn("h-3.5 w-3.5 shrink-0", meta.color)} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm truncate">{s.value}</div>
                        {s.context && (
                          <div className="text-[10px] text-muted-foreground truncate">{s.context}</div>
                        )}
                      </div>
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{meta.label}</span>
                    </button>
                  </li>
                );
              })}
              {q.trim() && (
                <li className="border-t">
                  <button
                    type="button"
                    onClick={() => add({ kind: "city", value: q.trim() })}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-left hover:bg-muted text-xs text-muted-foreground"
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    Use "<span className="text-foreground font-medium">{q.trim()}</span>" as custom location
                  </button>
                </li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export function targetsToString(t: TargetEntry[]): string {
  return t.map((e) => e.value).join(", ");
}
