import { useState } from "react";
import { TopBar } from "@/components/TopBar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScheduleGrid } from "@/components/ScheduleGrid";
import { CATEGORIES, CITIES, Category, Mode } from "@/lib/types";
import { store, useStore } from "@/lib/store";
import { Plus, Trash2, Baby, UserCircle2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const LearnerProfilePage = () => {
  const learner = useStore((s) => s.learner);

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
            <div className="space-y-1.5">
              <Label>City</Label>
              <Select value={learner.city || ""} onValueChange={(v) => store.updateLearner({ city: v as any })}>
                <SelectTrigger><SelectValue placeholder="Select your city" /></SelectTrigger>
                <SelectContent>
                  {CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Area / neighbourhood</Label>
              <Input
                value={learner.area}
                onChange={(e) => store.updateLearner({ area: e.target.value.slice(0, 80) })}
                placeholder="Indiranagar"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Interests</Label>
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
          </div>
        </Card>

        <Card className="p-5 space-y-3">
          <div>
            <h2 className="font-semibold flex items-center gap-2"><UserCircle2 className="h-4 w-4" /> Your free time</h2>
            <p className="text-sm text-muted-foreground">Tap the slots when you're typically available.</p>
          </div>
          <ScheduleGrid value={learner.freeSlots} onChange={(v) => store.updateLearner({ freeSlots: v })} />
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
  const [age, setAge] = useState(String(existing?.age ?? ""));
  const [interests, setInterests] = useState<Category[]>(existing?.interests ?? []);
  const [freeSlots, setFreeSlots] = useState(existing?.freeSlots ?? []);

  function toggle(c: Category) {
    setInterests((i) => i.includes(c) ? i.filter((x) => x !== c) : [...i, c]);
  }

  function save() {
    const ageNum = parseInt(age, 10);
    if (!name.trim()) return toast.error("Add a name");
    if (!ageNum || ageNum < 1 || ageNum > 18) return toast.error("Age must be 1-18");
    if (kidId) {
      store.updateKid(kidId, { name: name.trim(), age: ageNum, interests, freeSlots });
      toast.success("Kid profile updated");
    } else {
      store.addKid({ name: name.trim(), age: ageNum, interests, freeSlots });
      toast.success("Kid profile added");
      onDone?.();
    }
  }

  return (
    <div className="rounded-lg border p-4 space-y-3 bg-muted/30">
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value.slice(0, 60))} />
        </div>
        <div className="space-y-1.5">
          <Label>Age</Label>
          <Input type="number" min={1} max={18} value={age} onChange={(e) => setAge(e.target.value)} />
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
        <Label>Free time</Label>
        <ScheduleGrid value={freeSlots} onChange={setFreeSlots} compact />
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
