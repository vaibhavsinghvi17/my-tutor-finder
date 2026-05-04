import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { TopBar } from "@/components/TopBar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FreeTimeEditor } from "@/components/FreeTimeEditor";
import { DatePicker } from "@/components/DatePicker";
import { Category, FreeTimeBlock } from "@/lib/types";
import { InterestPicker } from "@/components/InterestPicker";
import { store, useStore } from "@/lib/store";
import { ageFromDob } from "@/lib/timeUtils";
import { ArrowLeft, Trash2, Clock } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const AdultProfileEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id || id === "new";
  const existing = useStore((s) => (isNew ? undefined : s.learner.adults.find((a) => a.id === id)));

  const [name, setName] = useState(existing?.name ?? "");
  const [email, setEmail] = useState(existing?.email ?? "");
  const [dob, setDob] = useState(existing?.dob ?? "");
  const [occupation, setOccupation] = useState(existing?.occupation ?? "");
  const [interests, setInterests] = useState<Category[]>(existing?.interests ?? []);
  const [freeBlocks, setFreeBlocks] = useState<FreeTimeBlock[]>(existing?.freeBlocks ?? []);

  const age = ageFromDob(dob);

  function toggle(c: Category) {
    setInterests((i) => (i.includes(c) ? i.filter((x) => x !== c) : [...i, c]));
  }

  function save() {
    if (!name.trim()) return toast.error("Add a name");
    if (!dob) return toast.error("Add date of birth");
    const data = { name: name.trim(), email: email.trim(), dob, occupation: occupation.trim(), interests, freeBlocks };
    if (isNew) {
      store.addAdult(data);
      toast.success("Adult profile added");
    } else {
      store.updateAdult(id!, data);
      toast.success("Profile updated");
    }
    navigate("/profile");
  }

  function remove() {
    if (!id || isNew) return;
    store.removeAdult(id);
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
          <h1 className="text-lg font-semibold">{isNew ? "Add adult profile" : "Edit profile"}</h1>
          <p className="text-sm text-muted-foreground">For another adult learner like a spouse or parent.</p>
        </div>

        <Card className="p-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value.slice(0, 80))} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value.slice(0, 120))} />
            </div>
            <div className="space-y-1.5">
              <Label>
                Date of birth {age !== null && <span className="text-muted-foreground font-normal">• age {age}</span>}
              </Label>
              <DatePicker value={dob} max={new Date().toISOString().split("T")[0]} onChange={setDob} placeholder="Pick date of birth" />
            </div>
            <div className="space-y-1.5">
              <Label>Occupation <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input value={occupation} onChange={(e) => setOccupation(e.target.value.slice(0, 80))} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Interests</Label>
            <InterestPicker value={interests} onChange={(v) => setInterests(v as Category[])} />
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
          <Button onClick={save}>{isNew ? "Add profile" : "Save"}</Button>
        </div>
      </main>
    </div>
  );
};

export default AdultProfileEditor;
