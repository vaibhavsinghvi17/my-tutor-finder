import { useMemo, useState } from "react";
import { TopBar } from "@/components/TopBar";
import { ListingCard } from "@/components/ListingCard";
import { getAllListings, store, useStore } from "@/lib/store";
import { scoreListings } from "@/lib/suggest";
import { CATEGORIES, Category, Mode } from "@/lib/types";
import { useCategories } from "@/lib/useCategories";
import { ageFromDob } from "@/lib/timeUtils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, UserCircle2, Baby, Plus, MapPin, Home, Globe2, Clock, SlidersHorizontal, Check, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useActiveBoosts } from "@/lib/useBoosts";

import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type SortOption = "recommended" | "price-asc" | "price-desc" | "popularity" | "newest";
type TimeOfDay = "all" | "morning" | "afternoon" | "evening";

function listingPrice(l: any): number | null {
  if (typeof l.priceAmount === "number") return l.priceAmount;
  if (typeof l.price === "string") {
    const m = l.price.replace(/[, ]/g, "").match(/(\d+(?:\.\d+)?)/);
    if (m) return parseFloat(m[1]);
  }
  return null;
}

function listingHasTimeOfDay(slots: string[], tod: TimeOfDay): boolean {
  if (tod === "all") return true;
  return slots.some((s) => {
    const h = parseInt(s.split("-")[1] ?? "", 10);
    if (Number.isNaN(h)) return false;
    if (tod === "morning") return h >= 5 && h < 12;
    if (tod === "afternoon") return h >= 12 && h < 17;
    if (tod === "evening") return h >= 17 && h <= 23;
    return false;
  });
}

const Discover = () => {
  const navigate = useNavigate();
  const state = useStore((s) => s);
  const ratings = useStore((s) => s.ratings);
  const requests = useStore((s) => s.requests);
  const { names: categoryNames } = useCategories();
  const { boosts } = useActiveBoosts();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category | "all">("all");
  const [mode, setMode] = useState<Mode | "all">("all");
  const [sortBy, setSortBy] = useState<SortOption>("recommended");
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>("all");
  const [scope, setScope] = useState<"local" | "world">("local");
  const [viewMode, setViewMode] = useState<"interests" | "all">("all");
  // Pin code is auto-derived from learner profile (no manual filter input)
  const pinFilter = state.learner.pinCode ?? "";

  const allListings = getAllListings();
  const allCategories = Array.from(new Set([...categoryNames, ...CATEGORIES])).sort();

  const popularityFor = (id: string) => {
    const r = requests.filter((x) => x.listingId === id).length;
    const v = ratings.filter((x) => x.listingId === id).length;
    const seed = id.startsWith("seed-") ? ((id.charCodeAt(id.length - 1) * 7) % 40) + 5 : 0;
    return r + v + seed;
  };

  const scored = useMemo(() => {
    let scoredList = scoreListings(state, allListings);
    if (query.trim()) {
      const q = query.toLowerCase();
      scoredList = scoredList.filter(
        ({ listing }) =>
          listing.title.toLowerCase().includes(q) ||
          listing.providerName.toLowerCase().includes(q) ||
          listing.description.toLowerCase().includes(q),
      );
    }
    if (category !== "all") scoredList = scoredList.filter((s) => s.listing.category === category);
    if (mode !== "all") scoredList = scoredList.filter((s) => s.listing.mode === mode || s.listing.mode === "Both");
    // city filter removed — using pin code prefix matching instead
    if (pinFilter.trim()) {
      const pin = pinFilter.trim();
      const prefix = pin.slice(0, Math.min(3, pin.length));
      scoredList = scoredList.filter((s) => {
        const lp = (s.listing as any).pinCode as string | undefined;
        if (!lp) return s.listing.teachesInternationally === true || s.listing.mode === "Online";
        return lp === pin || lp.startsWith(prefix);
      });
    }
    if (timeOfDay !== "all") scoredList = scoredList.filter((s) => listingHasTimeOfDay([...(s.listing.slots as any), ...((s.listing as any).onlineSlots ?? [])], timeOfDay));

    // Tab scope: local vs around the world
    const learnerCountry = state.learner.country;
    if (learnerCountry) {
      if (scope === "local") {
        scoredList = scoredList.filter((s) => s.listing.country === learnerCountry);
      } else {
        scoredList = scoredList.filter((s) =>
          s.listing.country !== learnerCountry &&
          (s.listing.teachesInternationally === true || s.listing.mode === "Online" || s.listing.mode === "Both"),
        );
      }
    } else if (scope === "world") {
      scoredList = scoredList.filter((s) =>
        s.listing.teachesInternationally === true || s.listing.mode === "Online" || s.listing.mode === "Both",
      );
    }

    // Smart filter by current profile interests
    const activeAdult = state.learner.activeKidId ? state.learner.adults.find((a) => a.id === state.learner.activeKidId) : null;
    const activeKidP = state.learner.activeKidId ? state.learner.kids.find((k) => k.id === state.learner.activeKidId) : null;
    const myInterests = (activeAdult?.interests || activeKidP?.interests || state.learner.interests || []).map((x) => x.toLowerCase());
    if (viewMode === "interests" && myInterests.length > 0) {
      scoredList = scoredList.filter((s) => {
        const cat = s.listing.category?.toLowerCase() || "";
        const title = s.listing.title?.toLowerCase() || "";
        return myInterests.some((i) => cat.includes(i) || i.includes(cat) || title.includes(i));
      });
    }
    // "all" and "everything" both show all classes; "everything" intent: explicit show-all
    // (kept separate so user can express intent; both behave the same for filtering)

    if (sortBy === "price-asc" || sortBy === "price-desc") {
      scoredList = [...scoredList].sort((a, b) => {
        const pa = listingPrice(a.listing);
        const pb = listingPrice(b.listing);
        if (pa == null && pb == null) return 0;
        if (pa == null) return 1;
        if (pb == null) return -1;
        return sortBy === "price-asc" ? pa - pb : pb - pa;
      });
    } else if (sortBy === "popularity") {
      scoredList = [...scoredList].sort((a, b) => popularityFor(b.listing.id) - popularityFor(a.listing.id));
    } else if (sortBy === "newest") {
      scoredList = [...scoredList].sort((a, b) => (b.listing.createdAt ?? 0) - (a.listing.createdAt ?? 0));
    }
    // Boosted listings always come first (after other sorts)
    scoredList = [...scoredList].sort((a, b) => {
      const ab = boostedIds.has(a.listing.id) ? 1 : 0;
      const bb = boostedIds.has(b.listing.id) ? 1 : 0;
      return bb - ab;
    });
    return scoredList;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, query, category, mode, pinFilter, sortBy, timeOfDay, scope, ratings, requests, viewMode, boosts]);

  const activeKid = state.learner.activeKidId
    ? state.learner.kids.find((k) => k.id === state.learner.activeKidId)
    : null;
  const greeting = activeKid
    ? `Browsing for ${activeKid.name}`
    : state.learner.name
      ? `Hi ${state.learner.name.split(" ")[0]}`
      : "Find your next class";

  const hasProfile = !!state.learner.city || state.learner.interests.length > 0;

  return (
    <div className="min-h-screen">
      <TopBar />
      <main className="container py-6 space-y-6">
        <button
          onClick={() => navigate(-1)}
          className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>
        <section className="space-y-3">
          <div className="flex items-end justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">{greeting}</h1>
              <p className="text-sm text-muted-foreground">
                Suggestions ranked by your area, interests and free time.
              </p>
            </div>
            <ProfileSelector />
          </div>
        </section>

        {!hasProfile && (
          <Card className="p-4 sm:p-5 bg-gradient-hero border-primary/20 flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <h3 className="font-semibold">Get smarter suggestions</h3>
              <p className="text-sm text-muted-foreground">
                Add your city, interests and free times to see classes tailored for you.
              </p>
            </div>
            <Button asChild>
              <Link to="/profile/learner">Set up profile</Link>
            </Button>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setScope("local")}
            className={cn(
              "rounded-xl border-2 p-3 text-left transition-all",
              scope === "local"
                ? "border-primary bg-primary/10 shadow-elegant"
                : "border-primary/30 bg-card hover:border-primary/60",
            )}
          >
            <span className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-primary">
              <Home className="h-3.5 w-3.5 shrink-0" /> Learn from the locals
            </span>
            <span className="block text-[10px] text-muted-foreground leading-snug mt-1">
              Tutors in your area
            </span>
          </button>
          <button
            type="button"
            onClick={() => setScope("world")}
            className={cn(
              "rounded-xl border-2 p-3 text-left transition-all",
              scope === "world"
                ? "border-accent bg-accent/15 shadow-elegant"
                : "border-accent/40 bg-card hover:border-accent/70",
            )}
          >
            <span className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold" style={{ color: "hsl(140 60% 22%)" }}>
              <Globe2 className="h-3.5 w-3.5 shrink-0" /> From around the world
            </span>
            <span className="block text-[10px] text-muted-foreground leading-snug mt-1">
              Learn French from a tutor in France, and more
            </span>
          </button>
        </div>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search classes..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={category} onValueChange={(v) => setCategory(v as any)}>
            <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {allCategories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={mode} onValueChange={(v) => setMode(v as any)}>
            <SelectTrigger><SelectValue placeholder="Mode" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Online & Offline</SelectItem>
              <SelectItem value="Online">Online</SelectItem>
              <SelectItem value="Offline">Offline</SelectItem>
            </SelectContent>
          </Select>
        </section>


        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 rounded-full">
                <Clock className="h-3.5 w-3.5" />
                <span className="text-xs">
                  {timeOfDay === "all" ? "Any time" :
                   timeOfDay === "morning" ? "Morning" :
                   timeOfDay === "afternoon" ? "Afternoon" : "Evening"}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-popover">
              <DropdownMenuLabel className="text-xs">Time of day</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {([
                ["all", "Any time of day"],
                ["morning", "Morning (5am–12pm)"],
                ["afternoon", "Afternoon (12–5pm)"],
                ["evening", "Evening (5–11pm)"],
              ] as const).map(([v, label]) => (
                <DropdownMenuItem key={v} onClick={() => setTimeOfDay(v)}>
                  {timeOfDay === v && <Check className="h-3.5 w-3.5 mr-2" />}
                  <span className={timeOfDay === v ? "" : "ml-[22px]"}>{label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 rounded-full">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span className="text-xs">
                  {sortBy === "recommended" ? "Recommended" :
                   sortBy === "popularity" ? "Most popular" :
                   sortBy === "price-asc" ? "Price ↑" :
                   sortBy === "price-desc" ? "Price ↓" : "Newest"}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-popover">
              <DropdownMenuLabel className="text-xs">Sort by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {([
                ["recommended", "Recommended"],
                ["popularity", "Most popular"],
                ["price-asc", "Price: low to high"],
                ["price-desc", "Price: high to low"],
                ["newest", "Newest first"],
              ] as const).map(([v, label]) => (
                <DropdownMenuItem key={v} onClick={() => setSortBy(v)}>
                  {sortBy === v && <Check className="h-3.5 w-3.5 mr-2" />}
                  <span className={sortBy === v ? "" : "ml-[22px]"}>{label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {(() => {
          const activeAdult = state.learner.activeKidId ? state.learner.adults.find((a) => a.id === state.learner.activeKidId) : null;
          const activeKidP = state.learner.activeKidId ? state.learner.kids.find((k) => k.id === state.learner.activeKidId) : null;
          const myInterests = activeAdult?.interests || activeKidP?.interests || state.learner.interests || [];
          const hasInterests = myInterests.length > 0;
          const opts: Array<{ v: typeof viewMode; label: string; disabled?: boolean }> = [
            { v: "interests", label: "Based on your interests", disabled: !hasInterests },
            { v: "all", label: "All classes" },
          ];
          return (
            <div className="space-y-2 pt-1">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Classes Shown</p>
              <div className="inline-flex flex-wrap gap-1.5 rounded-full border bg-card p-1">
                {opts.map((o) => (
                  <button
                    key={o.v}
                    type="button"
                    disabled={o.disabled}
                    onClick={() => setViewMode(o.v)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                      viewMode === o.v
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground",
                      o.disabled && "opacity-40 cursor-not-allowed",
                    )}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          );
        })()}

        {scored.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p>No classes match your filters yet.</p>
          </div>
        ) : (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {scored.map(({ listing, reasons }) => (
              <ListingCard key={listing.id} listing={listing} reasons={reasons} />
            ))}
          </section>
        )}
      </main>
    </div>
  );
};

function ProfileSelector() {
  const learner = useStore((s) => s.learner);
  const activeKidId = learner.activeKidId;
  const others = [...learner.adults, ...learner.kids];

  // Hide entirely when no additional profiles exist
  if (others.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-muted-foreground">Browsing for:</span>
      <Button
        variant={activeKidId === null ? "default" : "outline"}
        size="sm"
        onClick={() => store.setActiveKid(null)}
        className="gap-1.5"
      >
        <UserCircle2 className="h-4 w-4" /> Me
      </Button>
      {learner.adults.map((a) => (
        <Button
          key={a.id}
          variant={activeKidId === a.id ? "default" : "outline"}
          size="sm"
          onClick={() => store.setActiveKid(a.id)}
          className="gap-1.5"
        >
          <UserCircle2 className="h-4 w-4" /> {a.name}
        </Button>
      ))}
      {learner.kids.map((k) => (
        <Button
          key={k.id}
          variant={activeKidId === k.id ? "default" : "outline"}
          size="sm"
          onClick={() => store.setActiveKid(k.id)}
          className="gap-1.5"
        >
          <Baby className="h-4 w-4" /> {k.name}
          {ageFromDob(k.dob) !== null && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">{ageFromDob(k.dob)}</Badge>
          )}
        </Button>
      ))}
      <Button asChild variant="ghost" size="sm" className="gap-1">
        <Link to="/profile"><Plus className="h-4 w-4" /> Add profile</Link>
      </Button>
    </div>
  );
}

export default Discover;
