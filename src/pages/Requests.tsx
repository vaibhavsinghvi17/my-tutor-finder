import { TopBar } from "@/components/TopBar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAllListings, useStore } from "@/lib/store";
import { Link } from "react-router-dom";
import { slotsToText } from "@/components/ScheduleGrid";
import { Inbox } from "lucide-react";

const Requests = () => {
  const requests = useStore((s) => s.requests);
  const allListings = getAllListings();

  return (
    <div className="min-h-screen">
      <TopBar />
      <main className="container py-6 space-y-5 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold">My Requests</h1>
          <p className="text-sm text-muted-foreground">Track classes you've asked to join.</p>
        </div>

        {requests.length === 0 ? (
          <Card className="p-12 text-center">
            <Inbox className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-4">You haven't requested any classes yet.</p>
            <Button asChild><Link to="/discover">Browse classes</Link></Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {requests.map((r) => {
              const listing = allListings.find((l) => l.id === r.listingId);
              const tone =
                r.status === "Approved" ? "bg-success text-success-foreground" :
                r.status === "Declined" ? "bg-destructive text-destructive-foreground" :
                "bg-warning text-warning-foreground";
              return (
                <Card key={r.id} className="p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="space-y-1">
                      <Link to={`/listing/${r.listingId}`} className="font-semibold hover:text-primary">
                        {listing?.title ?? "Class removed"}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {listing?.providerName} • {slotsToText([r.slot])}
                      </p>
                      <p className="text-sm">
                        For: <span className="font-medium">{r.forKidName ?? r.learnerName}</span>
                      </p>
                      {r.note && <p className="text-sm text-muted-foreground italic">"{r.note}"</p>}
                    </div>
                    <Badge className={`${tone} border-0`}>{r.status}</Badge>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Requests;
