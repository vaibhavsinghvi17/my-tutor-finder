import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { TopBar } from "@/components/TopBar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FreeTimeEditor } from "@/components/FreeTimeEditor";
import { DatePicker } from "@/components/DatePicker";
import { CATEGORIES, Category, FreeTimeBlock } from "@/lib/types";
import { store, useStore } from "@/lib/store";
import { ageFromDob } from "@/lib/timeUtils";
import { ArrowLeft, Trash2, Clock } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const KidProfileEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id || id === "new";
  const existing = useStore((s) => (isNew ? undefined : s.learner.kids.find((k) => k.id === id)));

  const [name, setName] = useState(existing?.name ?? "");
  const [dob, setDob] = useState(existing?.dob ?? "");
  const [school, setSchool] = useState(existing?.school ?? "");
  const [schoolClass, setSchoolClass] = useState(existing?.schoolClass ?? "");
  const [interests, setInterests] = useState<Category[]>(existing?.interests ?? []);
  const [freeBlocks, setFreeBlocks] = useState<FreeTimeBlock[]>(existing?.freeBlocks ?? []);

  const age = ageFromDob(dob);

  function toggle(c: Category) {
    setInterests((i) => (i.includes(c) ? i.filter((x) => x !== c) : [...i, c]));
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
    if (isNew) {
      store.addKid(data);
      toast.success("Kid profile added");
    } else {
      store.updateKid(id!, data);
      toast.success("Profile updated");
    }
    navigate("/profile");
  }

  function remove() {
    if (!id || isNew) return;
    store.removeKid(id);
    toast.success("Removed");
    navigate("/profile");
  }

  return (
    <div className="min-h-screen">
      <TopBar />
      <main className="container py-6 space-y-6 max-w-2xl">
        <button onClick={() => navigate("/profile")} className="text-sm text-muted-foreground flex items-center gap-1 hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to profiles
        </button>

        <div>
          <h1 className="text-2xl font-bold">{isNew ? "Add kid profile" : "Edit kid profile"}</h1>
          <p className="text-sm text-muted-foreground">Helps suggest age-appropriate classes.</p>
        </div>

        <Card className="p-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value.slice(0, 60))} />
            </div>
            <div className="space-y-1.5">
              <Label>
                Date of birth {age !== null && <span className="text-muted-foreground font-normal">• age {age}</span>}
              </Label>
              <DatePicker value={dob} max={new Date().toISOString().split("T")[0]} onChange={setDob} placeholder="Pick date of birth" />
            </div>
            <div className="space-y-1.5">
              <Label>School</Label>
              <Input value={school} onChange={(e) => setSchool(e.target.value.slice(0, 100))} placeholder="e.g. DPS Bangalore" />
            </div>
            <div className="space-y-1.5">
              <Label>Class / grade</Label>
              <Input value={schoolClass} onChange={(e) => setSchoolClass(e.target.value.slice(0, 30))} placeholder="e.g. Class 5" />
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
                    "px-3 py-1.5 rounded-full text-sm border transition-all",
                    interests.includes(c) ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted",
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
        </Card>

        <div className="flex justify-end gap-2">
          {!isNew && (
            <Button variant="ghost" onClick={remove} className="text-destructive gap-1">
              <Trash2 className="h-4 w-4" /> Remove
            </Button>
          )}
          <Button variant="outline" onClick={() => navigate("/profile")}>Cancel</Button>
          <Button onClick={save}>{isNew ? "Add kid" : "Save"}</Button>
        </div>
      </main>
    </div>
  );
};

export default KidProfileEditor;
