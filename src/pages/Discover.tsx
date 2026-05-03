import { useMemo, useState } from "react";
import { TopBar } from "@/components/TopBar";
import { ListingCard } from "@/components/ListingCard";
import { getAllListings, store, useStore } from "@/lib/store";
import { scoreListings } from "@/lib/suggest";
import { CATEGORIES, Category, Mode } from "@/lib/types";
import { allKnownCities } from "@/lib/locations";
import { ageFromDob } from "@/lib/timeUtils";
import { Combobox } from "@/components/Combobox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, UserCircle2, Baby, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";

const Discover = () => {
  const state = useStore((s) => s);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category | "all">("all");
  const [mode, setMode] = useState<Mode | "all">("all");
  const [cityFilter, setCityFilter] = useState<string>(state.city || "all");

  const allListings = getAllListings();

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
    if (cityFilter !== "all") scoredList = scoredList.filter((s) => s.listing.city === cityFilter);
    return scoredList;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, query, category, mode, cityFilter]);

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
              {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
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
          <Combobox
            value={cityFilter === "all" ? "" : cityFilter}
            onChange={(v) => setCityFilter(v || "all")}
            options={allKnownCities()}
            placeholder="All cities"
          />
        </section>

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
