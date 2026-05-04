import { useMemo, useState } from "react";
import { ChevronDown, Plus, Search, X, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { INTEREST_CATALOG } from "@/lib/interestCatalog";

interface Props {
  value: string[];
  onChange: (next: string[]) => void;
  /** Additional interests already created (custom / remote) to merge into "Other". */
  extra?: string[];
  /** Called when a custom interest is added (useful to persist globally). */
  onAddCustom?: (name: string) => void | Promise<void>;
}

export function InterestPicker({ value, onChange, extra = [], onAddCustom }: Props) {
  const [query, setQuery] = useState("");
  const [openCat, setOpenCat] = useState<string | null>(null);

  // Build catalog merged with extras (extras that don't match any group go under "Other")
  const catalog = useMemo(() => {
    const known = new Set(INTEREST_CATALOG.flatMap((g) => g.subcategories.map((s) => s.toLowerCase())));
    const knownCats = new Set(INTEREST_CATALOG.map((g) => g.name.toLowerCase()));
    const extrasUnclassified = extra.filter(
      (e) => !known.has(e.toLowerCase()) && !knownCats.has(e.toLowerCase()),
    );
    return INTEREST_CATALOG.map((g) =>
      g.name === "Other" ? { ...g, subcategories: [...g.subcategories, ...extrasUnclassified] } : g,
    );
  }, [extra]);

  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!q) return catalog;
    return catalog
      .map((g) => ({
        ...g,
        subcategories: g.subcategories.filter(
          (s) => s.toLowerCase().includes(q) || g.name.toLowerCase().includes(q),
        ),
      }))
      .filter((g) => g.subcategories.length > 0);
  }, [catalog, q]);

  const exactExists = useMemo(() => {
    if (!q) return true;
    return catalog.some((g) =>
      g.subcategories.some((s) => s.toLowerCase() === q) || g.name.toLowerCase() === q,
    );
  }, [catalog, q]);

  function toggle(name: string) {
    if (value.includes(name)) onChange(value.filter((v) => v !== name));
    else onChange([...value, name]);
  }

  async function addCustom() {
    const v = query.trim();
    if (!v) return;
    if (!value.includes(v)) onChange([...value, v]);
    if (onAddCustom) await onAddCustom(v);
    setQuery("");
  }

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value.slice(0, 40))}
          placeholder="Search interests…"
          className="pl-8 pr-8 h-9"
          onKeyDown={(e) => {
            if (e.key === "Enter" && query.trim() && !exactExists) {
              e.preventDefault();
              addCustom();
            }
          }}
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Selected chips */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => toggle(v)}
              className="px-2.5 py-1 rounded-full text-xs bg-primary text-primary-foreground border border-primary inline-flex items-center gap-1 hover:opacity-90"
            >
              {v} <X className="h-3 w-3" />
            </button>
          ))}
        </div>
      )}

      {/* Category dropdowns */}
      <div className="border rounded-md divide-y max-h-[50vh] overflow-y-auto">
        {filtered.length === 0 && (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">
            No matches.
          </div>
        )}
        {filtered.map((g) => {
          const isOpen = q ? true : openCat === g.name;
          const selectedCount = g.subcategories.filter((s) => value.includes(s)).length;
          return (
            <div key={g.name}>
              <button
                type="button"
                onClick={() => !q && setOpenCat(isOpen ? null : g.name)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium hover:bg-muted/50"
              >
                <span className="flex items-center gap-2">
                  {g.name}
                  {selectedCount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                      {selectedCount}
                    </span>
                  )}
                </span>
                {!q && (
                  <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
                )}
              </button>
              {isOpen && (
                <div className="px-3 pb-3 pt-1 flex flex-wrap gap-1.5">
                  {g.subcategories.map((s) => {
                    const active = value.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggle(s)}
                        className={cn(
                          "px-2.5 py-1 rounded-full text-xs border transition-all inline-flex items-center gap-1",
                          active
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background hover:bg-muted",
                        )}
                      >
                        {active && <Check className="h-3 w-3" />}
                        {s}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add custom */}
      {q && !exactExists && (
        <Button type="button" size="sm" variant="outline" onClick={addCustom} className="w-full gap-1">
          <Plus className="h-3.5 w-3.5" /> Add "{query.trim()}" as a new interest
        </Button>
      )}
    </div>
  );
}
