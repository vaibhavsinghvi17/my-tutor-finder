import { Link } from "react-router-dom";
import { TopBar } from "@/components/TopBar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStore, getAllListings } from "@/lib/store";
import {
  Bookmark, GraduationCap, Hourglass, Star, UserCircle2, Search, ArrowRight,
} from "lucide-react";

const LearnerDashboard = () => {
  const learner = useStore((s) => s.learner);
  const requests = useStore((s) => s.requests);
  const ratings = useStore((s) => s.ratings);

  const allListings = getAllListings();
  const myName = learner.name || "Guest";
  const myRequests = requests.filter((r) => r.learnerName === myName);
  const myRatings = ratings.filter((r) => r.byName === myName);

  const saved = learner.savedListings?.length ?? 0;
  const completed = learner.completedListings?.length ?? 0;
  const approved = myRequests.filter((r) => r.status === "Approved").length;
  const pending = myRequests.filter((r) => r.status === "Pending").length;

  const upcoming = myRequests
    .filter((r) => r.status !== "Declined")
    .slice(0, 5)
    .map((r) => ({ req: r, listing: allListings.find((l) => l.id === r.listingId) }));

  return (
    <div className="min-h-screen">
      <TopBar />
      <main className="container py-6 space-y-6 max-w-5xl">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              {learner.name ? `Welcome back, ${learner.name.split(" ")[0]}` : "Your dashboard"}
            </h1>
            <p className="text-sm text-muted-foreground">A quick look at your learning journey.</p>
          </div>
          <div className="flex gap-2">
            <Button asChild size="sm" className="gap-1.5 rounded-full">
              <Link to="/discover"><Search className="h-4 w-4" /> Find classes</Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="gap-1.5 rounded-full">
              <Link to="/profile/learner"><UserCircle2 className="h-4 w-4" /> See profile</Link>
            </Button>
          </div>
        </div>

        <section className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <StatCard icon={GraduationCap} label="Classes joined" value={approved} tint="primary" />
          <StatCard icon={Hourglass} label="Interest / requests" value={myRequests.length} tint="accent"
            sub={pending ? `${pending} pending` : undefined} />
          <StatCard icon={Bookmark} label="Saved classes" value={saved} tint="secondary" />
          <StatCard icon={Star} label="Reviews given" value={myRatings.length} tint="muted"
            sub={`${completed} completed`} />
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold flex items-center gap-2">
                <Hourglass className="h-4 w-4 text-primary" /> My requests
              </h2>
              <Link to="/requests" className="text-xs text-primary hover:underline flex items-center gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                You haven't shown interest in any class yet. <Link to="/discover" className="text-primary hover:underline">Browse classes</Link>.
              </p>
            ) : (
              <div className="space-y-2">
                {upcoming.map(({ req, listing }) => (
                  <Link
                    key={req.id}
                    to={`/listing/${req.listingId}`}
                    className="flex items-center gap-3 rounded-lg border bg-card/60 p-3 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{listing?.title || "Class"}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {listing?.providerName} • slot {req.slot}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px]">{req.status}</Badge>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold flex items-center gap-2">
                <Bookmark className="h-4 w-4 text-primary" /> Saved
              </h2>
              <Link to="/profile/learner" className="text-xs text-primary hover:underline flex items-center gap-1">
                Open profile <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {saved === 0 ? (
              <p className="text-sm text-muted-foreground">Bookmark classes to find them here later.</p>
            ) : (
              <div className="space-y-2">
                {allListings
                  .filter((l) => learner.savedListings?.includes(l.id))
                  .slice(0, 5)
                  .map((l) => (
                    <Link key={l.id} to={`/listing/${l.id}`}
                      className="block rounded-lg border bg-card/60 p-3 hover:bg-muted/40 transition-colors">
                      <div className="text-sm font-medium truncate">{l.title}</div>
                      <div className="text-xs text-muted-foreground truncate">{l.providerName} • {l.category}</div>
                    </Link>
                  ))}
              </div>
            )}
          </Card>
        </section>
      </main>
    </div>
  );
};

function StatCard({
  icon: Icon, label, value, sub, tint,
}: { icon: React.ElementType; label: string; value: number; sub?: string; tint: "primary" | "accent" | "secondary" | "muted" }) {
  const tintClass = {
    primary: "bg-primary/10 text-primary",
    accent: "bg-accent/15 text-accent-foreground",
    secondary: "bg-secondary text-secondary-foreground",
    muted: "bg-muted text-foreground",
  }[tint];
  return (
    <Card className="p-4 space-y-2">
      <div className={`h-9 w-9 rounded-lg grid place-items-center ${tintClass}`}>
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

export default LearnerDashboard;
