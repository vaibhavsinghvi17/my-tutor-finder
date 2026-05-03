import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { TopBar } from "@/components/TopBar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScheduleGrid } from "@/components/ScheduleGrid";
import { LocationFields } from "@/components/LocationFields";
import { AGE_GROUPS, AgeGroup, Category, Mode, PriceUnit, SlotKey } from "@/lib/types";
import { useCategories } from "@/lib/useCategories";
import { Plus } from "lucide-react";
import { store, useStore } from "@/lib/store";
import { toast } from "sonner";

const ListingForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const provider = useStore((s) => s.provider);
  const existing = useStore((s) => id ? s.listings.find((l) => l.id === id) : undefined);

  const [title, setTitle] = useState(existing?.title ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [category, setCategory] = useState<Category>(existing?.category ?? "Academics");
  const [ageGroup, setAgeGroup] = useState<AgeGroup>(existing?.ageGroup ?? "All");
  const [mode, setMode] = useState<Mode>(existing?.mode ?? "Offline");
  const [country, setCountry] = useState<string>(existing?.country ?? provider.country ?? "");
  const [stateName, setStateName] = useState<string>(existing?.state ?? provider.state ?? "");
  const [city, setCity] = useState<string>(existing?.city ?? provider.city ?? "");
  const [area, setArea] = useState<string>(existing?.area ?? provider.area ?? "");
  const [venue, setVenue] = useState(existing?.venue ?? "");
  const [priceAmount, setPriceAmount] = useState<string>(existing?.priceAmount?.toString() ?? "");
  const [priceUnit, setPriceUnit] = useState<PriceUnit>(existing?.priceUnit ?? "session");
  const [durationMins, setDurationMins] = useState<string>(existing?.durationMins?.toString() ?? "60");
  const [trial, setTrial] = useState(existing?.trial ?? true);
  const [slots, setSlots] = useState<SlotKey[]>(existing?.slots ?? []);

  useEffect(() => {
    if (id && !existing) {
      toast.error("Class not found");
      navigate("/provider");
    }
  }, [id, existing, navigate]);

  function save() {
    if (!title.trim()) return toast.error("Add a title");
    if (!description.trim()) return toast.error("Add a description");
    if (mode !== "Online") {
      if (!country) return toast.error("Pick a country");
      if (!city) return toast.error("Pick a city");
      if (!area.trim()) return toast.error("Pick a locality");
    } else {
      if (!country) return toast.error("Pick a country");
    }
    if (slots.length === 0) return toast.error("Pick at least one class time");

    const data = {
      title: title.trim(),
      description: description.trim(),
      category,
      ageGroup,
      mode,
      country,
      state: stateName,
      city: city || (mode === "Online" ? "Online" : ""),
      area: area.trim(),
      venue: mode === "Online" ? undefined : venue.trim() || undefined,
      priceAmount: priceAmount ? Number(priceAmount) : undefined,
      priceUnit: priceAmount ? priceUnit : undefined,
      durationMins: durationMins ? Number(durationMins) : undefined,
      trial,
      slots,
    };

    if (id && existing) {
      store.updateListing(id, data);
      toast.success("Class updated");
    } else {
      store.addListing(data);
      toast.success("Class published");
    }
    navigate("/provider");
  }

  return (
    <div className="min-h-screen">
      <TopBar />
      <main className="container py-6 space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold">{id ? "Edit class" : "New class"}</h1>
          <p className="text-sm text-muted-foreground">
            Fill in the details — learners will see this on the discover page.
          </p>
        </div>

        <Card className="p-5 space-y-4">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 100))}
              placeholder="e.g. Beginner Guitar for Adults"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 800))}
              rows={4}
              placeholder="What will learners do? Who is it for?"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Age group</Label>
              <Select value={ageGroup} onValueChange={(v) => setAgeGroup(v as AgeGroup)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {AGE_GROUPS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Mode</Label>
              <Select value={mode} onValueChange={(v) => setMode(v as Mode)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Online">Online</SelectItem>
                  <SelectItem value="Offline">Offline</SelectItem>
                  <SelectItem value="Both">Both online & offline</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Duration</Label>
              <Select value={durationMins} onValueChange={setDurationMins}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[30, 45, 60, 75, 90, 120].map((m) => (
                    <SelectItem key={m} value={String(m)}>
                      {m < 60 ? `${m} min` : m === 60 ? "1 hour" : `${Math.floor(m / 60)}h ${m % 60 ? `${m % 60}m` : ""}`.trim()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Price (optional)</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
                  <Input
                    type="number"
                    min="0"
                    value={priceAmount}
                    onChange={(e) => setPriceAmount(e.target.value)}
                    placeholder="3000"
                    className="pl-7"
                  />
                </div>
                <Select value={priceUnit} onValueChange={(v) => setPriceUnit(v as PriceUnit)}>
                  <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="session">per session</SelectItem>
                    <SelectItem value="month">per month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <LocationFields
            value={{ country, state: stateName, city, area }}
            onChange={(v) => { setCountry(v.country); setStateName(v.state); setCity(v.city); setArea(v.area); }}
            showArea={mode !== "Online"}
            hint={mode === "Online" ? "Online classes only need country & state." : "Pick the locality where the class runs."}
          />

          {mode !== "Online" && (
            <div className="space-y-1.5">
              <Label>Venue address (optional)</Label>
              <Input
                value={venue}
                onChange={(e) => setVenue(e.target.value.slice(0, 160))}
                placeholder="100 Ft Road, near metro"
              />
            </div>
          )}

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label className="text-sm">Free trial available</Label>
              <p className="text-xs text-muted-foreground">Encourages first-time learners to try a session.</p>
            </div>
            <Switch checked={trial} onCheckedChange={setTrial} />
          </div>
        </Card>

        <Card className="p-5 space-y-3">
          <div>
            <h2 className="font-semibold">Class timings</h2>
            <p className="text-sm text-muted-foreground">Tap the weekly slots when this class runs.</p>
          </div>
          <ScheduleGrid value={slots} onChange={setSlots} />
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => navigate("/provider")}>Cancel</Button>
          <Button onClick={save}>{id ? "Save changes" : "Publish class"}</Button>
        </div>
      </main>
    </div>
  );
};

export default ListingForm;
