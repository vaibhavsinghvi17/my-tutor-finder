import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { VerifyProfileDialog } from "@/components/VerifyProfileDialog";
import { isLearnerVerified, isProviderVerified } from "@/lib/profileComplete";
import { TopBar } from "@/components/TopBar";
import { store, useStore } from "@/lib/store";
import { distanceKmBetween, formatDistance } from "@/lib/distance";
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
import { ClassChat } from "@/components/ClassChat";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Building2, MapPin, Wifi, Users, Sparkles, Clock, Award, UsersRound, Globe2, Languages } from "lucide-react";
import { SlotKey } from "@/lib/types";
import { ageFromDob, blocksToSlots } from "@/lib/timeUtils";
import { formatDuration, formatPrice } from "@/lib/listingUtils";
import { useFxRates } from "@/lib/useFxRates";
import { useAuth } from "@/lib/useAuth";
import { toast } from "sonner";
import { recordEvent } from "@/lib/useEvents";

const ListingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const learner = useStore((s) => s.learner);
  const provider = useStore((s) => s.provider);
  const mode = useStore((s) => s.mode);
  const { user } = useAuth();
  const fxRates = useFxRates();
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

  const verified = mode === "provider" ? isProviderVerified(provider) : isLearnerVerified(learner);
  const [verifyOpen, setVerifyOpen] = useState(!verified);

  useEffect(() => {
    setVerifyOpen(!verified);
  }, [verified]);

  // Track a 'view' event for insights & boost attribution
  useEffect(() => {
    if (!listing) return;
    recordEvent(listing, "view", {
      userId: user?.id,
      city: learner.city,
      dob: learner.dob,
      gender: (learner as any).gender,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listing?.id, user?.id]);

  const activeKid = learner.activeKidId ? learner.kids.find((k) => k.id === learner.activeKidId) : null;
  const freeSlots = blocksToSlots(activeKid ? activeKid.freeBlocks : learner.freeBlocks);
  const allSlots = [...listing.slots, ...((listing.onlineSlots ?? []) as typeof listing.slots)];
  const matching = allSlots.filter((s) => freeSlots.includes(s));

  function submit() {
    if (!verified) {
      setVerifyOpen(true);
      return;
    }
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
      learnerUsername: learner.username,
      learnerUserId: user?.id,
      forKidName: activeKid?.name,
      slot,
      note: finalNote,
      isTrial,
    } as any);
    recordEvent(listing!, "request_click", {
      userId: user?.id,
      city: learner.city,
      dob: learner.dob,
      gender: (learner as any).gender,
    });
    toast.success(isTrial ? "Trial class request sent!" : "Request sent! The provider will reply soon.");
    navigate("/requests");
  }

  const baseContact = listing.contactInfo ?? (listing.providerId === "self" ? provider.contactInfo : undefined);
  const contact = listing.locationPin
    ? { ...(baseContact ?? {}), mapsUrl: listing.locationPin }
    : baseContact;
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
            <div
              className="rounded-lg bg-background/95 backdrop-blur-sm p-1.5 shadow-sm flex items-center gap-1.5 flex-wrap"
              onClickCapture={() => recordEvent(listing!, "contact_click", { userId: user?.id, city: learner.city, dob: learner.dob, gender: (learner as any).gender })}
            >
              <ContactActions contact={contact} fallbackAddress={contactFallback} size="sm" />
            </div>
          )}
        </div>
      </div>

      <ClassChat
        listingId={listing.id}
        listingTitle={listing.title}
        providerUserId={listing.providerUserId}
        otherPartyName={listing.providerName}
        floating
      />

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
              {formatPrice(listing, learner.country, fxRates) && <Badge variant="outline">{formatPrice(listing, learner.country, fxRates)}</Badge>}
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
              {listing.teachesInternationally && (
                <Badge variant="outline" className="gap-1 border-primary/40 text-primary">
                  <Globe2 className="h-3 w-3" /> Teaches internationally
                </Badge>
              )}
              {listing.pinCode && (
                <Badge variant="outline" className="gap-1">
                  <MapPin className="h-3 w-3" /> {listing.pinCode}
                </Badge>
              )}
            </div>

            {(() => {
              const yearsExp = listing.providerId === "self" ? provider.yearsExperience : undefined;
              const avgRating = ratings.length ? ratings.reduce((a, r) => a + r.stars, 0) / ratings.length : 0;
              return (
                <div className="space-y-1.5">
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
                  <div className="font-medium">
                    {listing.area}, {listing.city}
                    {(() => {
                      if (listing.mode === "Online") return null;
                      const km = distanceKmBetween(learner.homePin, listing.locationPin);
                      return km != null ? <span className="ml-2 text-primary text-xs font-semibold">{formatDistance(km)}</span> : null;
                    })()}
                  </div>
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

            {(listing.languages?.length ?? 0) > 0 && (
              <div className="space-y-1.5">
                <h3 className="text-sm font-semibold flex items-center gap-1.5">
                  <Languages className="h-3.5 w-3.5" /> Languages of teaching
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {listing.languages!.map((l) => (
                    <Badge key={l} variant="secondary">{l}</Badge>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="font-semibold mb-2">Class schedule</h3>
              {listing.mode === "Both" ? (
                <div className="space-y-3">
                  {listing.slots.length > 0 && (
                    <SlotList title="Offline batches" slots={listing.slots} freeSlots={freeSlots} seats={listing.seatsBySlot} />
                  )}
                  {(listing.onlineSlots?.length ?? 0) > 0 && (
                    <SlotList title="Online batches" slots={listing.onlineSlots ?? []} freeSlots={freeSlots} seats={listing.onlineSeatsBySlot} />
                  )}
                </div>
              ) : (
                <SlotList slots={listing.slots} freeSlots={freeSlots} seats={listing.seatsBySlot} />
              )}
              {matching.length > 0 && (
                <div className="mt-3 rounded-md border border-success/40 bg-success/10 p-2.5">
                  <p className="text-xs font-semibold text-success mb-1.5">
                    ✓ {matching.length} slot{matching.length > 1 ? "s" : ""} match your free time
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {matching.map((s) => (
                      <span key={s} className="text-[11px] px-2 py-0.5 rounded-full bg-success text-success-foreground font-medium">
                        {slotsToText([s])}
                      </span>
                    ))}
                  </div>
                </div>
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
                  {listing.mode === "Both" && listing.slots.length > 0 && (
                    <div className="px-2 py-1 text-[10px] uppercase tracking-wide text-muted-foreground">Offline batches</div>
                  )}
                  {listing.slots.map((s) => {
                    const info = listing.seatsBySlot?.[s];
                    const left = info && info.total > 0 ? Math.max(0, info.total - info.occupied) : null;
                    const full = left === 0;
                    return (
                      <SelectItem key={`off-${s}`} value={s} disabled={full}>
                        {slotsToText([s])}
                        {freeSlots.includes(s) ? "  ✓ free" : ""}
                        {left !== null ? (full ? "  · Full" : `  · ${left} seats left`) : ""}
                      </SelectItem>
                    );
                  })}
                  {listing.mode === "Both" && (listing.onlineSlots?.length ?? 0) > 0 && (
                    <>
                      <div className="px-2 py-1 mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">Online batches</div>
                      {(listing.onlineSlots ?? []).map((s) => {
                        const info = listing.onlineSeatsBySlot?.[s];
                        const left = info && info.total > 0 ? Math.max(0, info.total - info.occupied) : null;
                        const full = left === 0;
                        return (
                          <SelectItem key={`on-${s}`} value={s} disabled={full}>
                            {slotsToText([s])} · Online
                            {freeSlots.includes(s) ? "  ✓ free" : ""}
                            {left !== null ? (full ? "  · Full" : `  · ${left} seats left`) : ""}
                          </SelectItem>
                        );
                      })}
                    </>
                  )}
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
            <label className="flex items-start gap-2.5 rounded-lg border-2 border-success bg-success/15 p-3 cursor-pointer hover:bg-success/25 transition-colors">
              <input
                type="checkbox"
                checked={isTrial}
                onChange={(e) => setIsTrial(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-success"
              />
              <div className="text-sm">
                <div className="font-semibold text-foreground flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-success" /> Request a free trial class
                </div>
                <div className="text-xs text-foreground/70">Try one class before committing.</div>
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

        {ratings.length > 0 && (
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="font-semibold text-lg">Ratings & reviews</h2>
                <p className="text-sm text-muted-foreground">
                  {ratings.length} review{ratings.length > 1 ? "s" : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">
                  {(ratings.reduce((a, r) => a + r.stars, 0) / ratings.length).toFixed(1)}
                </span>
                <StarRating value={ratings.reduce((a, r) => a + r.stars, 0) / ratings.length} />
              </div>
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
        )}
      </main>
      <VerifyProfileDialog
        open={verifyOpen}
        onOpenChange={(v) => {
          setVerifyOpen(v);
          if (!v && !verified) navigate(-1);
        }}
        role={mode === "provider" ? "provider" : "learner"}
      />
    </div>
  );
};

export default ListingDetail;

function SlotList({
  title, slots, freeSlots, seats,
}: {
  title?: string;
  slots: SlotKey[];
  freeSlots: SlotKey[];
  seats?: Record<string, { total: number; occupied: number }>;
}) {
  // Group by day
  const byDay = new Map<string, { hour: number; key: SlotKey }[]>();
  slots.forEach((s) => {
    const [d, h] = s.split("-") as [string, string];
    const arr = byDay.get(d) ?? [];
    arr.push({ hour: parseInt(h, 10), key: s });
    byDay.set(d, arr);
  });
  const DAY_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const days = DAY_ORDER.filter((d) => byDay.has(d));

  function fmt(h: number) {
    const period = h >= 12 ? "PM" : "AM";
    const hr = h % 12 === 0 ? 12 : h % 12;
    return `${hr}${period}`;
  }

  if (!slots.length) return null;

  return (
    <div className="space-y-1.5">
      {title && <div className="text-xs font-medium text-muted-foreground">{title}</div>}
      <div className="rounded-md border divide-y">
        {days.map((d) => {
          const items = (byDay.get(d) ?? []).sort((a, b) => a.hour - b.hour);
          return (
            <div key={d} className="flex items-start gap-3 px-3 py-2 text-xs">
              <div className="w-10 font-semibold text-foreground shrink-0">{d}</div>
              <div className="flex flex-wrap gap-1.5 flex-1">
                {items.map(({ hour, key }) => {
                  const info = seats?.[key];
                  const left = info && info.total > 0 ? Math.max(0, info.total - info.occupied) : null;
                  const full = left === 0;
                  const isFree = freeSlots.includes(key);
                  return (
                    <span
                      key={key}
                      className={
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md border " +
                        (isFree
                          ? "border-success bg-success/10 text-success font-medium"
                          : "border-border bg-muted/40 text-foreground")
                      }
                    >
                      {fmt(hour)}
                      {left !== null && (
                        <span className={full ? "text-destructive font-semibold" : "text-muted-foreground"}>
                          · {full ? "Full" : `${left}/${info!.total}`}
                        </span>
                      )}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

