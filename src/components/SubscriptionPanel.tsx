import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, XCircle } from "lucide-react";
import { useSubscription } from "@/lib/useSubscription";
import { toast } from "sonner";
import { useAuth } from "@/lib/useAuth";

export function SubscriptionPanel() {
  const { user } = useAuth();
  const { tier, isGrowth, expiresAt, downgrade, loading } = useSubscription();
  if (!user) return null;

  async function onCancel() {
    if (!confirm("Cancel your Growth subscription and switch back to Starter?")) return;
    await downgrade();
    toast.success("Subscription cancelled — back on Starter");
  }

  const renews = expiresAt ? new Date(expiresAt).toLocaleDateString() : null;

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
          <Button size="sm" variant="outline" onClick={onCancel} disabled={loading} className="gap-1.5 text-destructive">
            <XCircle className="h-3.5 w-3.5" /> Cancel subscription
          </Button>
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
