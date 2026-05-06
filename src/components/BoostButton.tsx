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
  const [ageGroup, setAgeGroup] = useState<string>(listing.ageGroup ?? ANY);
  const [gender, setGender] = useState<string>(ANY);
  const boosted = isBoosted(listing.id, boosts);
  const durationDays = isGrowth ? 7 : 3;

  async function handleBoost() {
    if (!user) {
      toast.info("Please sign in to boost a class");
      return;
    }
    setBusy(true);
    try {
      // Razorpay test bypass — pretend ₹500 was paid and create the boost.
      await createBoost({
        listingId: listing.id,
        providerUserId: user.id,
        durationDays,
        city: city.trim() || null,
        category: listing.category,
        ageGroup: ageGroup === ANY ? null : ageGroup,
        gender: gender === ANY ? null : gender,
      });
      await refresh();
      toast.success(`Class boosted for ${durationDays} days 🚀`);
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
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Age group</Label>
                <Select value={ageGroup} onValueChange={setAgeGroup}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY}>Any</SelectItem>
                    {AGE_GROUPS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
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
            </div>

            <div className="rounded-lg border p-3 bg-muted/30 space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Plan</span>
                <span className="font-medium">{isGrowth ? "Growth" : "Starter"}</span>
              </div>
              <div className="flex justify-between">
                <span>Duration</span>
                <span className="font-medium">{durationDays} days</span>
              </div>
              <div className="flex justify-between"><span>Price</span><span className="font-bold">₹500</span></div>
              {!isGrowth ? (
                <p className="text-[11px] text-muted-foreground pt-1 leading-snug">
                  Starter boosts run for <strong>3 days</strong> at ₹500. Growth members get <strong>7 days</strong> for the same price and rank above Starter boosts in Discover.
                </p>
              ) : (
                <p className="text-[11px] text-muted-foreground pt-1 leading-snug">
                  Growth boosts run for <strong>7 days</strong> and appear above Starter-plan boosts in Discover.
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
              <Rocket className="h-4 w-4" /> {busy ? "Boosting..." : "Pay ₹500 & Boost"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
