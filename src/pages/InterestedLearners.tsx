import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Lock, Users, Sparkles, MapPin, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useStore } from "@/lib/store";
import { useSubscription } from "@/lib/useSubscription";
import { useInterestedLearners } from "@/lib/useInterestedLearners";
import { SiteFooter } from "@/components/SiteFooter";

export default function InterestedLearners() {
  const navigate = useNavigate();
  const listings = useStore((s) => s.listings).filter((l) => l.providerId === "self");
  const { isGrowth, loading: subLoading } = useSubscription();
  const [filter, setFilter] = useState<string>("all");
  const { rows, loading } = useInterestedLearners(filter === "all" ? undefined : filter);

  const listingById = useMemo(() => {
    const m = new Map(listings.map((l) => [l.id, l] as const));
    return m;
  }, [listings]);

  return (
    <div className="min-h-screen bg-background pb-16">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b">
        <div className="max-w-2xl mx-auto px-4 h-12 flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold text-base flex items-center gap-1.5">
            <Users className="h-4 w-4 text-primary" /> Interested Learners
          </h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {!isGrowth && !subLoading && (
          <Card className="p-3 border-primary/30 bg-primary/5">
            <div className="flex items-start gap-2">
              <Lock className="h-4 w-4 text-primary mt-0.5" />
              <div className="flex-1 text-xs">
                <div className="font-semibold text-foreground">Contact details are hidden</div>
                <div className="text-muted-foreground mt-0.5">
                  Upgrade to Growth to unlock learner names, cities, and contact info.
                </div>
              </div>
              <Button asChild size="sm" className="gap-1">
                <Link to="/pricing"><Sparkles className="h-3.5 w-3.5" /> Upgrade</Link>
              </Button>
            </div>
          </Card>
        )}

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Filter by class</span>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="h-8 text-xs flex-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All classes</SelectItem>
              {listings.map((l) => (
                <SelectItem key={l.id} value={l.id}>{l.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="text-center text-sm text-muted-foreground py-8">Loading…</div>
        ) : rows.length === 0 ? (
          <Card className="p-6 text-center space-y-2">
            <Users className="h-8 w-8 text-muted-foreground mx-auto" />
            <div className="font-medium text-sm">No interested learners yet</div>
            <div className="text-xs text-muted-foreground">
              When learners save your class, they'll show up here.
            </div>
          </Card>
        ) : (
          <div className="space-y-2">
            {rows.map((r) => {
              const listing = listingById.get(r.listing_id);
              return (
                <Card key={`${r.listing_id}-${r.learner_user_id}`} className="p-3">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 grid place-items-center shrink-0">
                      <UserIcon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-medium text-sm truncate">
                          {r.is_unlocked ? (r.display_name || "Learner") : "•••••••"}
                        </span>
                        {!r.is_unlocked && (
                          <Badge variant="outline" className="h-4 px-1.5 text-[10px] gap-0.5">
                            <Lock className="h-2.5 w-2.5" /> Locked
                          </Badge>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                        <span className="truncate">{listing?.title || r.listing_id}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                        <MapPin className="h-3 w-3" />
                        <span>{r.is_unlocked ? (r.city || "—") : "Hidden"}</span>
                        <span>•</span>
                        <span>{r.is_unlocked ? (r.gender || "—") : "Hidden"}</span>
                        <span>•</span>
                        <span>{new Date(r.saved_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {!r.is_unlocked && (
                      <Button asChild size="sm" variant="outline" className="gap-1 h-7 px-2 text-[11px]">
                        <Link to="/pricing"><Lock className="h-3 w-3" /> Unlock</Link>
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
