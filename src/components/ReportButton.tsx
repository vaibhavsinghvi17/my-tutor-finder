import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";

type TargetType = "listing" | "user" | "review" | "message";

interface Props {
  targetType: TargetType;
  targetId: string;
  reporterName?: string;
  compact?: boolean;
  label?: string;
}

const REASONS = [
  { value: "spam", label: "Spam or repeated posting" },
  { value: "inappropriate", label: "Inappropriate / offensive content" },
  { value: "fake", label: "Fake or misleading" },
  { value: "scam", label: "Looks like a scam" },
  { value: "harassment", label: "Harassment or abuse" },
  { value: "other", label: "Other" },
];

export function ReportButton({ targetType, targetId, reporterName, compact, label = "Report" }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("spam");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!user) {
      toast.info("Please sign in to report");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("reports").insert({
      reporter_user_id: user.id,
      reporter_name: reporterName ?? null,
      target_type: targetType,
      target_id: targetId,
      reason,
      details: details.trim() || null,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Thanks — our team will review this report.");
    setOpen(false);
    setDetails("");
  }

  return (
    <>
      {compact ? (
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setOpen(true)} title="Report">
          <Flag className="h-3 w-3 text-muted-foreground" />
        </Button>
      ) : (
        <Button size="sm" variant="ghost" onClick={() => setOpen(true)} className="gap-1.5 text-muted-foreground hover:text-destructive">
          <Flag className="h-3.5 w-3.5" /> {label}
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Report this {targetType}</DialogTitle>
            <DialogDescription>
              Help us keep the community safe. Our team reviews every report.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Reason</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REASONS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Details (optional)</Label>
              <Textarea
                value={details}
                onChange={(e) => setDetails(e.target.value.slice(0, 500))}
                placeholder="Tell us a bit more…"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
            <Button onClick={submit} disabled={busy} variant="destructive" className="gap-1.5">
              <Flag className="h-3.5 w-3.5" /> {busy ? "Sending…" : "Submit report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
