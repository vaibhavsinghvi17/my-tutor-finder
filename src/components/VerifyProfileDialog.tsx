import { useState } from "react";
import { ShieldCheck, ShieldAlert } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { VerifyContact } from "@/components/VerifyContact";
import { store, useStore } from "@/lib/store";
import { isLearnerVerified, isProviderVerified } from "@/lib/profileComplete";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** "learner" gates exploring classes; "provider" gates creating a class. */
  role: "learner" | "provider";
  /** Optional success callback after profile becomes verified. */
  onVerified?: () => void;
}

/**
 * Quick in-place verification popup. Asks for name + mobile number and an SMS OTP.
 * Used to gate sensitive actions (opening class details, publishing a class)
 * without redirecting the user to the profile page.
 */
export function VerifyProfileDialog({ open, onOpenChange, role, onVerified }: Props) {
  const learner = useStore((s) => s.learner);
  const provider = useStore((s) => s.provider);

  const isLearner = role === "learner";
  const name = isLearner ? learner.name : provider.businessName;
  const phone = isLearner ? (learner.phone ?? "") : (provider.phone ?? "");
  const verifiedPhone = isLearner ? learner.verifiedPhone : provider.verifiedPhone;

  const [draftName, setDraftName] = useState(name ?? "");
  const [draftPhone, setDraftPhone] = useState(phone ?? "");

  function setName(v: string) {
    setDraftName(v);
    if (isLearner) store.updateLearner({ name: v.slice(0, 80) });
    else store.updateProvider({ businessName: v.slice(0, 100) });
  }

  function setPhone(v: string) {
    const trimmed = v.slice(0, 20);
    setDraftPhone(trimmed);
    if (isLearner) store.updateLearner({ phone: trimmed });
    else store.updateProvider({ phone: trimmed });
  }

  function markVerified() {
    if (isLearner) store.updateLearner({ verifiedPhone: draftPhone });
    else store.updateProvider({ verifiedPhone: draftPhone });
    toast.success("Profile verified — happy exploring!");
    // Re-check after store update on next tick
    setTimeout(() => {
      const s = store.get();
      const ok = role === "learner" ? isLearnerVerified(s.learner) : isProviderVerified(s.provider);
      if (ok) {
        onOpenChange(false);
        onVerified?.();
      }
    }, 0);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mx-auto h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-primary/70 grid place-items-center text-primary-foreground shadow-elegant mb-2">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center">Quick verification to continue</DialogTitle>
          <DialogDescription className="text-center">
            {isLearner
              ? "Verify your name and mobile number to keep exploring. This keeps the app safe from spam."
              : "Verify your name and mobile number to publish a class. This keeps the platform safe and trustworthy for learners."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>{isLearner ? "Your name" : "Business name"}</Label>
            <Input
              value={draftName}
              onChange={(e) => setName(e.target.value)}
              placeholder={isLearner ? "e.g. Aanya Sharma" : "e.g. Bright Beats Studio"}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Mobile number</Label>
            <div className="flex gap-2">
              <Input
                type="tel"
                inputMode="tel"
                value={draftPhone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
              />
              <VerifyContact
                kind="phone"
                value={draftPhone}
                verifiedValue={verifiedPhone}
                onVerified={markVerified}
              />
            </div>
            {!draftPhone.trim() && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <ShieldAlert className="h-3 w-3" /> Required to receive an SMS OTP
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Maybe later</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
