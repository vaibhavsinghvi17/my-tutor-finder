import { Link } from "react-router-dom";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Sparkles, XCircle } from "lucide-react";
import { useSubscription } from "@/lib/useSubscription";
import { toast } from "sonner";
import { useAuth } from "@/lib/useAuth";
import { supabase } from "@/integrations/supabase/client";

export function SubscriptionPanel() {
  const { user } = useAuth();
  const { isGrowth, expiresAt, refresh, loading } = useSubscription();
  const [cancelling, setCancelling] = useState(false);
  if (!user) return null;

  async function onCancel() {
    setCancelling(true);
    try {
      const { data, error } = await supabase.functions.invoke("razorpay-cancel-subscription", {
        body: { cancel_at_cycle_end: true },
      });
      if (error || !data?.ok) throw new Error(error?.message || data?.error || "Cancel failed");
      toast.success("Subscription cancelled — you'll keep Growth until the cycle ends");
      await refresh();
    } catch (e: any) {
      toast.error(e.message || "Could not cancel");
    } finally {
      setCancelling(false);
    }
  }

  const renews = expiresAt ? new Date(expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : null;

  return (
    <Card className={`p-4 space-y-3 ${isGrowth ? "border-primary/40 bg-primary/5" : ""}`}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Sparkles className={`h-4 w-4 ${isGrowth ? "text-primary" : "text-muted-foreground"}`} />
          <div>
            <div className="text-xs text-muted-foreground">Current plan</div>
            <div className="font-semibold text-sm">
              {isGrowth ? "Growth" : "Starter"}
              {isGrowth && renews && (
                <span className="text-[11px] font-normal text-muted-foreground ml-1.5">
                  · renews {renews}
                </span>
              )}
            </div>
          </div>
        </div>
        <Badge variant={isGrowth ? "default" : "outline"} className="text-[10px]">
          {isGrowth ? "Active" : "Free"}
        </Badge>
      </div>

      <div className="flex gap-2 flex-wrap">
        {isGrowth ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="outline" disabled={loading || cancelling} className="gap-1.5 text-destructive">
                <XCircle className="h-3.5 w-3.5" /> {cancelling ? "Cancelling…" : "Cancel subscription"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel Growth subscription?</AlertDialogTitle>
                <AlertDialogDescription>
                  Future auto-debits will be stopped. You'll keep Growth access until{renews ? ` ${renews}` : " the end of the current cycle"}, then switch to Starter.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep Growth</AlertDialogCancel>
                <AlertDialogAction onClick={onCancel}>Cancel subscription</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <Button asChild size="sm" className="gap-1.5">
            <Link to="/pricing"><Sparkles className="h-3.5 w-3.5" /> Upgrade to Growth</Link>
          </Button>
        )}
        <Button asChild size="sm" variant="ghost">
          <Link to="/pricing">View plans</Link>
        </Button>
      </div>
    </Card>
  );
}
