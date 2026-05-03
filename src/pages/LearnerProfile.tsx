import { useState } from "react";
import { TopBar } from "@/components/TopBar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FreeTimeEditor } from "@/components/FreeTimeEditor";
import { CATEGORIES, Category, FreeTimeBlock, Mode } from "@/lib/types";
import { LocationFields } from "@/components/LocationFields";
import { store, useStore } from "@/lib/store";
import { ageFromDob } from "@/lib/timeUtils";
import { Plus, Trash2, Baby, UserCircle2, Clock, MapPin } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const LearnerProfilePage = () => {
  const learner = useStore((s) => s.learner);
  const age = ageFromDob(learner.dob);

  function toggleInterest(c: Category) {
    const has = learner.interests.includes(c);
    store.updateLearner({
      interests: has ? learner.interests.filter((x) => x !== c) : [...learner.interests, c],
    });
  }

  return (
    <div className="min-h-screen">
      <TopBar />
      <main className="container py-6 space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold">Learner profile</h1>
          <p className="text-sm text-muted-foreground">Tell us about yourself to get better suggestions.</p>
        </div>

        <Card className="p-5 space-y-4">
          <h2 className="font-semibold flex items-center gap-2"><UserCircle2 className="h-4 w-4" /> About you</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Your name</Label>
              <Input
                value={learner.name}
                onChange={(e) => store.updateLearner({ name: e.target.value.slice(0, 80) })}
                placeholder="Anita Sharma"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                value={learner.email}
                onChange={(e) => store.updateLearner({ email: e.target.value.slice(0, 120) })}
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Date of birth {age !== null && <span className="text-muted-foreground font-normal">• age {age}</span>}</Label>
              <Input
                type="date"
                value={learner.dob}
                max={new Date().toISOString().split("T")[0]}
                onChange={(e) => store.updateLearner({ dob: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Occupation <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input
                value={learner.occupation}
                onChange={(e) => store.updateLearner({ occupation: e.target.value.slice(0, 80) })}
                placeholder="Software engineer, student, parent..."
              />
            </div>
            <div className="space-y-1.5">
              <Label>Preferred mode</Label>
              <Select
                value={learner.preferredMode}
                onValueChange={(v) => store.updateLearner({ preferredMode: v as Mode | "Any" })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Any">No preference</SelectItem>
                  <SelectItem value="Online">Online</SelectItem>
                  <SelectItem value="Offline">Offline</SelectItem>
                  <SelectItem value="Both">Either works</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        <Card className="p-5 space-y-4">
          <h2 className="font-semibold flex items-center gap-2"><MapPin className="h-4 w-4" /> Where you are</h2>
          <LocationFields
            value={{ country: learner.country, state: learner.state, city: learner.city, area: learner.area }}
            onChange={(v) => store.updateLearner(v)}
            hint="Pick country → state → city. If yours isn't listed, type to add it."
          />
          <AddressFields
            value={learner.address}
            onChange={(v) => store.updateLearner({ address: v })}
            hint="Helps providers know how far you are."
          />
        </Card>

        <Card className="p-5 space-y-3">
          <div>
            <h2 className="font-semibold">Interests</h2>
            <p className="text-sm text-muted-foreground">Pick what you'd like to learn.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => {
              const active = learner.interests.includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleInterest(c)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm border transition-all",
                    active ? "bg-primary text-primary-foreground border-primary"
                           : "bg-background hover:bg-muted",
                  )}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="p-5 space-y-3">
          <div>
            <h2 className="font-semibold flex items-center gap-2"><Clock className="h-4 w-4" /> Your free time</h2>
            <p className="text-sm text-muted-foreground">
              Add blocks like "Mon–Fri, 6 PM – 8 PM". You can edit or remove anytime.
            </p>
          </div>
          <FreeTimeEditor
            value={learner.freeBlocks}
            onChange={(v: FreeTimeBlock[]) => store.updateLearner({ freeBlocks: v })}
          />
        </Card>

        <KidsSection />

        <div className="flex justify-end">
          <Button onClick={() => toast.success("Profile saved!")}>Save profile</Button>
        </div>
      </main>
    </div>
  );
};

function KidsSection() {
  const kids = useStore((s) => s.learner.kids);
  const [adding, setAdding] = useState(false);

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold flex items-center gap-2"><Baby className="h-4 w-4" /> Kid profiles</h2>
          <p className="text-sm text-muted-foreground">Add your kids to get age-appropriate class suggestions.</p>
        </div>
        {!adding && (
          <Button size="sm" onClick={() => setAdding(true)} className="gap-1">
            <Plus className="h-4 w-4" /> Add kid
          </Button>
        )}
      </div>

      {kids.length === 0 && !adding && (
        <p className="text-sm text-muted-foreground italic">No kid profiles yet.</p>
      )}

      <div className="space-y-3">
        {kids.map((k) => (
          <KidEditor key={k.id} kidId={k.id} />
        ))}
        {adding && <KidEditor onDone={() => setAdding(false)} />}
      </div>
    </Card>
  );
}

function KidEditor({ kidId, onDone }: { kidId?: string; onDone?: () => void }) {
  const existing = useStore((s) => kidId ? s.learner.kids.find((k) => k.id === kidId) : undefined);
  const [name, setName] = useState(existing?.name ?? "");
  const [dob, setDob] = useState(existing?.dob ?? "");
  const [school, setSchool] = useState(existing?.school ?? "");
  const [schoolClass, setSchoolClass] = useState(existing?.schoolClass ?? "");
  const [interests, setInterests] = useState<Category[]>(existing?.interests ?? []);
  const [freeBlocks, setFreeBlocks] = useState<FreeTimeBlock[]>(existing?.freeBlocks ?? []);

  const age = ageFromDob(dob);

  function toggle(c: Category) {
    setInterests((i) => i.includes(c) ? i.filter((x) => x !== c) : [...i, c]);
  }

  function save() {
    if (!name.trim()) return toast.error("Add a name");
    if (!dob) return toast.error("Add date of birth");
    const data = {
      name: name.trim(),
      dob,
      school: school.trim(),
      schoolClass: schoolClass.trim(),
      interests,
      freeBlocks,
    };
    if (kidId) {
      store.updateKid(kidId, data);
      toast.success("Kid profile updated");
    } else {
      store.addKid(data);
      toast.success("Kid profile added");
      onDone?.();
    }
  }

  return (
    <div className="rounded-lg border p-4 space-y-3 bg-muted/30">
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value.slice(0, 60))} />
        </div>
        <div className="space-y-1.5">
          <Label>Date of birth {age !== null && <span className="text-muted-foreground font-normal">• age {age}</span>}</Label>
          <Input
            type="date"
            value={dob}
            max={new Date().toISOString().split("T")[0]}
            onChange={(e) => setDob(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>School</Label>
          <Input
            value={school}
            onChange={(e) => setSchool(e.target.value.slice(0, 100))}
            placeholder="e.g. DPS Bangalore"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Class / grade</Label>
          <Input
            value={schoolClass}
            onChange={(e) => setSchoolClass(e.target.value.slice(0, 30))}
            placeholder="e.g. Class 5"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Interests</Label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => toggle(c)}
              className={cn(
                "px-2.5 py-1 rounded-full text-xs border",
                interests.includes(c) ? "bg-primary text-primary-foreground border-primary" : "bg-background",
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label className="flex items-center gap-2"><Clock className="h-3.5 w-3.5" /> Free time</Label>
        <FreeTimeEditor value={freeBlocks} onChange={setFreeBlocks} />
      </div>
      <div className="flex justify-end gap-2">
        {kidId && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { store.removeKid(kidId); toast.success("Removed"); }}
            className="text-destructive gap-1"
          >
            <Trash2 className="h-4 w-4" /> Remove
          </Button>
        )}
        {onDone && <Button variant="ghost" size="sm" onClick={onDone}>Cancel</Button>}
        <Button size="sm" onClick={save}>{kidId ? "Update" : "Add kid"}</Button>
      </div>
    </div>
  );
}

export default LearnerProfilePage;
