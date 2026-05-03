import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { TopBar } from "@/components/TopBar";
import { store, useStore } from "@/lib/store";
import { SEED_LISTINGS } from "@/lib/seed";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScheduleGrid, slotsToText } from "@/components/ScheduleGrid";
import { CategoryIcon, categoryGradient } from "@/components/CategoryIcon";
import { StarRating } from "@/components/StarRating";
import { SocialLinksRow } from "@/components/SocialLinksRow";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Building2, MapPin, Wifi, Users, Sparkles, Clock } from "lucide-react";
import { SlotKey } from "@/lib/types";
import { ageFromDob, blocksToSlots } from "@/lib/timeUtils";
import { formatDuration, formatPrice } from "@/lib/listingUtils";
import { toast } from "sonner";

const ListingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const learner = useStore((s) => s.learner);
  const provider = useStore((s) => s.provider);
  const allRatings = useStore((s) => s.ratings);
  const ratings = id ? allRatings.filter((r) => r.listingId === id) : [];
  const all = [...store.get().listings, ...SEED_LISTINGS];
  const listing = all.find((l) => l.id === id);

  const [slot, setSlot] = useState<SlotKey | "">("");
  const [note, setNote] = useState("");
  const [reviewStars, setReviewStars] = useState(0);
  const [reviewText, setReviewText] = useState("");

  if (!listing) {
    return (
      <div className="min-h-screen">
        <TopBar />
        <div className="container py-20 text-center">
          <h1 className="text-xl font-semibold mb-2">Class not found</h1>
          <Button asChild><Link to="/discover">Back to Discover</Link></Button>
        </div>
      </div>
    );
  }

  const activeKid = learner.activeKidId ? learner.kids.find((k) => k.id === learner.activeKidId) : null;
  const freeSlots = blocksToSlots(activeKid ? activeKid.freeBlocks : learner.freeBlocks);
  const matching = listing.slots.filter((s) => freeSlots.includes(s));

  function submit() {
    if (!slot) {
      toast.error("Pick a class slot first.");
      return;
    }
    const learnerName = learner.name || "Guest";
    store.addRequest({
      listingId: listing!.id,
      learnerName,
      forKidName: activeKid?.name,
      slot,
      note,
    });
    toast.success("Request sent! The provider will reply soon.");
    navigate("/requests");
  }

  return (
    <div className="min-h-screen">
      <TopBar />
      <main className="container py-6 space-y-6 max-w-4xl">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>

        <Card className="overflow-hidden">
          <div className={`${categoryGradient(listing.category)} h-40 flex items-end p-6`}>
            <div className="flex items-center gap-3 text-primary-foreground">
              <div className="h-12 w-12 rounded-xl bg-background/20 grid place-items-center backdrop-blur-sm">
                <CategoryIcon category={listing.category} className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm opacity-90">{listing.category} • {listing.providerName}</p>
                <h1 className="text-2xl sm:text-3xl font-bold">{listing.title}</h1>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-5">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="gap-1">
                {listing.mode === "Online" ? <Wifi className="h-3 w-3" /> : <Building2 className="h-3 w-3" />}
                {listing.mode}
              </Badge>
              <Badge variant="outline" className="gap-1"><Users className="h-3 w-3" /> {listing.ageGroup}</Badge>
              {formatDuration(listing.durationMins) && (
                <Badge variant="outline" className="gap-1">
                  <Clock className="h-3 w-3" /> {formatDuration(listing.durationMins)}
                </Badge>
              )}
              {formatPrice(listing) && <Badge variant="outline">{formatPrice(listing)}</Badge>}
              {listing.trial && (
                <Badge className="bg-success text-success-foreground border-0 gap-1">
                  <Sparkles className="h-3 w-3" /> Free trial available
                </Badge>
              )}
            </div>

            {ratings.length > 0 && (
              <div className="flex items-center gap-2">
                <StarRating value={ratings.reduce((a, r) => a + r.stars, 0) / ratings.length} size="md" />
                <span className="text-sm text-muted-foreground">
                  {(ratings.reduce((a, r) => a + r.stars, 0) / ratings.length).toFixed(1)} • {ratings.length} review{ratings.length > 1 ? "s" : ""}
                </span>
              </div>
            )}

            <p className="text-sm leading-relaxed">{listing.description}</p>

            <div className="grid gap-3 sm:grid-cols-2 text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <div className="font-medium">{listing.area}, {listing.city}</div>
                  {listing.venue && <div className="text-muted-foreground text-xs">{listing.venue}</div>}
                </div>
              </div>
            </div>

            {(listing.socials || (listing.providerId === "self" && provider.socials)) && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Follow {listing.providerName}</h3>
                <SocialLinksRow socials={listing.socials ?? (listing.providerId === "self" ? provider.socials : undefined)} />
              </div>
            )}

            <div>
              <h3 className="font-semibold mb-2">Class schedule</h3>
              <ScheduleGrid value={listing.slots} highlightSlots={freeSlots} readOnly compact />
              {matching.length > 0 && (
                <p className="text-xs text-success mt-2">
                  ✓ {matching.length} slot{matching.length > 1 ? "s" : ""} match your free time.
                </p>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <div>
            <h2 className="font-semibold text-lg">Request to join</h2>
            <p className="text-sm text-muted-foreground">
              The provider will review your request and confirm if a spot is available.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Pick a slot</label>
              <Select value={slot} onValueChange={(v) => setSlot(v as SlotKey)}>
                <SelectTrigger><SelectValue placeholder="Select a class time" /></SelectTrigger>
                <SelectContent>
                  {listing.slots.map((s) => (
                    <SelectItem key={s} value={s}>
                      {slotsToText([s])} {freeSlots.includes(s) ? "  ✓ free" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Joining as</label>
              <div className="text-sm h-10 px-3 rounded-md border flex items-center bg-muted/40">
                {activeKid
                  ? `${activeKid.name}${ageFromDob(activeKid.dob) !== null ? ` (age ${ageFromDob(activeKid.dob)})` : ""} — parent: ${learner.name || "you"}`
                  : learner.name || "Guest"}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Note (optional)</label>
            <Textarea
              placeholder="Anything the provider should know? Prior experience, questions..."
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 500))}
              rows={3}
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={submit}>Send request</Button>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="font-semibold text-lg">Ratings & reviews</h2>
              <p className="text-sm text-muted-foreground">
                {ratings.length === 0 ? "Be the first to review." : `${ratings.length} review${ratings.length > 1 ? "s" : ""}`}
              </p>
            </div>
            {ratings.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">
                  {(ratings.reduce((a, r) => a + r.stars, 0) / ratings.length).toFixed(1)}
                </span>
                <StarRating value={ratings.reduce((a, r) => a + r.stars, 0) / ratings.length} />
              </div>
            )}
          </div>

          <div className="space-y-3">
            {ratings.map((r) => (
              <div key={r.id} className="rounded-lg border p-3 space-y-1.5 bg-muted/30">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-medium">{r.byName}</div>
                  <StarRating value={r.stars} size="sm" />
                </div>
                {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
              </div>
            ))}
          </div>

          <div className="rounded-lg border p-4 space-y-3 bg-card">
            <div className="text-sm font-medium">Leave a review</div>
            <div className="flex items-center gap-3">
              <StarRating value={reviewStars} size="lg" onChange={setReviewStars} />
              <span className="text-xs text-muted-foreground">
                {reviewStars > 0 ? `${reviewStars} / 5` : "Tap stars"}
              </span>
            </div>
            <Textarea
              placeholder="Share your experience (optional)"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value.slice(0, 500))}
              rows={2}
            />
            <div className="flex justify-end">
              <Button
                size="sm"
                disabled={reviewStars === 0}
                onClick={() => {
                  store.addRating({
                    listingId: listing!.id,
                    byName: learner.name || "Anonymous",
                    stars: reviewStars,
                    comment: reviewText.trim(),
                  });
                  setReviewStars(0);
                  setReviewText("");
                  toast.success("Thanks for your review!");
                }}
              >
                Submit review
              </Button>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default ListingDetail;
