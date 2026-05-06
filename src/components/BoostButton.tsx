import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Rocket } from "lucide-react";
import { toast } from "sonner";
import { createBoost, useActiveBoosts, isBoosted } from "@/lib/useBoosts";
import { useAuth } from "@/lib/useAuth";
import { Listing } from "@/lib/types";

interface Props {
  listing: Listing;
}

export function BoostButton({ listing }: Props) {
  const { user } = useAuth();
  const { boosts, refresh } = useActiveBoosts();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const boosted = isBoosted(listing.id, boosts);

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
        city: listing.city,
        category: listing.category,
        ageGroup: listing.ageGroup,
      });
      await refresh();
      toast.success("Class boosted for 7 days 🚀");
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
              Pin <strong>{listing.title}</strong> to the top of Discover for learners in{" "}
              <strong>{listing.city || "your city"}</strong> looking for{" "}
              <strong>{listing.category}</strong> classes for <strong>{listing.ageGroup}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border p-3 bg-muted/30 space-y-1 text-sm">
            <div className="flex justify-between"><span>Duration</span><span className="font-medium">7 days</span></div>
            <div className="flex justify-between"><span>Price</span><span className="font-bold">₹500</span></div>
            <p className="text-[11px] text-muted-foreground pt-1">
              Razorpay test mode — payment is bypassed for now.
            </p>
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
