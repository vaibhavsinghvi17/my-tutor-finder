import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { TopBar } from "@/components/TopBar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";
import { useStore } from "@/lib/store";
import { useSubscription } from "@/lib/useSubscription";
import { Sparkles, Eye, MousePointerClick, MessageCircle, Users, Rocket, ArrowRight, Lock } from "lucide-react";

interface Ev {
  id: string;
  listing_id: string;
  event_type: string;
  viewer_city: string | null;
  viewer_age_group: string | null;
  viewer_gender: string | null;
  via_boost_id: string | null;
  created_at: string;
}

const Insights = () => {
  const { user } = useAuth();
  const { isGrowth, loading } = useSubscription();
  const listings = useStore((s) => s.listings);
  const requests = useStore((s) => s.requests);
  const [events, setEvents] = useState<Ev[]>([]);
  const [boostCount, setBoostCount] = useState(0);

  useEffect(() => {
    if (!user || !isGrowth) return;
    (async () => {
      const { data } = await supabase
        .from("listing_events")
        .select("id, listing_id, event_type, viewer_city, viewer_age_group, viewer_gender, via_boost_id, created_at")
        .eq("provider_user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(2000);
      setEvents((data ?? []) as Ev[]);
      const { count } = await supabase
        .from("boosts")
        .select("id", { count: "exact", head: true })
        .eq("provider_user_id", user.id);
      setBoostCount(count ?? 0);
    })();
  }, [user, isGrowth]);

  const stats = useMemo(() => {
    const views = events.filter((e) => e.event_type === "view").length;
    const clicks = events.filter((e) => e.event_type !== "view").length;
    const boostViews = events.filter((e) => e.via_boost_id && e.event_type === "view").length;
    const organicViews = views - boostViews;

    const byCity = new Map<string, number>();
    const byAge = new Map<string, number>();
    events.forEach((e) => {
      if (e.viewer_city) byCity.set(e.viewer_city, (byCity.get(e.viewer_city) ?? 0) + 1);
      if (e.viewer_age_group) byAge.set(e.viewer_age_group, (byAge.get(e.viewer_age_group) ?? 0) + 1);
    });
    const topCities = [...byCity.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    const topAge = [...byAge.entries()].sort((a, b) => b[1] - a[1]);

    const perListing = listings.map((l) => {
      const ev = events.filter((e) => e.listing_id === l.id);
      const v = ev.filter((e) => e.event_type === "view").length;
      const c = ev.filter((e) => e.event_type !== "view").length;
      const r = requests.filter((x) => x.listingId === l.id).length;
      const a = requests.filter((x) => x.listingId === l.id && x.status === "Approved").length;
      return { listing: l, views: v, clicks: c, requests: r, approved: a };
    }).sort((x, y) => y.views - x.views);

    return { views, clicks, boostViews, organicViews, topCities, topAge, perListing };
  }, [events, listings, requests]);

  if (loading) return <div className="min-h-screen"><TopBar /></div>;

  if (!isGrowth) {
    return (
      <div className="min-h-screen">
        <TopBar />
        <main className="container py-10 max-w-2xl">
          <Card className="p-8 text-center space-y-4">
            <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 grid place-items-center">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Insights are a Growth feature</h1>
            <p className="text-sm text-muted-foreground">
              Upgrade to <strong>Growth</strong> to see who's viewing your classes, where they're from,
              how each class performs, and how much extra reach your boosts deliver.
            </p>
            <Button asChild className="gap-1.5"><Link to="/pricing"><Sparkles className="h-4 w-4" /> Upgrade to Growth</Link></Button>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <TopBar />
      <main className="container py-6 space-y-6 max-w-5xl">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Insights</h1>
            <p className="text-sm text-muted-foreground">How your classes are performing.</p>
          </div>
          <Badge className="gap-1 bg-primary text-primary-foreground"><Sparkles className="h-3 w-3" /> Growth</Badge>
        </div>

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Tile icon={Eye} label="Total views" value={stats.views} />
          <Tile icon={MousePointerClick} label="Interactions" value={stats.clicks} sub="contact, request, message" />
          <Tile icon={Rocket} label="Views from Boost" value={stats.boostViews} sub={`${stats.organicViews} organic`} />
          <Tile icon={Users} label="Active boosts run" value={boostCount} />
        </section>

        <section className="space-y-3">
          <h2 className="font-semibold">Per-class performance</h2>
          {stats.perListing.length === 0 ? (
            <Card className="p-6 text-center text-sm text-muted-foreground">No classes yet.</Card>
          ) : stats.perListing.map(({ listing, views, clicks, requests: r, approved }) => {
            const conv = views > 0 ? Math.round((r / views) * 100) : 0;
            return (
              <Card key={listing.id} className="p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <Link to={`/listing/${listing.id}`} className="font-semibold hover:underline">{listing.title}</Link>
                    <p className="text-xs text-muted-foreground">{listing.category} • {listing.city || "—"}</p>
                  </div>
                  <div className="grid grid-cols-4 gap-3 text-center">
                    <Mini label="Views" value={views} />
                    <Mini label="Clicks" value={clicks} />
                    <Mini label="Requests" value={r} />
                    <Mini label="Approved" value={approved} />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-3">
                  <span className="font-medium">Funnel:</span>
                  <span>{views} <ArrowRight className="inline h-3 w-3" /> {r} ({conv}%) <ArrowRight className="inline h-3 w-3" /> {approved}</span>
                </div>
              </Card>
            );
          })}
        </section>

        <section className="grid md:grid-cols-2 gap-3">
          <Card className="p-4 space-y-2">
            <h3 className="font-semibold text-sm">Top cities</h3>
            {stats.topCities.length === 0 ? (
              <p className="text-xs text-muted-foreground">No data yet.</p>
            ) : stats.topCities.map(([city, n]) => (
              <Row key={city} label={city} value={n} max={stats.topCities[0][1]} />
            ))}
          </Card>
          <Card className="p-4 space-y-2">
            <h3 className="font-semibold text-sm">Audience age groups</h3>
            {stats.topAge.length === 0 ? (
              <p className="text-xs text-muted-foreground">No data yet.</p>
            ) : stats.topAge.map(([g, n]) => (
              <Row key={g} label={g} value={n} max={stats.topAge[0][1]} />
            ))}
          </Card>
        </section>

        <section>
          <Card className="p-4 space-y-2">
            <h3 className="font-semibold text-sm flex items-center gap-1.5"><Rocket className="h-4 w-4 text-primary" /> Boost uplift</h3>
            <p className="text-xs text-muted-foreground">
              Boosted views: <strong className="text-foreground">{stats.boostViews}</strong> •
              Organic views: <strong className="text-foreground">{stats.organicViews}</strong>
            </p>
            {stats.views > 0 && (
              <p className="text-xs">
                {Math.round((stats.boostViews / stats.views) * 100)}% of your traffic this period came from Boosts.
              </p>
            )}
          </Card>
        </section>
      </main>
    </div>
  );
};

function Tile({ icon: Icon, label, value, sub }: { icon: any; label: string; value: number; sub?: string }) {
  return (
    <Card className="p-4 space-y-2">
      <div className="h-9 w-9 rounded-lg grid place-items-center bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="text-2xl font-bold leading-none">{value}</div>
        <div className="text-xs text-muted-foreground mt-1">{label}</div>
        {sub && <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>}
      </div>
    </Card>
  );
}

function Mini({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-base font-bold leading-none">{value}</div>
      <div className="text-[10px] text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}

function Row({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs"><span className="capitalize">{label}</span><span className="font-medium">{value}</span></div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default Insights;
