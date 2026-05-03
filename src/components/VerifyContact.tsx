import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, MessageCircle, ShieldCheck, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";

type Kind = "email" | "whatsapp";

interface Props {
  kind: Kind;
  value: string;             // current input value
  verifiedValue?: string;    // last verified value (if matches `value`, considered verified)
  onVerified: () => void;    // called when user successfully enters the OTP
}

/**
 * Lightweight client-side OTP simulation. In production this would call a
 * backend that sends an email or WhatsApp OTP. For now we generate a 6-digit
 * code, "send" it (toast), and let the user type it back to confirm ownership.
 */
export function VerifyContact({ kind, value, verifiedValue, onVerified }: Props) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [entered, setEntered] = useState("");

  const isVerified = !!value && !!verifiedValue && value.trim() === verifiedValue.trim();

  function start() {
    if (!value.trim()) {
      toast.error(`Enter a ${kind === "email" ? "email" : "WhatsApp number"} first`);
      return;
    }
    const c = String(Math.floor(100000 + Math.random() * 900000));
    setCode(c);
    setEntered("");
    setOpen(true);
    toast.success(
      kind === "email"
        ? `Verification code sent to ${value}`
        : `Verification code sent to WhatsApp ${value}`,
      { description: `Demo code: ${c}` },
    );
  }

  function confirm() {
    if (entered.trim() === code) {
      onVerified();
      setOpen(false);
      toast.success(`${kind === "email" ? "Email" : "WhatsApp"} verified`);
    } else {
      toast.error("Incorrect code");
    }
  }

  const Icon = kind === "email" ? Mail : MessageCircle;

  return (
    <>
      {isVerified ? (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
          <ShieldCheck className="h-3.5 w-3.5" /> Verified
        </span>
      ) : (
        <Button type="button" size="sm" variant="outline" onClick={start} className="gap-1 h-8">
          <ShieldAlert className="h-3.5 w-3.5" /> Verify
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon className="h-4 w-4" /> Verify your {kind === "email" ? "email" : "WhatsApp number"}
            </DialogTitle>
            <DialogDescription>
              Enter the 6-digit code we sent to <span className="font-medium">{value}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Verification code</Label>
            <Input
              value={entered}
              onChange={(e) => setEntered(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123456"
              inputMode="numeric"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={confirm} disabled={entered.length !== 6}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
