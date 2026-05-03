import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { TopBar } from "@/components/TopBar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { store, useStore } from "@/lib/store";
import { slotsToText } from "@/components/ScheduleGrid";
import { LearnerProfileDialog } from "@/components/LearnerProfileDialog";
import { JoinRequest } from "@/lib/types";
import { ArrowLeft, Check, X, Inbox, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const ProviderRequests = () => {
  const navigate = useNavigate();
  const listings = useStore((s) => s.listings);
  const requests = useStore((s) => s.requests);
  const [viewing, setViewing] = useState<JoinRequest | null>(null);

  const myListingIds = new Set(listings.map((l) => l.id));
  const incoming = requests.filter((r) => myListingIds.has(r.listingId));
  const pending = incoming.filter((r) => r.status === "Pending");
  const approved = incoming.filter((r) => r.status === "Approved");

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

        <div>
          <h1 className="text-2xl font-bold">Join requests</h1>
          <p className="text-sm text-muted-foreground">Approve or decline learners interested in your classes.</p>
        </div>

        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending" className="gap-1.5">
              <Inbox className="h-3.5 w-3.5" /> Requests
              {pending.length > 0 && (
                <Badge variant="outline" className="ml-1 h-5 px-1.5 text-[10px]">{pending.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved" className="gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" /> Approved
              {approved.length > 0 && (
                <Badge variant="outline" className="ml-1 h-5 px-1.5 text-[10px]">{approved.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-2 mt-3">
            {pending.length === 0 ? (
              <Card className="p-6 text-sm text-muted-foreground text-center">
                No pending requests right now.
              </Card>
            ) : (
              pending.map((r) => (
                <RequestRow
                  key={r.id}
                  r={r}
                  className={listings.find((l) => l.id === r.listingId)?.title ?? "Class"}
                  onView={() => setViewing(r)}
                  actions={
                    <>
                      <Button
                        size="icon"
                        className="h-8 w-8 rounded-full bg-success text-success-foreground hover:bg-success/90"
                        onClick={() => { store.setRequestStatus(r.id, "Approved"); toast.success("Approved"); }}
                        title="Approve"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 rounded-full text-destructive"
                        onClick={() => { store.setRequestStatus(r.id, "Declined"); toast.success("Declined"); }}
                        title="Decline"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  }
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-2 mt-3">
            {approved.length === 0 ? (
              <Card className="p-6 text-sm text-muted-foreground text-center">
                No approved students yet.
              </Card>
            ) : (
              approved.map((r) => (
                <RequestRow
                  key={r.id}
                  r={r}
                  className={listings.find((l) => l.id === r.listingId)?.title ?? "Class"}
                  onView={() => setViewing(r)}
                  actions={
                    <Badge className="bg-success text-success-foreground border-0">Approved</Badge>
                  }
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>
      <LearnerProfileDialog request={viewing} onOpenChange={(o) => !o && setViewing(null)} />
    </div>
  );
};

function RequestRow({
  r, className, onView, actions,
}: { r: JoinRequest; className: string; onView: () => void; actions: React.ReactNode }) {
  const date = new Date(r.createdAt);
  const dateStr = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const timeStr = date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return (
    <Card className="p-3 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <Link to={`/listing/${r.listingId}`} className="text-sm font-semibold truncate block hover:text-primary">
          {className}
        </Link>
        <button
          type="button"
          onClick={onView}
          className="text-xs text-muted-foreground hover:text-primary hover:underline truncate block text-left max-w-full"
        >
          {r.forKidName ?? r.learnerName}
        </button>
        <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
          {dateStr} • {timeStr} • slot {slotsToText([r.slot])}
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">{actions}</div>
    </Card>
  );
}

export default ProviderRequests;
