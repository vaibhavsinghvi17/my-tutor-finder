import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClassChat } from "@/components/ClassChat";
import { CalendarClock, Sparkles } from "lucide-react";
import { useStore, getAllListings } from "@/lib/store";
import { SlotKey } from "@/lib/types";
import { fmtHour } from "@/lib/timeUtils";

function parseSlot(slot: SlotKey): { day: string; hour: number } {
  const [day, h] = String(slot).split("-");
  return { day, hour: parseInt(h, 10) };
}

interface Props {
  /** "learner" → show user's approved trial requests; "provider" → show approved trials for tutor's classes */
  side: "learner" | "provider";
}

export function UpcomingTrials({ side }: Props) {
  const learner = useStore((s) => s.learner);
  const requests = useStore((s) => s.requests);
  const listings = useStore((s) => s.listings);
  const allListings = getAllListings();

  let rows: { req: JoinRequest; listing: ReturnType<typeof allListings.find> }[] = [];

  if (side === "learner") {
    const myName = learner.name || "Guest";
    rows = requests
      .filter((r) => r.learnerName === myName && r.isTrial && r.status === "Approved" && !r.converted)
      .map((r) => ({ req: r, listing: allListings.find((l) => l.id === r.listingId) }));
  } else {
    const myIds = new Set(listings.map((l) => l.id));
    rows = requests
      .filter((r) => myIds.has(r.listingId) && r.isTrial && r.status === "Approved" && !r.converted)
      .map((r) => ({ req: r, listing: allListings.find((l) => l.id === r.listingId) }));
  }

  if (rows.length === 0) return null;

  return (
    <Card className="p-4 space-y-3 border-primary/30 bg-primary/5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold flex items-center gap-2 text-sm">
          <Sparkles className="h-4 w-4 text-primary" />
          Upcoming trial classes
          <Badge variant="secondary" className="text-[10px] h-5">{rows.length}</Badge>
        </h2>
      </div>
      <div className="space-y-2">
        {rows.map(({ req, listing }) => {
          const { day, hour } = parseSlot(req.slot);
          const otherName = side === "learner"
            ? (listing?.providerName ?? "Tutor")
            : (req.forKidName ?? req.learnerName);
          return (
            <div
              key={req.id}
              className="flex items-center gap-3 rounded-lg border bg-card p-3"
            >
              <div className="h-9 w-9 rounded-lg bg-primary/15 text-primary grid place-items-center shrink-0">
                <CalendarClock className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <Link
                  to={`/listing/${req.listingId}`}
                  className="text-sm font-medium truncate hover:text-primary block"
                >
                  {listing?.title || "Class"}
                </Link>
                <div className="text-[11px] text-muted-foreground truncate">
                  {side === "learner" ? "Tutor: " : "Learner: "}
                  <span className="text-foreground">{otherName}</span>
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {req.startDate ? `${req.startDate} · ` : ""}{day} · {fmtHour(hour)}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {side === "learner"
                  ? listing?.providerUserId && (
                      <ClassChat
                        listingId={req.listingId}
                        listingTitle={listing?.title || "Class"}
                        providerUserId={listing.providerUserId}
                        otherPartyName={listing?.providerName || "Tutor"}
                        triggerVariant="outline"
                        triggerLabel="Chat"
                      />
                    )
                  : req.learnerUserId && (
                      <ClassChat
                        listingId={req.listingId}
                        listingTitle={listing?.title || "Class"}
                        learnerUserId={req.learnerUserId}
                        otherPartyName={otherName}
                        triggerVariant="outline"
                        triggerLabel="Chat"
                      />
                    )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
