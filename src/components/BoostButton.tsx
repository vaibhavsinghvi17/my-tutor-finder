import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Rocket } from "lucide-react";
import { toast } from "sonner";
import { createBoost, useActiveBoosts, isBoosted } from "@/lib/useBoosts";
import { useSubscription } from "@/lib/useSubscription";
import { useAuth } from "@/lib/useAuth";
import { Listing, AGE_GROUPS } from "@/lib/types";

interface Props {
  listing: Listing;
}

const ANY = "__any__";

export function BoostButton({ listing }: Props) {
  const { user } = useAuth();
  const { isGrowth } = useSubscription();
  const { boosts, refresh } = useActiveBoosts();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [city, setCity] = useState(listing.city ?? "");
  const [minAge, setMinAge] = useState<number>(3);
  const [maxAge, setMaxAge] = useState<number>(90);
  const [gender, setGender] = useState<string>(ANY);
  const boosted = isBoosted(listing.id, boosts);

  const DURATION_OPTIONS: { days: number; label: string; price: number }[] = [
    { days: 3, label: "3 days", price: 500 },
    { days: 5, label: "5 days", price: 900 },
    { days: 7, label: "7 days", price: 1500 },
    { days: 15, label: "15 days", price: 2900 },
    { days: 30, label: "1 month", price: 5500 },
  ];
  const [durationDays, setDurationDays] = useState<number>(isGrowth ? 7 : 3);
  const selected = DURATION_OPTIONS.find((d) => d.days === durationDays) ?? DURATION_OPTIONS[0];
  const price = selected.price;

  async function handleBoost() {
    if (!user) {
      toast.info("Please sign in to boost a class");
      return;
    }
    setBusy(true);
    try {
      // Razorpay test bypass — pretend payment was made and create the boost.
      await createBoost({
        listingId: listing.id,
        providerUserId: user.id,
        durationDays,
        city: city.trim() || null,
        category: listing.category,
        ageGroup: `${Math.min(minAge, maxAge)}-${Math.max(minAge, maxAge)}`,
        gender: gender === ANY ? null : gender,
      });
      await refresh();
      toast.success(`Class boosted for ${selected.label} 🚀`);
      setOpen(false);
    } catch (e: any) {
      toast.error(e.message ?? "Could not boost");
    } finally {
      setBusy(false);
    }
  }

  if (boosted) {
    return (
      <Button size="sm" variant="outline" disabled className="gap-1.5">
        <Rocket className="h-4 w-4 text-primary" /> Boosted
      </Button>
    );
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)} className="gap-1.5">
        <Rocket className="h-4 w-4" /> Boost
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Boost this class</DialogTitle>
            <DialogDescription>
              Pin <strong>{listing.title}</strong> to the top of Discover for the audience you choose.
              Leave a field blank / Any to reach everyone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="boost-city" className="text-xs">Target city</Label>
              <Input
                id="boost-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Any city"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Age range</Label>
                <span className="text-[11px] text-muted-foreground">
                  {Math.min(minAge, maxAge)}–{Math.max(minAge, maxAge)} yrs
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="boost-min-age" className="text-[10px] text-muted-foreground">Min</Label>
                  <Input
                    id="boost-min-age"
                    type="number"
                    min={3}
                    max={90}
                    value={minAge}
                    onChange={(e) => {
                      const v = Math.max(3, Math.min(90, Number(e.target.value) || 3));
                      setMinAge(v);
                      if (v > maxAge) setMaxAge(v);
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="boost-max-age" className="text-[10px] text-muted-foreground">Max</Label>
                  <Input
                    id="boost-max-age"
                    type="number"
                    min={3}
                    max={90}
                    value={maxAge}
                    onChange={(e) => {
                      const v = Math.max(3, Math.min(90, Number(e.target.value) || 90));
                      setMaxAge(v);
                      if (v < minAge) setMinAge(v);
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Gender</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ANY}>Any</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Boost duration</Label>
              <Select value={String(durationDays)} onValueChange={(v) => setDurationDays(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map((d) => (
                    <SelectItem key={d.days} value={String(d.days)}>
                      {d.label} — ₹{d.price.toLocaleString("en-IN")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg border p-3 bg-muted/30 space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Plan</span>
                <span className="font-medium">{isGrowth ? "Growth" : "Starter"}</span>
              </div>
              <div className="flex justify-between">
                <span>Duration</span>
                <span className="font-medium">{selected.label}</span>
              </div>
              <div className="flex justify-between"><span>Price</span><span className="font-bold">₹{price.toLocaleString("en-IN")}</span></div>
              {isGrowth && (
                <p className="text-[11px] text-muted-foreground pt-1 leading-snug">
                  Growth boosts rank above Starter-plan boosts in Discover for the same duration.
                </p>
              )}
              <p className="text-[11px] text-muted-foreground italic pt-0.5">
                Razorpay test mode — payment is bypassed for now.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
            <Button onClick={handleBoost} disabled={busy} className="gap-1.5">
              <Rocket className="h-4 w-4" /> {busy ? "Boosting..." : `Pay ₹${price.toLocaleString("en-IN")} & Boost`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

