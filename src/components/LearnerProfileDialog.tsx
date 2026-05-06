import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { JoinRequest } from "@/lib/types";
import { useStore } from "@/lib/store";
import { ageFromDob, blockSummary } from "@/lib/timeUtils";
import { slotsToText } from "@/components/ScheduleGrid";
import { Baby, UserCircle2, Mail, MapPin, Calendar, Clock, Heart, MessageSquare, Lock, Sparkles } from "lucide-react";
import { useSubscription } from "@/lib/useSubscription";
import { Link } from "react-router-dom";

interface Props {
  request: JoinRequest | null;
  onOpenChange: (open: boolean) => void;
}

export function LearnerProfileDialog({ request, onOpenChange }: Props) {
  const learner = useStore((s) => s.learner);
  const { isGrowth } = useSubscription();
  const open = !!request;
  if (!request) {
    return (
      <Dialog open={false} onOpenChange={onOpenChange}>
        <DialogContent />
      </Dialog>
    );
  }

  // Look up kid or adult profile if available locally
  const kid = request.forKidName ? learner.kids.find((k) => k.name === request.forKidName) : null;
  const adult = !kid && request.learnerName ? learner.adults.find((a) => a.name === request.learnerName) : null;
  const isParent = !!request.forKidName;

  const displayName = request.forKidName ?? request.learnerName;
  const age = kid ? ageFromDob(kid.dob) : adult ? ageFromDob(adult.dob) : null;
  const interests = kid?.interests ?? adult?.interests ?? [];
  const freeBlocks = kid?.freeBlocks ?? adult?.freeBlocks ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gradient-primary grid place-items-center text-primary-foreground">
              {isParent ? <Baby className="h-6 w-6" /> : <UserCircle2 className="h-6 w-6" />}
            </div>
            <div>
              <DialogTitle className="text-left">{displayName}</DialogTitle>
              <DialogDescription className="text-left">
                {isParent ? `Joining via parent: ${request.learnerName}` : "Adult learner"}
                {age !== null ? ` · age ${age}` : ""}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="rounded-lg border p-3 space-y-1.5 bg-muted/30">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Request details</div>
            <div className="flex items-start gap-2">
              <Clock className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
              <span>Requested slot: <span className="font-medium">{slotsToText([request.slot])}</span></span>
            </div>
            {request.note && (
              <div className="flex items-start gap-2">
                <MessageSquare className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
                <span className="italic">"{request.note}"</span>
              </div>
            )}
            <div className="text-xs text-muted-foreground">
              Sent {new Date(request.createdAt).toLocaleString()}
            </div>
          </div>

          {(kid || adult) ? (
            <>
              {kid && (
                <div className="space-y-1.5">
                  {kid.school && (
                    <div className="flex items-start gap-2">
                      <Calendar className="h-3.5 w-3.5 mt-0.5 text-muted-foreground" />
                      <span>{kid.school}{kid.schoolClass ? ` · Class ${kid.schoolClass}` : ""}</span>
                    </div>
                  )}
                </div>
              )}
              {adult && (
                <div className="space-y-1.5">
                  {adult.email && (
                    <div className="flex items-start gap-2">
                      <Mail className="h-3.5 w-3.5 mt-0.5 text-muted-foreground" />
                      <span>{adult.email}</span>
                    </div>
                  )}
                  {adult.occupation && (
                    <div className="flex items-start gap-2">
                      <UserCircle2 className="h-3.5 w-3.5 mt-0.5 text-muted-foreground" />
                      <span>{adult.occupation}</span>
                    </div>
                  )}
                </div>
              )}

              {interests.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <Heart className="h-3 w-3" /> Interests
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {interests.map((i) => <Badge key={i} variant="secondary">{i}</Badge>)}
                  </div>
                </div>
              )}

              {freeBlocks.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <Clock className="h-3 w-3" /> Free time
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-0.5">
                    {freeBlocks.map((b) => <li key={b.id}>• {blockSummary(b)}</li>)}
                  </ul>
                </div>
              )}
            </>
          ) : (
            // Fallback: show parent's profile from local store (best-effort for demo data)
            <div className="space-y-1.5">
              {learner.email && learner.name === request.learnerName && (
                <div className="flex items-start gap-2">
                  <Mail className="h-3.5 w-3.5 mt-0.5 text-muted-foreground" />
                  <span>{learner.email}</span>
                </div>
              )}
              {learner.city && learner.name === request.learnerName && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-3.5 w-3.5 mt-0.5 text-muted-foreground" />
                  <span>{[learner.area, learner.city].filter(Boolean).join(", ")}</span>
                </div>
              )}
              <p className="text-xs text-muted-foreground italic">
                Limited profile info available for this learner.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
