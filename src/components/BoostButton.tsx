import { useState } from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Rocket } from "lucide-react";
import { toast } from "sonner";
import { useActiveBoosts, isBoosted } from "@/lib/useBoosts";
import { useSubscription } from "@/lib/useSubscription";
import { useAuth } from "@/lib/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { openRazorpay } from "@/lib/razorpay";
import { Listing } from "@/lib/types";
import { LocationTargeter, TargetEntry, targetsToString } from "@/components/LocationTargeter";

interface Props {
  listing: Listing;
}

const ANY = "__any__";

export function BoostButton({ listing }: Props) {
  const { user } = useAuth();
  const { isGrowth } = useSubscription();
  const { boosts, refresh: refreshBoosts } = useActiveBoosts();
  const [open, setOpen] = useState(false);
  const [paying, setPaying] = useState(false);
  const [targets, setTargets] = useState<TargetEntry[]>(
    listing.city ? [{ kind: "city", value: listing.city }] : []
  );
  const [minAge, setMinAge] = useState<number>(3);
  const [maxAge, setMaxAge] = useState<number>(90);
  const [gender, setGender] = useState<string>(ANY);
  const boosted = isBoosted(listing.id, boosts);

  // Boost tier follows the tutor's plan: Starter → 3 days, Growth → 7 days.
  const durationDays = isGrowth ? 7 : 3;
  const priceId = isGrowth ? "boost_growth_7d" : "boost_starter_3d";
  const price = 500;
  const durationLabel = isGrowth ? "7 days" : "3 days";

  async function handleBoost() {
    if (!user) {
      toast.info("Please sign in to boost a class");
      return;
    }
    setOpen(false);
    setPaying(true);
    try {
      const { data, error } = await supabase.functions.invoke("razorpay-create-order", {
        body: {
          priceId,
          purpose: "boost",
          listingId: listing.id,
          durationDays,
          city: targetsToString(targets) || undefined,
          category: listing.category || undefined,
          ageGroup: `${Math.min(minAge, maxAge)}-${Math.max(minAge, maxAge)}`,
          gender: gender === ANY ? undefined : gender,
        },
      });
      if (error || !data?.order_id) {
        throw new Error(error?.message || data?.error || "Could not start checkout");
      }
      await openRazorpay({
        key: data.key_id,
        order_id: data.order_id,
        amount: data.amount,
        currency: data.currency,
        name: "Scholarr",
        description: `Boost · ${listing.title} · ${durationLabel}`,
        prefill: { email: data.email },
        handler: async (resp) => {
          try {
            const { data: v, error: vErr } = await supabase.functions.invoke("razorpay-verify", { body: resp });
            if (vErr || !v?.ok) throw new Error(vErr?.message || v?.error || "Verification failed");
            toast.success("Class boosted!");
            await refreshBoosts?.();
          } catch (e: any) {
            toast.error(e.message || "Verification failed");
          }
        },
        modal: { ondismiss: () => setPaying(false) },
      });
    } catch (e: any) {
      toast.error(e.message || "Could not start checkout");
    } finally {
      setPaying(false);
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
        <DialogContent className="max-w-sm w-[calc(100%-2rem)] rounded-xl max-h-[calc(100dvh-2rem)] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Boost this class</DialogTitle>
            <DialogDescription>
              Pin <strong>{listing.title}</strong> to the top of Discover for the audience you choose.
              Leave a field blank / Any to reach everyone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Target locations</Label>
              <LocationTargeter
                value={targets}
                onChange={setTargets}
                placeholder="Search countries, cities, areas…"
              />
              <p className="text-[10px] text-muted-foreground">
                Add one or more — country, state, city, or area. Leave empty to target everyone.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Age range</Label>
                <span className="text-[11px] font-medium text-primary">
                  {minAge === maxAge ? `${minAge} yrs` : `${minAge}–${maxAge} yrs`}
                </span>
              </div>
              <SliderPrimitive.Root
                min={3}
                max={90}
                step={1}
                minStepsBetweenThumbs={0}
                value={[minAge, maxAge]}
                onValueChange={(v) => {
                  const [a, b] = v;
                  setMinAge(Math.min(a, b));
                  setMaxAge(Math.max(a, b));
                }}
                className="relative flex w-full touch-none select-none items-center py-1"
              >
                <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-secondary">
                  <SliderPrimitive.Range className="absolute h-full bg-primary" />
                </SliderPrimitive.Track>
                <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full border-2 border-primary bg-background shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full border-2 border-primary bg-background shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              </SliderPrimitive.Root>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={3}
                  max={90}
                  value={minAge}
                  onChange={(e) => {
                    const v = Math.max(3, Math.min(90, Number(e.target.value) || 3));
                    setMinAge(v);
                    if (v > maxAge) setMaxAge(v);
                  }}
                  className="h-8 text-xs"
                />
                <span className="text-xs text-muted-foreground">to</span>
                <Input
                  type="number"
                  min={3}
                  max={90}
                  value={maxAge}
                  onChange={(e) => {
                    const v = Math.max(3, Math.min(90, Number(e.target.value) || 90));
                    setMaxAge(v);
                    if (v < minAge) setMinAge(v);
                  }}
                  className="h-8 text-xs"
                />
              </div>
              <div className="flex flex-wrap gap-1">
                {[
                  { label: "Kids", min: 3, max: 12 },
                  { label: "Teens", min: 13, max: 17 },
                  { label: "Adults", min: 18, max: 49 },
                  { label: "Seniors", min: 50, max: 90 },
                  { label: "All", min: 3, max: 90 },
                ].map((r) => (
                  <button
                    key={r.label}
                    type="button"
                    onClick={() => { setMinAge(r.min); setMaxAge(r.max); }}
                    className="rounded-full border px-2 py-0.5 text-[10px] font-medium hover:bg-muted"
                  >
                    {r.label}
                  </button>
                ))}
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

            <div className="rounded-lg border p-3 bg-muted/30 space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Plan</span>
                <span className="font-medium">{isGrowth ? "Growth" : "Starter"}</span>
              </div>
              <div className="flex justify-between">
                <span>Duration</span>
                <span className="font-medium">{durationLabel}</span>
              </div>
              <div className="flex justify-between"><span>Price</span><span className="font-bold">₹{price.toLocaleString("en-IN")}</span></div>
              {!isGrowth && (
                <p className="text-[11px] text-muted-foreground pt-1 leading-snug">
                  Upgrade to Growth for a 7-day boost at the same price.
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleBoost} disabled={paying} className="gap-1.5">
              <Rocket className="h-4 w-4" /> {paying ? "Opening…" : `Pay ₹${price.toLocaleString("en-IN")} & Boost`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

