import { useState } from "react";
import { TopBar } from "@/components/TopBar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { FreeTimeEditor } from "@/components/FreeTimeEditor";
import { CATEGORIES, Category, FreeTimeBlock, Mode } from "@/lib/types";
import { LocationFields } from "@/components/LocationFields";
import { AddressFields } from "@/components/AddressFields";
import { store, useStore } from "@/lib/store";
import { ageFromDob, blockSummary } from "@/lib/timeUtils";
import {
  ArrowLeft, UserCircle2, MapPin, Sparkles, Clock,
  Mail, Briefcase, Cake, Globe2, Pencil, Plus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Section = "about" | "address" | "interests" | "time" | null;

const TILES = [
  { v: "about" as const, icon: UserCircle2, label: "About", grad: "from-sky-400 to-blue-600" },
  { v: "address" as const, icon: MapPin, label: "Address", grad: "from-emerald-400 to-teal-600" },
  { v: "interests" as const, icon: Sparkles, label: "Interests", grad: "from-amber-400 to-orange-600" },
  { v: "time" as const, icon: Clock, label: "Time", grad: "from-fuchsia-400 to-pink-600" },
];

const LearnerProfilePage = () => {
  const learner = useStore((s) => s.learner);
  const age = ageFromDob(learner.dob);
  const navigate = useNavigate();
  const [open, setOpen] = useState<Section>(null);

  const fullLocation = [learner.area, learner.city, learner.state, learner.country].filter(Boolean).join(", ");
  const addressLines = (learner.address || "").split(" | ").filter(Boolean);

  return (
    <div className="min-h-screen">
      <TopBar />
      <main className="container py-4 space-y-4 max-w-3xl">
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => navigate("/profile")}
            className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Profiles
          </button>
        </div>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 grid place-items-center text-white text-lg font-semibold shadow-md ring-2 ring-white/40">
            {(learner.name || "Y").trim().split(/\s+/).slice(0, 2).map((s) => s[0]).join("").toUpperCase()}
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold leading-tight truncate">{learner.name || "Your profile"}</h1>
            <p className="text-xs text-muted-foreground truncate">
              {age !== null ? `Age ${age}` : "Add your details"}
              {learner.occupation && ` • ${learner.occupation}`}
            </p>
          </div>
        </div>

        {/* Summary cards */}
        <div className="rounded-xl border border-border/60 bg-card/40 backdrop-blur-sm divide-y divide-border/50 overflow-hidden">
          <SummaryRow
            icon={UserCircle2}
            grad="from-sky-400 to-blue-600"
            title="About"
            empty={!learner.name && !learner.email && !learner.dob && !learner.occupation}
            onEdit={() => setOpen("about")}
          >
            <Chip icon={UserCircle2}>{learner.name || "—"}</Chip>
            {learner.email && <Chip icon={Mail}>{learner.email}</Chip>}
            {age !== null && <Chip icon={Cake}>Age {age}</Chip>}
            {learner.occupation && <Chip icon={Briefcase}>{learner.occupation}</Chip>}
            <Chip icon={Globe2}>{learner.preferredMode === "Any" ? "Any mode" : learner.preferredMode}</Chip>
          </SummaryRow>

          <SummaryRow
            icon={MapPin}
            grad="from-emerald-400 to-teal-600"
            title="Address"
            empty={!fullLocation && addressLines.length === 0}
            onEdit={() => setOpen("address")}
          >
            {fullLocation && <div className="text-sm">{fullLocation}</div>}
            {addressLines.length > 0 && (
              <div className="text-xs text-muted-foreground">{addressLines.join(", ")}</div>
            )}
          </SummaryRow>

          <SummaryRow
            icon={Sparkles}
            grad="from-amber-400 to-orange-600"
            title="Interests"
            empty={learner.interests.length === 0}
            onEdit={() => setOpen("interests")}
          >
            <div className="flex flex-wrap gap-1.5">
              {learner.interests.map((c) => (
                <span key={c} className="px-2.5 py-0.5 rounded-full text-xs bg-primary/10 text-primary border border-primary/20">
                  {c}
                </span>
              ))}
            </div>
          </SummaryRow>

          <SummaryRow
            icon={Clock}
            grad="from-fuchsia-400 to-pink-600"
            title="Free time"
            empty={learner.freeBlocks.length === 0}
            onEdit={() => setOpen("time")}
          >
            <div className="space-y-1">
              {learner.freeBlocks.map((b) => (
                <div key={b.id} className="text-xs flex items-center gap-1.5">
                  <Clock className="h-3 w-3 text-primary" />
                  {blockSummary(b)}
                </div>
              ))}
            </div>
          </SummaryRow>
        </div>
      </main>

      {/* Edit dialogs */}
      <Dialog open={open === "about"} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>About you</DialogTitle></DialogHeader>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Name">
              <Input value={learner.name} onChange={(e) => store.updateLearner({ name: e.target.value.slice(0, 80) })} className="h-9" />
            </Field>
            <Field label="Email">
              <Input type="email" value={learner.email} onChange={(e) => store.updateLearner({ email: e.target.value.slice(0, 120) })} className="h-9" />
            </Field>
            <Field label={`Date of birth${age !== null ? ` • age ${age}` : ""}`}>
              <Input type="date" value={learner.dob} max={new Date().toISOString().split("T")[0]} onChange={(e) => store.updateLearner({ dob: e.target.value })} className="h-9" />
            </Field>
            <Field label="Occupation (optional)">
              <Input value={learner.occupation} onChange={(e) => store.updateLearner({ occupation: e.target.value.slice(0, 80) })} className="h-9" />
            </Field>
            <Field label="Preferred mode">
              <Select value={learner.preferredMode} onValueChange={(v) => store.updateLearner({ preferredMode: v as Mode | "Any" })}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Any">No preference</SelectItem>
                  <SelectItem value="Online">Online</SelectItem>
                  <SelectItem value="Offline">Offline</SelectItem>
                  <SelectItem value="Both">Either works</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <DialogFooter>
            <Button onClick={() => { setOpen(null); toast.success("Saved"); }}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={open === "address"} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Address</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            <LocationFields
              value={{ country: learner.country, state: learner.state, city: learner.city, area: learner.area }}
              onChange={(v) => store.updateLearner(v)}
            />
            <div className="pt-2 border-t">
              <AddressFields value={learner.address} onChange={(v) => store.updateLearner({ address: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => { setOpen(null); toast.success("Saved"); }}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={open === "interests"} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Interests</DialogTitle></DialogHeader>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => {
              const active = learner.interests.includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() =>
                    store.updateLearner({
                      interests: active ? learner.interests.filter((x) => x !== c) : [...learner.interests, c],
                    })
                  }
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm border transition-all",
                    active ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted",
                  )}
                >
                  {c}
                </button>
              );
            })}
          </div>
          <DialogFooter>
            <Button onClick={() => { setOpen(null); toast.success("Saved"); }}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={open === "time"} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Free time</DialogTitle></DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto pr-1">
            <FreeTimeEditor
              value={learner.freeBlocks}
              onChange={(v: FreeTimeBlock[]) => store.updateLearner({ freeBlocks: v })}
            />
          </div>
          <DialogFooter>
            <Button onClick={() => { setOpen(null); toast.success("Saved"); }}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

function SummaryRow({
  icon: Icon, grad, title, empty, onEdit, children,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  grad: string;
  title: string;
  empty: boolean;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="p-3 flex items-start gap-3 hover:bg-muted/30 transition-colors">
      <span
        className={cn(
          "h-9 w-9 rounded-lg bg-gradient-to-br grid place-items-center text-white ring-1 ring-white/30 shrink-0",
          grad,
        )}
        style={{ boxShadow: "0 4px 10px -2px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.4)" }}
      >
        <Icon className="h-4 w-4" strokeWidth={2.5} />
      </span>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{title}</div>
        {empty ? (
          <button onClick={onEdit} className="text-sm text-primary flex items-center gap-1 hover:underline">
            <Plus className="h-3.5 w-3.5" /> Add {title.toLowerCase()}
          </button>
        ) : (
          <div className="flex flex-wrap gap-1.5 items-center">{children}</div>
        )}
      </div>
      <button
        onClick={onEdit}
        title={empty ? "Add" : "Edit"}
        className="h-7 w-7 shrink-0 rounded-full grid place-items-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function Chip({ icon: Icon, children }: { icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      {children}
    </span>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

export default LearnerProfilePage;
