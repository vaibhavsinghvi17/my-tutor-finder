import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { TopBar } from "@/components/TopBar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { store, getAllListings, useStore } from "@/lib/store";
import { StarRating } from "@/components/StarRating";
import { ArrowLeft, Bookmark, GraduationCap, Hourglass, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type TabKey = "joined" | "requests" | "saved" | "ratings";

const META: Record<TabKey, { title: string; icon: React.ElementType; subtitle: string }> = {
  joined:   { title: "Classes joined",      icon: GraduationCap, subtitle: "Approved requests for classes you've joined." },
  requests: { title: "My interest & requests", icon: Hourglass,  subtitle: "Every class you've shown interest in." },
  saved:    { title: "Saved classes",       icon: Bookmark,      subtitle: "Classes you've bookmarked." },
  ratings:  { title: "Ratings you've given", icon: Star,         subtitle: "Reviews you've left for classes." },
};

const LearnerList = () => {
  const { tab } = useParams<{ tab: TabKey }>();
  const navigate = useNavigate();
  const learner = useStore((s) => s.learner);
  const requests = useStore((s) => s.requests);
  const ratings = useStore((s) => s.ratings);
  const allListings = getAllListings();

  const key: TabKey = (tab as TabKey) in META ? (tab as TabKey) : "joined";
  const meta = META[key];

  const myName = learner.name || "Guest";
  const myRequests = requests.filter((r) => r.learnerName === myName);

  let body: React.ReactNode = null;

  if (key === "joined") {
    const items = myRequests.filter((r) => r.status === "Approved");
    body = items.length === 0 ? <Empty /> : (
      <div className="space-y-2">
        {items.map((r) => {
          const l = allListings.find((x) => x.id === r.listingId);
          return (
            <Row key={r.id} to={`/listing/${r.listingId}`} title={l?.title || "Class"}
              subtitle={`${l?.providerName || ""} • slot ${r.slot}`}
              right={<Badge className="bg-success text-success-foreground border-0">Joined</Badge>} />
          );
        })}
      </div>
    );
  } else if (key === "requests") {
    body = myRequests.length === 0 ? <Empty /> : (
      <div className="space-y-2">
        {myRequests.map((r) => {
          const l = allListings.find((x) => x.id === r.listingId);
          return (
            <Row key={r.id} to={`/listing/${r.listingId}`} title={l?.title || "Class"}
              subtitle={`${l?.providerName || ""} • slot ${r.slot}`}
              right={<Badge variant="outline" className={cn(
                r.status === "Approved" && "border-success text-success",
                r.status === "Declined" && "border-destructive text-destructive",
              )}>{r.status}</Badge>} />
          );
        })}
      </div>
    );
  } else if (key === "saved") {
    const items = allListings.filter((l) => learner.savedListings?.includes(l.id));
    body = items.length === 0 ? <Empty /> : (
      <div className="space-y-2">
        {items.map((l) => (
          <Row key={l.id} to={`/listing/${l.id}`} title={l.title}
            subtitle={`${l.providerName} • ${l.category}`} />
        ))}
      </div>
    );
  } else {
    const items = ratings.filter((r) => r.byName === myName);
    body = items.length === 0 ? <Empty /> : (
      <div className="space-y-2">
        {items.map((r) => {
          const l = allListings.find((x) => x.id === r.listingId);
          return (
            <Card key={r.id} className="p-3 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <Link to={`/listing/${r.listingId}`} className="text-sm font-semibold truncate hover:text-primary">
                  {l?.title || "Class"}
                </Link>
                <StarRating value={r.stars} size="sm" />
              </div>
              {r.comment && <p className="text-xs text-muted-foreground line-clamp-2">{r.comment}</p>}
            </Card>
          );
        })}
      </div>
    );
  }

  const Icon = meta.icon;

  return (
    <div className="min-h-screen">
      <TopBar />
      <main className="container py-4 sm:py-6 space-y-4 max-w-3xl">
        <button
          onClick={() => navigate(-1)}
          className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold leading-tight">{meta.title}</h1>
            <p className="text-xs text-muted-foreground">{meta.subtitle}</p>
          </div>
        </div>
        {body}
      </main>
    </div>
  );
};

function Row({ to, title, subtitle, right }: { to: string; title: string; subtitle: string; right?: React.ReactNode }) {
  return (
    <Link to={to} className="flex items-center gap-3 rounded-lg border bg-card/60 p-3 hover:bg-muted/40 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{title}</div>
        <div className="text-xs text-muted-foreground truncate">{subtitle}</div>
      </div>
      {right}
    </Link>
  );
}

function Empty() {
  return (
    <Card className="p-10 text-center">
      <p className="text-sm text-muted-foreground">Nothing to show here yet.</p>
    </Card>
  );
}

export default LearnerList;
