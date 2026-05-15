import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "@/components/StarRating";
import { ReportButton } from "@/components/ReportButton";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/useAuth";
import { useListingReviews, upsertReview, deleteReview } from "@/lib/useReviews";

interface Props {
  listingId: string;
  providerUserId?: string;
  reviewerName: string;
  isOwner?: boolean;
}

export function ReviewsSection({ listingId, providerUserId, reviewerName, isOwner }: Props) {
  const { user } = useAuth();
  const { reviews, avg, count, loading, refresh } = useListingReviews(listingId);
  const myReview = user ? reviews.find((r) => r.reviewer_user_id === user.id) : undefined;
  const [stars, setStars] = useState(myReview?.rating ?? 0);
  const [text, setText] = useState(myReview?.comment ?? "");
  const [busy, setBusy] = useState(false);

  const isOwnListing = isOwner || (!!user && !!providerUserId && user.id === providerUserId);
  const canReview = !!user && !!providerUserId && !isOwnListing;

  async function submit() {
    if (!user || !providerUserId) return;
    if (stars < 1) { toast.error("Pick a star rating first"); return; }
    setBusy(true);
    try {
      await upsertReview({
        listingId,
        providerUserId,
        reviewerUserId: user.id,
        reviewerName,
        rating: stars,
        comment: text.trim(),
      });
      toast.success(myReview ? "Review updated" : "Thanks for your review!");
      await refresh();
    } catch (e: any) {
      toast.error(e.message ?? "Could not save review");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete your review?")) return;
    try {
      await deleteReview(id);
      setStars(0); setText("");
      toast.success("Review deleted");
      refresh();
    } catch (e: any) {
      toast.error(e.message ?? "Could not delete");
    }
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-semibold text-lg">Ratings & reviews</h2>
          <p className="text-sm text-muted-foreground">
            {count === 0 ? (isOwnListing ? "No reviews yet." : "No reviews yet — be the first!") : `${count} review${count > 1 ? "s" : ""}`}
          </p>
        </div>
        {count > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">{avg.toFixed(1)}</span>
            <StarRating value={avg} />
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : (
        <div className="space-y-2">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-lg border p-3 space-y-1.5 bg-muted/30">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-medium">{r.reviewer_name ?? "Anonymous"}</div>
                <div className="flex items-center gap-1">
                  <StarRating value={r.rating} size="sm" />
                  {user?.id === r.reviewer_user_id ? (
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => remove(r.id)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  ) : (
                    <ReportButton targetType="review" targetId={r.id} reporterName={reviewerName} compact />
                  )}
                </div>
              </div>
              {r.comment && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{r.comment}</p>}
            </div>
          ))}
        </div>
      )}

      {canReview ? (
        <div className="rounded-lg border p-4 space-y-3 bg-card">
          <div className="text-sm font-medium">{myReview ? "Update your review" : "Leave a review"}</div>
          <div className="flex items-center gap-3">
            <StarRating value={stars} size="lg" onChange={setStars} />
            <span className="text-xs text-muted-foreground">{stars > 0 ? `${stars} / 5` : "Tap stars"}</span>
          </div>
          <Textarea
            placeholder="Share your experience (optional)"
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 500))}
            rows={2}
          />
          <div className="flex justify-end">
            <Button size="sm" disabled={busy || stars === 0} onClick={submit}>
              {busy ? "Saving…" : myReview ? "Update review" : "Submit review"}
            </Button>
          </div>
        </div>
      ) : !user ? (
        <p className="text-xs text-muted-foreground italic">Sign in to leave a review.</p>
      ) : isOwnListing ? null : null}
      )}
    </Card>
  );
}
