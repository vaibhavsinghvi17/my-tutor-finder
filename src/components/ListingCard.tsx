import { Link } from "react-router-dom";
import { Listing } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CategoryIcon, categoryGradient } from "./CategoryIcon";
import { MapPin, Wifi, Building2, Users, Sparkles } from "lucide-react";
import { slotsToText } from "./ScheduleGrid";

interface Props {
  listing: Listing;
  reasons?: string[];
}

export function ListingCard({ listing, reasons = [] }: Props) {
  return (
    <Link to={`/listing/${listing.id}`} className="block group animate-fade-in">
      <Card className="overflow-hidden h-full transition-all hover:shadow-elegant hover:-translate-y-0.5 border">
        <div className={`${categoryGradient(listing.category)} h-24 relative flex items-end p-4`}>
          <div className="absolute top-3 right-3 flex gap-1.5">
            <Badge variant="secondary" className="bg-background/90 text-foreground gap-1">
              {listing.mode === "Online" ? <Wifi className="h-3 w-3" /> :
               listing.mode === "Offline" ? <Building2 className="h-3 w-3" /> :
               <><Wifi className="h-3 w-3" /><Building2 className="h-3 w-3" /></>}
              {listing.mode}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-primary-foreground">
            <CategoryIcon category={listing.category} className="h-5 w-5" />
            <span className="text-sm font-medium">{listing.category}</span>
          </div>
        </div>
        <div className="p-4 space-y-2.5">
          <div>
            <h3 className="font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
              {listing.title}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">{listing.providerName}</p>
          </div>
          <div className="flex flex-wrap gap-1.5 text-xs">
            <Badge variant="outline" className="gap-1">
              <Users className="h-3 w-3" /> {listing.ageGroup}
            </Badge>
            {listing.price && <Badge variant="outline">{listing.price}</Badge>}
            {listing.trial && (
              <Badge className="bg-success text-success-foreground border-0 gap-1">
                <Sparkles className="h-3 w-3" /> Free trial
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground flex items-start gap-1">
            <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
            <span className="line-clamp-1">{listing.area}, {listing.city}</span>
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
