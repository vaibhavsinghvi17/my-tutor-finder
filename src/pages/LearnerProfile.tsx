import { TopBar } from "@/components/TopBar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FreeTimeEditor } from "@/components/FreeTimeEditor";
import { CATEGORIES, Category, FreeTimeBlock, Mode } from "@/lib/types";
import { LocationFields } from "@/components/LocationFields";
import { AddressFields } from "@/components/AddressFields";
import { store, useStore } from "@/lib/store";
import { ageFromDob } from "@/lib/timeUtils";
import { ArrowLeft, UserCircle2, MapPin, Sparkles, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const LearnerProfilePage = () => {
  const learner = useStore((s) => s.learner);
  const age = ageFromDob(learner.dob);
  const navigate = useNavigate();

  function toggleInterest(c: Category) {
    const has = learner.interests.includes(c);
    store.updateLearner({
      interests: has ? learner.interests.filter((x) => x !== c) : [...learner.interests, c],
    });
  }

  return (
    <div className="min-h-screen">
      <TopBar />
      <main className="container py-4 space-y-3 max-w-3xl">
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => navigate("/profile")}
            className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Profiles
          </button>
          <Button size="sm" onClick={() => toast.success("Profile saved!")}>Save</Button>
        </div>

        <div>
          <h1 className="text-xl font-bold leading-tight">Your profile</h1>
          <p className="text-xs text-muted-foreground">Better info → better suggestions.</p>
        </div>

        <Tabs defaultValue="about" className="space-y-3">
          <TabsList className="grid grid-cols-4 w-full h-9">
            <TabsTrigger value="about" className="text-xs gap-1">
              <UserCircle2 className="h-3.5 w-3.5" /> <span className="hidden sm:inline">About</span>
            </TabsTrigger>
            <TabsTrigger value="address" className="text-xs gap-1">
              <MapPin className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Address</span>
            </TabsTrigger>
            <TabsTrigger value="interests" className="text-xs gap-1">
              <Sparkles className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Interests</span>
            </TabsTrigger>
            <TabsTrigger value="time" className="text-xs gap-1">
              <Clock className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Time</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="mt-0">
            <Card className="p-4 space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Name">
                  <Input
                    value={learner.name}
                    onChange={(e) => store.updateLearner({ name: e.target.value.slice(0, 80) })}
                    placeholder="Anita Sharma"
                    className="h-9"
                  />
                </Field>
                <Field label="Email">
                  <Input
                    type="email"
                    value={learner.email}
                    onChange={(e) => store.updateLearner({ email: e.target.value.slice(0, 120) })}
                    placeholder="you@example.com"
                    className="h-9"
                  />
                </Field>
                <Field label={`Date of birth${age !== null ? ` • age ${age}` : ""}`}>
                  <Input
                    type="date"
                    value={learner.dob}
                    max={new Date().toISOString().split("T")[0]}
                    onChange={(e) => store.updateLearner({ dob: e.target.value })}
                    className="h-9"
                  />
                </Field>
                <Field label="Occupation (optional)">
                  <Input
                    value={learner.occupation}
                    onChange={(e) => store.updateLearner({ occupation: e.target.value.slice(0, 80) })}
                    placeholder="Software engineer..."
                    className="h-9"
                  />
                </Field>
                <Field label="Preferred mode">
                  <Select
                    value={learner.preferredMode}
                    onValueChange={(v) => store.updateLearner({ preferredMode: v as Mode | "Any" })}
                  >
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
            </Card>
          </TabsContent>

          <TabsContent value="address" className="mt-0">
            <Card className="p-4 space-y-3">
              <LocationFields
                value={{ country: learner.country, state: learner.state, city: learner.city, area: learner.area }}
                onChange={(v) => store.updateLearner(v)}
              />
              <div className="pt-1 border-t">
                <AddressFields
                  value={learner.address}
                  onChange={(v) => store.updateLearner({ address: v })}
                />
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="interests" className="mt-0">
            <Card className="p-4 space-y-2">
              <p className="text-xs text-muted-foreground">Tap what you'd like to learn.</p>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((c) => {
                  const active = learner.interests.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleInterest(c)}
                      className={cn(
                        "px-3 py-1 rounded-full text-xs border transition-all",
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
          </TabsContent>

          <TabsContent value="time" className="mt-0">
            <Card className="p-4 space-y-2">
              <p className="text-xs text-muted-foreground">
                Add blocks like "Mon–Fri, 6 PM – 8 PM".
              </p>
              <FreeTimeEditor
                value={learner.freeBlocks}
                onChange={(v: FreeTimeBlock[]) => store.updateLearner({ freeBlocks: v })}
              />
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

export default LearnerProfilePage;
