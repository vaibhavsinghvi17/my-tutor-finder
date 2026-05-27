import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Sparkles, X } from "lucide-react";
import { useSubscription } from "@/lib/useSubscription";
import { useAuth } from "@/lib/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

/**
 * Reminder banner shown to Growth tutors when their plan expires
 * within the next 3 days. One-time payment model — no auto-debit.
 * Also writes an in-app notification once per day so users see it
 * in their bell even after dismissing the banner.
 */
export function GrowthExpiryBanner() {
  const { user } = useAuth();
  const { isGrowth, expiresAt } = useSubscription();
  const [dismissed, setDismissed] = useState(false);

  const daysLeft = useMemo(() => {
    if (!expiresAt) return null;
    const ms = new Date(expiresAt).getTime() - Date.now();
    return Math.ceil(ms / (24 * 3600 * 1000));
  }, [expiresAt]);

  const inWindow = isGrowth && daysLeft !== null && daysLeft <= 3 && daysLeft >= 0;

  // Insert a notification once per day per user when entering the reminder window
  useEffect(() => {
    if (!inWindow || !user || daysLeft === null) return;
    const key = `growth-expiry-notif-${user.id}-${new Date().toISOString().slice(0, 10)}`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, "1");
    supabase.from("notifications").insert({
      user_id: user.id,
      title: daysLeft === 0 ? "Your Growth plan expires today" : `Growth plan expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`,
      body: "Renew now to keep priority listing, full learner contacts and the verified badge. Pay via UPI or card.",
      kind: "billing",
      link: "/pricing",
      metadata: { days_left: daysLeft, purpose: "growth_renewal_reminder" },
    }).then(() => {});
  }, [inWindow, user, daysLeft]);

  if (!inWindow || dismissed) return null;

  const label =
    daysLeft === 0
      ? "Your Growth plan expires today"
      : `Your Growth plan expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`;

  return (
    <div className="container pt-3">
      <div className="rounded-lg border-2 border-primary/40 bg-primary/5 px-3 py-2.5 flex items-center gap-3 shadow-sm">
        <Sparkles className="h-4 w-4 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-foreground">{label}</div>
          <div className="text-xs text-muted-foreground">No auto-debit — renew with UPI or card to keep your benefits.</div>
        </div>
        <Link
          to="/pricing"
          className="text-xs font-semibold bg-primary text-primary-foreground rounded-md px-3 py-1.5 hover:opacity-90 shrink-0"
        >
          Renew now
        </Link>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="text-muted-foreground hover:text-foreground p-1 shrink-0"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
