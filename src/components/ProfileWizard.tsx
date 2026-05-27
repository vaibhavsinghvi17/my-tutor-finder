import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { LocationFields } from "@/components/LocationFields";
import { PinCodeInput } from "@/components/PinCodeInput";
import { InterestPicker } from "@/components/InterestPicker";
import { DatePicker } from "@/components/DatePicker";
import { VerifyContact } from "@/components/VerifyContact";
import { FreeTimeEditor } from "@/components/FreeTimeEditor";
import { store, useStore } from "@/lib/store";
import { useCategories } from "@/lib/useCategories";
import { useAuth } from "@/lib/useAuth";
import { Check, ChevronLeft, ChevronRight, Sparkles, MapPin, BookOpen, ShieldCheck, GraduationCap, Briefcase, Clock } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  mode: "learner" | "provider";
  open: boolean;
  onClose: () => void;
  initialStep?: number;
}

const Req = () => <span className="text-destructive ml-0.5">*</span>;

function StepHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-start gap-3 pb-2">
      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 grid place-items-center text-primary shrink-0">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <h3 className="font-semibold leading-tight">{title}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

export function ProfileWizard({ mode, open, onClose, initialStep }: Props) {
  const learner = useStore((s) => s.learner);
  const provider = useStore((s) => s.provider);
  const { addCategory } = useCategories();
  const { user } = useAuth();
  const [step, setStep] = useState(initialStep ?? 0);

  useEffect(() => {
    if (open) setStep(initialStep ?? 0);
  }, [open, initialStep]);

  const isLearner = mode === "learner";
  const steps = isLearner
    ? ["Basics", "Location", "Interests", "Timings", "Verify"]
    : ["Basics", "Location", "Categories", "Verify"];

  // Stage state — committed to store on each Next so refresh is safe
  const data = isLearner ? learner : provider;
  const phone = (data.phone ?? "");
  const verifiedPhone = data.verifiedPhone;
  const phoneVerified = !!phone && phone === verifiedPhone;

  function update(patch: Record<string, any>) {
    if (isLearner) store.updateLearner(patch);
    else store.updateProvider(patch);
  }

  // Validation per step
  const stepValid = useMemo(() => {
    if (step === 0) {
      if (isLearner) {
        return !!learner.name?.trim() && !!learner.dob?.trim();
      }
      return !!provider.businessName?.trim();
    }
    if (step === 1) {
      const d = isLearner ? learner : provider;
      return !!d.country && !!d.state && !!d.city && !!d.pinCode?.trim();
    }
    if (step === 2) {
      if (isLearner) return (learner.interests?.length ?? 0) > 0;
      return (provider.categories?.length ?? 0) > 0;
    }
    if (isLearner && step === 3) {
      // Timings are optional — always allow continuing
      return true;
    }
    const verifyStep = isLearner ? 4 : 3;
    if (step === verifyStep) {
      return phoneVerified;
    }
    return true;
  }, [step, isLearner, learner, provider, phoneVerified]);

  const progress = Math.round(((step + (stepValid ? 1 : 0)) / steps.length) * 100);

  function next() {
    if (!stepValid) {
      toast.error("Please complete the highlighted fields");
      return;
    }
    if (step < steps.length - 1) setStep(step + 1);
    else finish();
  }

  function finish() {
    toast.success("Profile set up!");
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg p-0 overflow-hidden gap-0 flex flex-col max-h-[calc(100dvh-2rem)]">
        {/* Hero header */}
        <div className="bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-5 border-b">
          <DialogHeader className="text-left">
            <div className="flex items-center gap-2 text-xs font-medium text-primary mb-1">
              <Sparkles className="h-3.5 w-3.5" />
              Quick setup
            </div>
            <DialogTitle className="text-xl">
              {isLearner ? "Set up your learner profile" : "Set up your tutor profile"}
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {isLearner
                ? "Just a few details so we can match you with the right classes nearby."
                : "Just a few details so learners nearby can discover your classes."}
            </p>
          </DialogHeader>
          {/* Progress */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
              <span>Step {step + 1} of {steps.length} · {steps[step]}</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-1.5" />
            <div className="flex items-center gap-1.5 mt-2">
              {steps.map((s, i) => (
                <div
                  key={s}
                  className={cn(
                    "flex-1 h-1 rounded-full transition-colors",
                    i < step ? "bg-primary" : i === step ? "bg-primary/60" : "bg-muted",
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 flex-1 min-h-0 overflow-y-auto space-y-4">
          {step === 0 && (
            <div className="space-y-4">
              <StepHeader
                icon={isLearner ? GraduationCap : Briefcase}
                title="The basics"
                subtitle={isLearner ? "Tell us who's learning" : "Tell us about your class"}
              />
              {isLearner ? (
                <>
                  <div className="space-y-1.5">
                    <Label>Full name<Req /></Label>
                    <Input
                      value={learner.name ?? ""}
                      onChange={(e) => update({ name: e.target.value.slice(0, 80) })}
                      placeholder="e.g. Aanya Sharma"
                      autoFocus
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Date of birth<Req /></Label>
                    <DatePicker
                      value={learner.dob ?? ""}
                      onChange={(v) => update({ dob: v })}
                    />
                    <p className="text-[11px] text-muted-foreground">Used to match age-appropriate classes.</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email <span className="text-muted-foreground text-xs">(optional)</span></Label>
                    <Input
                      type="email"
                      value={learner.email ?? ""}
                      onChange={(e) => update({ email: e.target.value.slice(0, 120) })}
                      placeholder="you@example.com"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Preferred class mode<Req /></Label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {(["Online", "Offline", "Both", "Any"] as const).map((m) => {
                        const active = (learner.preferredMode ?? "Any") === m;
                        return (
                          <button
                            key={m}
                            type="button"
                            onClick={() => update({ preferredMode: m })}
                            className={cn(
                              "h-9 rounded-md border text-xs font-medium transition-colors",
                              active
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-input hover:bg-muted",
                            )}
                          >
                            {m}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[11px] text-muted-foreground">How would you like to attend classes?</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <Label>I'm registering as<Req /></Label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {([
                        { k: "business", label: "Business / Institute" },
                        { k: "personal", label: "Individual tutor" },
                      ] as const).map(({ k, label }) => {
                        const active = (provider.providerKind ?? "business") === k;
                        return (
                          <button
                            key={k}
                            type="button"
                            onClick={() => update({ providerKind: k })}
                            className={cn(
                              "h-9 rounded-md border text-xs font-medium transition-colors",
                              active ? "border-primary bg-primary/10 text-primary" : "border-input hover:bg-muted",
                            )}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>{(provider.providerKind ?? "business") === "personal" ? "Your name" : "Business name"}<Req /></Label>
                    <Input
                      value={provider.businessName ?? ""}
                      onChange={(e) => update({ businessName: e.target.value.slice(0, 80) })}
                      placeholder={(provider.providerKind ?? "business") === "personal" ? "e.g. Aanya Sharma" : "e.g. Bright Beats Music"}
                      autoFocus
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Short bio <span className="text-muted-foreground text-xs">(optional)</span></Label>
                    <Textarea
                      value={provider.bio ?? ""}
                      onChange={(e) => update({ bio: e.target.value.slice(0, 600) })}
                      placeholder="What you teach, your style, who you teach…"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Years of experience <span className="text-muted-foreground text-xs">(optional)</span></Label>
                    <Input
                      type="number"
                      min={0}
                      value={provider.yearsExperience ?? ""}
                      onChange={(e) => update({ yearsExperience: e.target.value ? Number(e.target.value) : undefined })}
                      placeholder="e.g. 5"
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <StepHeader
                icon={MapPin}
                title="Where are you?"
                subtitle="Helps match you with classes nearby."
              />
              <LocationFields
                value={{
                  country: data.country ?? "",
                  state: data.state ?? "",
                  city: data.city ?? "",
                  area: data.area ?? "",
                }}
                onChange={(v) => update(v)}
                hint="Country, state, city are required. Area is helpful."
              />
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Pin / Postal code<Req /></Label>
                  <PinCodeInput
                    value={data.pinCode ?? ""}
                    onChange={(v) => update({ pinCode: v })}
                    country={data.country ?? ""}
                  />
                </div>
              </div>
              {!isLearner && (
                <div className="space-y-1.5">
                  <Label>Class address<Req /></Label>
                  <Textarea
                    value={provider.address ?? ""}
                    onChange={(e) => update({ address: e.target.value.slice(0, 240) })}
                    placeholder="Building, street, landmark…"
                    rows={2}
                  />
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <StepHeader
                icon={BookOpen}
                title={isLearner ? "What do you want to learn?" : "What do you teach?"}
                subtitle="Pick at least one. Add custom topics if you don't see them."
              />
              {isLearner ? (
                <>
                  <Label className="text-sm">Interests<Req /></Label>
                  <InterestPicker
                    value={learner.interests ?? []}
                    onChange={(v) => update({ interests: v })}
                    onAddCustom={async (name) => {
                      await addCategory(name, learner.name);
                    }}
                  />
                </>
              ) : (
                <>
                  <Label className="text-sm">Categories<Req /></Label>
                  <InterestPicker
                    value={provider.categories ?? []}
                    onChange={(v) => update({ categories: v })}
                    onAddCustom={async (name) => {
                      await addCategory(name, provider.businessName);
                    }}
                  />
                </>
              )}
            </div>
          )}

          {isLearner && step === 3 && (
            <div className="space-y-4">
              <StepHeader
                icon={Clock}
                title="When are you free?"
                subtitle="Add the days & hours you can attend. We'll match classes that fit. (Optional)"
              />
              <FreeTimeEditor
                value={learner.freeBlocks ?? []}
                onChange={(v) => update({ freeBlocks: v })}
              />
              <p className="text-[11px] text-muted-foreground">
                Skip if you're flexible — you can add timings later from your profile.
              </p>
            </div>
          )}

          {step === (isLearner ? 4 : 3) && (
            <div className="space-y-4">
              <StepHeader
                icon={ShieldCheck}
                title="Verify your phone"
                subtitle="A verified phone unlocks join requests, chat, and listings."
              />
              <div className="space-y-1.5">
                <Label>Phone (with country code)<Req /></Label>
                <Input
                  value={phone}
                  onChange={(e) => update({ phone: e.target.value.slice(0, 20) })}
                  placeholder="+91 9XXXXXXXXX"
                  inputMode="tel"
                />
              </div>
              <VerifyContact
                kind="phone"
                value={phone}
                verifiedValue={verifiedPhone}
                onVerified={() => update({ verifiedPhone: phone })}
              />
              {phoneVerified && (
                <div className="flex items-center gap-2 text-sm text-success bg-success/10 border border-success/30 rounded-lg p-2.5">
                  <Check className="h-4 w-4" /> Phone verified — you're all set!
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-3 flex items-center justify-between gap-2 bg-muted/20">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => (step === 0 ? onClose() : setStep(step - 1))}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            {step === 0 ? "Skip for now" : "Back"}
          </Button>
          <Button onClick={next} className="gap-1" disabled={!stepValid && step !== steps.length - 1}>
            {step === steps.length - 1 ? "Finish" : "Continue"}
            {step < steps.length - 1 && <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
