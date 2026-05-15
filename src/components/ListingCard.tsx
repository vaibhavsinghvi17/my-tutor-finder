import { Link } from "react-router-dom";
import { Listing } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CategoryIcon, categoryGradient } from "./CategoryIcon";
import { StarRating } from "./StarRating";
import { MapPin, Wifi, Building2, Users, Sparkles, Clock, Bookmark, Share2, MessageCircle, Link as LinkIcon, Award, UsersRound, Globe2, Armchair } from "lucide-react";
import { slotsToText } from "./ScheduleGrid";
import { formatDuration, formatPrice, formatCourseLength } from "@/lib/listingUtils";
import { useFxRates } from "@/lib/useFxRates";
import { store, useStore } from "@/lib/store";
import { distanceKmBetween, formatDistance } from "@/lib/distance";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  listing: Listing;
  reasons?: string[];
}

export function ListingCard({ listing, reasons = [] }: Props) {
  const allRatings = useStore((s) => s.ratings);
  const allRequests = useStore((s) => s.requests);
  const provider = useStore((s) => s.provider);
  const savedListings = useStore((s) => s.learner.savedListings);
  const ratings = allRatings.filter((r) => r.listingId === listing.id);
  const avg = ratings.length ? ratings.reduce((a, r) => a + r.stars, 0) / ratings.length : 0;
  const requestCount = allRequests.filter((r) => r.listingId === listing.id).length;
  // Unique-ish interaction count: requests + reviews + a deterministic seed for demo listings
  const seedInteractions = listing.providerId.startsWith("seed-")
    ? ((listing.id.charCodeAt(listing.id.length - 1) * 7) % 40) + 5
    : 0;
  const interactions = requestCount + ratings.length + seedInteractions;
  const yearsExp = listing.providerId === "self" ? provider.yearsExperience : undefined;
  const viewerCountry = useStore((s) => s.learner.country);
  const homePin = useStore((s) => s.learner.homePin);
  const fxRates = useFxRates();
  const priceText = formatPrice(listing, viewerCountry, fxRates);
  const durationText = formatDuration(listing.durationMins);
  const courseLengthText = formatCourseLength(listing.courseDays);
  const isSaved = (savedListings || []).includes(listing.id);
  const shareUrl = `${window.location.origin}/listing/${listing.id}`;
  const shareText = `Check out "${listing.title}" by ${listing.providerName} on Scholarr`;
  const distanceKm = listing.mode !== "Online" ? distanceKmBetween(homePin, listing.locationPin) : null;

  function stop(e: React.MouseEvent) { e.preventDefault(); e.stopPropagation(); }

  return (
    <Link to={`/listing/${listing.id}`} className="block group animate-fade-in">
      <Card className="overflow-hidden h-full transition-all hover:shadow-elegant hover:-translate-y-0.5 border">
        <div className={`${categoryGradient(listing.category)} h-14 relative flex items-center justify-between px-3`}>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-background/85 backdrop-blur text-foreground shadow-sm">
            <CategoryIcon category={listing.category} className="h-3.5 w-3.5" />
            <span className="text-[11px] font-semibold tracking-wide">{listing.category}</span>
          </div>
          <div className="flex gap-1.5 items-center">
            <button
              onClick={(e) => { stop(e); store.toggleSaved(listing.id); toast.success(isSaved ? "Removed from saved" : "Saved to your profile"); }}
              className={cn(
                "h-7 w-7 rounded-full grid place-items-center bg-background/90 hover:bg-background transition-colors shadow-sm",
                isSaved && "text-primary",
              )}
              title={isSaved ? "Saved" : "Save"}
            >
              <Bookmark className={cn("h-3.5 w-3.5", isSaved && "fill-current")} />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  onClick={stop}
                  className="h-7 w-7 rounded-full grid place-items-center bg-background/90 hover:bg-background shadow-sm"
                  title="Share"
                >
                  <Share2 className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover" onClick={stop}>
                <DropdownMenuItem
                  onClick={(e) => {
                    stop(e);
                    window.open(`https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`, "_blank");
                  }}
                >
                  <MessageCircle className="h-4 w-4 mr-2 text-[#25D366]" /> Share via WhatsApp
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={async (e) => {
                    stop(e);
                    if (navigator.share) {
                      try { await navigator.share({ title: listing.title, text: shareText, url: shareUrl }); } catch {}
                    } else {
                      await navigator.clipboard.writeText(shareUrl);
                      toast.success("Link copied — share with anyone");
                    }
                  }}
                >
                  <Share2 className="h-4 w-4 mr-2" /> Share in app
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={async (e) => {
                    stop(e);
                    await navigator.clipboard.writeText(shareUrl);
                    toast.success("Link copied");
                  }}
                >
                  <LinkIcon className="h-4 w-4 mr-2" /> Copy link
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Badge variant="secondary" className="bg-background/90 text-foreground gap-1 shadow-sm">
              {listing.mode === "Online" ? <Wifi className="h-3 w-3" /> :
               listing.mode === "Offline" ? <Building2 className="h-3 w-3" /> :
               <><Wifi className="h-3 w-3" /><Building2 className="h-3 w-3" /></>}
              {listing.mode}
            </Badge>
          </div>
        </div>
        <div className="p-4 space-y-2.5">
          <div>
            <h3 className="font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
              {listing.title}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">{listing.providerName}</p>
          </div>

          {(ratings.length > 0 || interactions > 0 || (yearsExp && yearsExp > 0)) && (
            <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
              {ratings.length > 0 && (
                <div className="flex items-center gap-1">
                  <StarRating value={avg} size="sm" />
                  <span>{avg.toFixed(1)} ({ratings.length})</span>
                </div>
              )}
              {interactions > 0 && (
                <span className="inline-flex items-center gap-1">
                  <UsersRound className="h-3 w-3" /> {interactions} interested
                </span>
              )}
              {yearsExp && yearsExp > 0 && (
                <span className="inline-flex items-center gap-1 text-primary font-medium">
                  <Award className="h-3 w-3" /> {yearsExp}+ yrs
                </span>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-1.5 text-xs">
            <Badge variant="outline" className="gap-1">
              <Users className="h-3 w-3" /> {listing.ageGroup}
            </Badge>
            {durationText && (
              <Badge variant="outline" className="gap-1">
                <Clock className="h-3 w-3" /> {durationText}
              </Badge>
            )}
            {priceText && <Badge variant="outline">{priceText}</Badge>}
            {listing.trial && (
              <Badge className="bg-success text-success-foreground border-0 gap-1">
                <Sparkles className="h-3 w-3" /> Free trial
              </Badge>
            )}
            {listing.teachesInternationally && (
              <Badge variant="outline" className="gap-1 border-primary/40 text-primary">
                <Globe2 className="h-3 w-3" /> International
              </Badge>
            )}
            {(() => {
              if (!listing.seatsBySlot) return null;
              const totals = Object.values(listing.seatsBySlot).filter((s) => s.total > 0);
              if (!totals.length) return null;
              const left = totals.reduce((a, s) => a + Math.max(0, s.total - s.occupied), 0);
              const total = totals.reduce((a, s) => a + s.total, 0);
              const full = left === 0;
              return (
                <Badge variant={full ? "destructive" : "outline"} className="gap-1">
                  <Armchair className="h-3 w-3" /> {full ? "Full" : `${left}/${total} seats`}
                </Badge>
              );
            })()}
          </div>
          <p className="text-xs text-muted-foreground flex items-start gap-1">
            <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
            <span className="line-clamp-1">
              {listing.area}, {listing.city}{listing.pinCode ? ` · ${listing.pinCode}` : ""}
              {distanceKm != null && (
                <span className="ml-1 text-primary font-medium">· {formatDistance(distanceKm)}</span>
              )}
            </span>
          </p>
          <p className="text-xs text-muted-foreground line-clamp-1">⏰ {slotsToText(listing.slots)}</p>
          {reasons.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {reasons.map((r) => (
                <span key={r} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                  {r}
                </span>
              ))}
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}
