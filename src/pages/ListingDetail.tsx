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
import { ContactActions } from "@/components/ContactActions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Building2, MapPin, Wifi, Users, Sparkles, Clock, Award, UsersRound } from "lucide-react";
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
  const allRequests = useStore((s) => s.requests);
  const ratings = id ? allRatings.filter((r) => r.listingId === id) : [];
  const all = [...store.get().listings, ...SEED_LISTINGS];
  const listing = all.find((l) => l.id === id);
  const requestCount = id ? allRequests.filter((r) => r.listingId === id).length : 0;
  const seedInteractions = listing && listing.providerId.startsWith("seed-")
    ? ((listing.id.charCodeAt(listing.id.length - 1) * 7) % 40) + 5
    : 0;
  const interactions = requestCount + ratings.length + seedInteractions;

  const [slot, setSlot] = useState<SlotKey | "">("");
  const [note, setNote] = useState("");
  const [isTrial, setIsTrial] = useState(false);
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
    const finalNote = isTrial
      ? `[Trial class request] ${note}`.trim()
      : note;
    store.addRequest({
      listingId: listing!.id,
      learnerName,
      forKidName: activeKid?.name,
      slot,
      note: finalNote,
    });
    toast.success(isTrial ? "Trial class request sent!" : "Request sent! The provider will reply soon.");
    navigate("/requests");
  }

  const contact = listing.contactInfo ?? (listing.providerId === "self" ? provider.contactInfo : undefined);
  const contactFallback = [listing.venue, listing.area, listing.city].filter(Boolean).join(", ");
  const hasContact = !!(contact?.phone || contact?.whatsapp || contact?.mapsUrl || contactFallback);

  return (
    <div className="min-h-screen">
      <TopBar />
      <div className="sticky top-16 z-30 px-3 sm:px-4 pt-2">
        <div className={`container max-w-4xl ${categoryGradient(listing.category)} rounded-xl shadow-elegant px-3 sm:px-4 py-2.5 sm:py-3 space-y-2`}>
          <div className="flex items-center gap-2 text-primary-foreground">
            <button
              onClick={() => navigate(-1)}
              className="h-7 w-7 shrink-0 rounded-md bg-background/25 hover:bg-background/35 grid place-items-center backdrop-blur-sm transition-colors"
              aria-label="Back"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </button>
            <div className="h-8 w-8 shrink-0 rounded-lg bg-background/25 grid place-items-center backdrop-blur-sm">
              <CategoryIcon category={listing.category} className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs opacity-90 truncate">{listing.category} • {listing.providerName}</p>
              <h1 className="text-sm sm:text-lg font-bold leading-tight line-clamp-2">{listing.title}</h1>
            </div>
          </div>
          {hasContact && (
            <div className="rounded-lg bg-background/95 backdrop-blur-sm p-1.5 shadow-sm">
              <ContactActions contact={contact} fallbackAddress={contactFallback} size="sm" />
            </div>
          )}
        </div>
      </div>

      <main className="container py-6 space-y-6 max-w-4xl">
        <Card className="overflow-hidden">
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
              {listing.providerId === "self" && provider.yearsExperience != null && provider.yearsExperience > 0 && (
                <Badge variant="outline" className="gap-1 border-primary/40 text-primary">
                  <Award className="h-3 w-3" /> {provider.yearsExperience}+ yrs experience
                </Badge>
              )}
              {interactions > 0 && (
                <Badge variant="outline" className="gap-1">
                  <UsersRound className="h-3 w-3" /> {interactions} interested
                </Badge>
              )}
              {listing.trial && (
                <Badge className="bg-success text-success-foreground border-0 gap-1">
                  <Sparkles className="h-3 w-3" /> Free trial available
                </Badge>
              )}
            </div>

            {(() => {
              const yearsExp = listing.providerId === "self" ? provider.yearsExperience : undefined;
              const avgRating = ratings.length ? ratings.reduce((a, r) => a + r.stars, 0) / ratings.length : 0;
              return (
                <div className="rounded-xl border bg-muted/30 p-4 space-y-1.5">
                  <Link
                    to={listing.providerId === "self" ? "/provider" : `/listing/${listing.id}`}
                    className="text-lg sm:text-xl font-semibold hover:text-primary transition-colors"
                  >
                    {listing.providerName}
                  </Link>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                    {ratings.length > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <StarRating value={avgRating} size="sm" />
                        <span>{avgRating.toFixed(1)} ({ratings.length})</span>
                      </span>
                    )}
                    {yearsExp != null && yearsExp > 0 && (
                      <span className="inline-flex items-center gap-1 text-primary font-medium">
                        <Award className="h-3.5 w-3.5" /> {yearsExp}+ yrs experience
                      </span>
                    )}
                  </div>
                </div>
              );
            })()}

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

          {listing.trial && (
            <label className="flex items-start gap-2.5 rounded-lg border border-success/40 bg-success/5 p-3 cursor-pointer hover:bg-success/10 transition-colors">
              <input
                type="checkbox"
                checked={isTrial}
                onChange={(e) => setIsTrial(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-success"
              />
              <div className="text-sm">
                <div className="font-medium text-success-foreground/90 flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-success" /> Request a free trial class
                </div>
                <div className="text-xs text-muted-foreground">Try one class before committing.</div>
              </div>
            </label>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Note (optional)</label>
            <Textarea
              placeholder={isTrial ? "Anything the provider should know about your trial?" : "Anything the provider should know? Prior experience, questions..."}
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 500))}
              rows={3}
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={submit}>{isTrial ? "Request trial class" : "Send request"}</Button>
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
