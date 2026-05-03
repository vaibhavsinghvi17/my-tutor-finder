import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { TopBar } from "@/components/TopBar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { store, useStore } from "@/lib/store";
import { Plus, Pencil, Trash2, Inbox, Building2, Wifi, MapPin, Clock, GraduationCap, BookOpen, Repeat, Users, CheckCircle2 } from "lucide-react";
import { slotsToText } from "@/components/ScheduleGrid";
import { LearnerProfileDialog } from "@/components/LearnerProfileDialog";
import { JoinRequest } from "@/lib/types";
import { toast } from "sonner";

const ProviderDashboard = () => {
  const [viewing, setViewing] = useState<JoinRequest | null>(null);
  const listings = useStore((s) => s.listings);
  const requests = useStore((s) => s.requests);
  const provider = useStore((s) => s.provider);
  const navigate = useNavigate();

  // requests targeting this provider's listings
  const myListingIds = new Set(listings.map((l) => l.id));
  const incoming = requests.filter((r) => myListingIds.has(r.listingId));

  function switchToLearner() {
    store.setMode("learner");
    navigate("/dashboard");
  }

  return (
    <div className="min-h-screen">
      <TopBar />
      <main className="container py-4 sm:py-6 space-y-5">
        {/* Icon tray below logo bar */}
        <div className="flex items-center gap-2 py-1 w-full">
          <Button asChild variant="secondary" size="sm" className="gap-1.5 rounded-full flex-1 min-w-0">
            <Link to="/provider">
              <BookOpen className="h-4 w-4" />
              <span className="text-xs font-medium truncate">Classes</span>
              <Badge variant="outline" className="ml-0.5 h-5 px-1.5 text-[10px] bg-background/60">
                {listings.length}
              </Badge>
            </Link>
          </Button>
          <Button asChild size="sm" className="gap-1.5 rounded-full flex-1 min-w-0">
            <Link to="/provider/listing/new">
              <Plus className="h-4 w-4" />
              <span className="text-xs font-medium truncate">New class</span>
            </Link>
          </Button>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            {provider.businessName || "Your studio"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your classes and respond to join requests.
          </p>
        </div>

        {/* At-a-glance stats */}
        <section className="grid gap-3 grid-cols-2 lg:grid-cols-3">
          <StatTile icon={BookOpen} label="Total classes" value={listings.length} tint="primary" />
          <Link to="/provider/requests" className="block group">
            <Card className="p-4 space-y-2 group-hover:shadow-elegant transition-shadow relative">
              <div className="h-9 w-9 rounded-lg grid place-items-center bg-accent/15 text-accent-foreground">
                <Inbox className="h-4 w-4" />
              </div>
              <div>
                <div className="text-2xl font-bold leading-none">{incoming.length}</div>
                <div className="text-xs text-muted-foreground mt-1">Requests & approvals</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {incoming.filter((r) => r.status === "Pending").length} pending • {incoming.filter((r) => r.status === "Approved").length} approved
                </div>
              </div>
              {incoming.filter((r) => r.status === "Pending").length > 0 && (
                <Badge className="absolute top-3 right-3 bg-warning text-warning-foreground border-0 animate-pulse">
                  {incoming.filter((r) => r.status === "Pending").length} new
                </Badge>
              )}
            </Card>
          </Link>
          <StatTile icon={Users} label="Students enrolled" value={new Set(incoming.filter((r) => r.status === "Approved").map((r) => r.forKidName ?? r.learnerName)).size} tint="muted" />
        </section>

        <div>
          <Button asChild size="sm" className="gap-1.5 rounded-full">
            <Link to="/provider/requests">
              <Inbox className="h-4 w-4" />
              Go to requests
              {incoming.filter((r) => r.status === "Pending").length > 0 && (
                <Badge variant="outline" className="ml-1 h-5 px-1.5 text-[10px] bg-background/60">
                  {incoming.filter((r) => r.status === "Pending").length}
                </Badge>
              )}
            </Link>
          </Button>
        </div>

        <section className="space-y-3">
          <h2 className="font-semibold">Your classes</h2>
            {listings.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground mb-4">You haven't published any classes yet.</p>
                <Button asChild><Link to="/provider/listing/new">Add your first class</Link></Button>
              </Card>
            ) : (
              listings.map((l) => (
                <Card key={l.id} className="p-4 hover:shadow-elegant transition-shadow">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-[220px] space-y-3">
                      {/* Title row */}
                      <div className="space-y-1.5">
                        <h3 className="font-semibold text-base leading-tight">{l.title}</h3>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge variant="outline" className="gap-1 text-[11px]">
                            {l.mode === "Online" ? <Wifi className="h-3 w-3" /> : <Building2 className="h-3 w-3" />}
                            {l.mode}
                          </Badge>
                          <Badge variant="outline" className="text-[11px]">{l.category}</Badge>
                          <Badge variant="outline" className="text-[11px]">{l.ageGroup}</Badge>
                        </div>
                      </div>

                      {/* Description */}
                      {l.description && (
                        <p className="text-sm text-foreground/80 leading-relaxed line-clamp-3">
                          {l.description}
                        </p>
                      )}

                      {/* Location & timings */}
                      <div className="space-y-1.5 pt-1 border-t border-border/60">
                        <div className="flex items-start gap-2 text-xs text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary/70" />
                          <span className="leading-snug">
                            {[l.area, l.city, l.pinCode].filter(Boolean).join(", ") || (l.mode === "Online" ? "Online" : "—")}
                          </span>
                        </div>
                        <div className="flex items-start gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary/70" />
                          <span className="leading-snug">{slotsToText(l.slots) || "No timings set"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-1.5 shrink-0">
                      <Button asChild size="sm" variant="outline">
                        <Link to={`/listing/${l.id}`}>View</Link>
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <Link to={`/provider/listing/${l.id}`}><Pencil className="h-4 w-4" /></Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { store.removeListing(l.id); toast.success("Class removed"); }}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
        </section>
      </main>
      <LearnerProfileDialog request={viewing} onOpenChange={(o) => !o && setViewing(null)} />
    </div>
  );
};

function StatTile({
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

export default ProviderDashboard;
