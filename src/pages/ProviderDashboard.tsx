import { useState } from "react";
import { Link } from "react-router-dom";
import { TopBar } from "@/components/TopBar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { store, useStore } from "@/lib/store";
import { Plus, Pencil, Trash2, Inbox, Building2, Wifi } from "lucide-react";
import { slotsToText } from "@/components/ScheduleGrid";
import { LearnerProfileDialog } from "@/components/LearnerProfileDialog";
import { JoinRequest } from "@/lib/types";
import { toast } from "sonner";

const ProviderDashboard = () => {
  const [viewing, setViewing] = useState<JoinRequest | null>(null);
  const listings = useStore((s) => s.listings);
  const requests = useStore((s) => s.requests);
  const provider = useStore((s) => s.provider);

  // requests targeting this provider's listings
  const myListingIds = new Set(listings.map((l) => l.id));
  const incoming = requests.filter((r) => myListingIds.has(r.listingId));

  return (
    <div className="min-h-screen">
      <TopBar />
      <main className="container py-6 space-y-6">
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              {provider.businessName || "Your studio"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage your classes and respond to join requests.
            </p>
          </div>
          <Button asChild className="gap-1">
            <Link to="/provider/listing/new"><Plus className="h-4 w-4" /> New class</Link>
          </Button>
        </div>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-3">
            <h2 className="font-semibold">Your classes</h2>
            {listings.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground mb-4">You haven't published any classes yet.</p>
                <Button asChild><Link to="/provider/listing/new">Add your first class</Link></Button>
              </Card>
            ) : (
              listings.map((l) => (
                <Card key={l.id} className="p-4">
                  <div className="flex items-start gap-3 flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{l.title}</h3>
                        <Badge variant="outline" className="gap-1">
                          {l.mode === "Online" ? <Wifi className="h-3 w-3" /> : <Building2 className="h-3 w-3" />}
                          {l.mode}
                        </Badge>
                        <Badge variant="outline">{l.category}</Badge>
                        <Badge variant="outline">{l.ageGroup}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {l.area}, {l.city} • ⏰ {slotsToText(l.slots)}
                      </p>
                      <p className="text-sm mt-2 line-clamp-2">{l.description}</p>
                    </div>
                    <div className="flex gap-1.5">
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
          </div>

          <div className="space-y-3">
            <h2 className="font-semibold flex items-center gap-2">
              <Inbox className="h-4 w-4" /> Join requests
              {incoming.length > 0 && (
                <Badge className="bg-accent text-accent-foreground border-0">{incoming.length}</Badge>
              )}
            </h2>
            {incoming.length === 0 ? (
              <Card className="p-6 text-sm text-muted-foreground text-center">
                No requests yet. Once you publish classes, learner requests will appear here.
              </Card>
            ) : (
              incoming.map((r) => {
                const listing = listings.find((l) => l.id === r.listingId);
                return (
                  <Card key={r.id} className="p-4 space-y-2">
                    <div className="text-sm">
                      <button
                        type="button"
                        onClick={() => setViewing(r)}
                        className="font-medium text-left hover:text-primary hover:underline transition-colors"
                      >
                        {r.forKidName ?? r.learnerName}
                      </button>
                      <div className="text-xs text-muted-foreground">
                        {listing?.title} • {slotsToText([r.slot])}
                      </div>
                      {r.note && <p className="text-xs mt-1 italic text-muted-foreground">"{r.note}"</p>}
                    </div>
                    {r.status === "Pending" ? (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1 bg-success text-success-foreground hover:bg-success/90"
                          onClick={() => { store.setRequestStatus(r.id, "Approved"); toast.success("Approved"); }}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => { store.setRequestStatus(r.id, "Declined"); toast.success("Declined"); }}
                        >
                          Decline
                        </Button>
                      </div>
                    ) : (
                      <Badge
                        className={
                          r.status === "Approved"
                            ? "bg-success text-success-foreground border-0"
                            : "bg-destructive text-destructive-foreground border-0"
                        }
                      >
                        {r.status}
                      </Badge>
                    )}
                  </Card>
                );
              })
            )}
          </div>
        </section>
      </main>
      <LearnerProfileDialog request={viewing} onOpenChange={(o) => !o && setViewing(null)} />
    </div>
  );
};

export default ProviderDashboard;
