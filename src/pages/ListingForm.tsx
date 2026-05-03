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
import { PinCodeInput } from "@/components/PinCodeInput";
import { LanguagesEditor } from "@/components/LanguagesEditor";
import { AGE_GROUPS, AgeGroup, Category, Mode, PriceUnit, SeatInfo, SlotKey } from "@/lib/types";
import { useCategories } from "@/lib/useCategories";
import { Plus, Globe2, Users } from "lucide-react";
import { store, useStore } from "@/lib/store";
import { toast } from "sonner";

const ListingForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const provider = useStore((s) => s.provider);
  const existing = useStore((s) => id ? s.listings.find((l) => l.id === id) : undefined);
  const { names: categoryNames, addCategory } = useCategories();
  const [newCat, setNewCat] = useState("");

  const [title, setTitle] = useState(existing?.title ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [category, setCategory] = useState<Category>(existing?.category ?? "Academics");
  const [ageGroup, setAgeGroup] = useState<AgeGroup>(existing?.ageGroup ?? "All");
  const [mode, setMode] = useState<Mode>(existing?.mode ?? "Offline");
  const [country, setCountry] = useState<string>(existing?.country ?? provider.country ?? "");
  const [stateName, setStateName] = useState<string>(existing?.state ?? provider.state ?? "");
  const [city, setCity] = useState<string>(existing?.city ?? provider.city ?? "");
  const [area, setArea] = useState<string>(existing?.area ?? provider.area ?? "");
  const [pinCode, setPinCode] = useState<string>(existing?.pinCode ?? provider.pinCode ?? "");
  const venueParts = (existing?.venue ?? "").split(" | ");
  const [venueLine1, setVenueLine1] = useState(venueParts[0] ?? "");
  const [venueLine2, setVenueLine2] = useState(venueParts[1] ?? "");
  const [venueLine3, setVenueLine3] = useState(venueParts[2] ?? "");
  const venue = [venueLine1, venueLine2, venueLine3].map((s) => s.trim()).filter(Boolean).join(" | ");
  const [priceAmount, setPriceAmount] = useState<string>(existing?.priceAmount?.toString() ?? "");
  const [priceUnit, setPriceUnit] = useState<PriceUnit>(existing?.priceUnit ?? "session");
  const [intlPriceAmount, setIntlPriceAmount] = useState<string>(existing?.intlPriceAmount?.toString() ?? "");
  const [intlPriceCurrency, setIntlPriceCurrency] = useState<string>(existing?.intlPriceCurrency ?? "USD");
  const [onlinePriceAmount, setOnlinePriceAmount] = useState<string>(existing?.onlinePriceAmount?.toString() ?? "");
  const [onlinePriceUnit, setOnlinePriceUnit] = useState<PriceUnit>(existing?.onlinePriceUnit ?? existing?.priceUnit ?? "session");
  const [onlineSessionsPerMonth, setOnlineSessionsPerMonth] = useState<string>(existing?.onlineSessionsPerMonth?.toString() ?? "4");
  const [onlineIntlPriceAmount, setOnlineIntlPriceAmount] = useState<string>(existing?.onlineIntlPriceAmount?.toString() ?? "");
  const [durationMins, setDurationMins] = useState<string>(existing?.durationMins?.toString() ?? "60");
  const [sessionsPerMonth, setSessionsPerMonth] = useState<string>(existing?.sessionsPerMonth?.toString() ?? "4");
  const [trial, setTrial] = useState(existing?.trial ?? true);
  const [slots, setSlots] = useState<SlotKey[]>(existing?.slots ?? []);
  const [onlineSlots, setOnlineSlots] = useState<SlotKey[]>(existing?.onlineSlots ?? []);
  const [seatsBySlot, setSeatsBySlot] = useState<Record<string, SeatInfo>>(existing?.seatsBySlot ?? {});
  const [onlineSeatsBySlot, setOnlineSeatsBySlot] = useState<Record<string, SeatInfo>>(existing?.onlineSeatsBySlot ?? {});
  const [languages, setLanguages] = useState<string[]>(existing?.languages ?? provider.languages ?? []);
  const [teachesInternationally, setTeachesInternationally] = useState<boolean>(existing?.teachesInternationally ?? false);

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
      if (!venue.trim()) return toast.error("Class address is required for offline classes");
    } else {
      if (!country) return toast.error("Pick a country");
    }
    if (slots.length === 0) return toast.error(mode === "Both" ? "Pick at least one offline class time" : "Pick at least one class time");
    if (mode === "Both" && onlineSlots.length === 0) return toast.error("Pick at least one online batch time");

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
      pinCode: pinCode.trim() || undefined,
      venue: mode === "Online" ? undefined : venue.trim() || undefined,
      priceAmount: priceAmount ? Number(priceAmount) : undefined,
      priceUnit: (priceAmount || onlinePriceAmount) ? priceUnit : undefined,
      intlPriceAmount: intlPriceAmount ? Number(intlPriceAmount) : undefined,
      intlPriceCurrency: (intlPriceAmount || onlineIntlPriceAmount) ? intlPriceCurrency : undefined,
      onlinePriceAmount: onlinePriceAmount ? Number(onlinePriceAmount) : undefined,
      onlineIntlPriceAmount: onlineIntlPriceAmount ? Number(onlineIntlPriceAmount) : undefined,
      onlinePriceUnit: (mode === "Both" && onlinePriceAmount) ? onlinePriceUnit : undefined,
      onlineSessionsPerMonth: (mode === "Both" && onlinePriceUnit === "month" && onlineSessionsPerMonth) ? Number(onlineSessionsPerMonth) : undefined,
      durationMins: durationMins ? Number(durationMins) : undefined,
      sessionsPerMonth: priceUnit === "month" && sessionsPerMonth ? Number(sessionsPerMonth) : undefined,
      trial,
      slots,
      onlineSlots: mode === "Both" ? onlineSlots : undefined,
      seatsBySlot: Object.keys(seatsBySlot).length ? seatsBySlot : undefined,
      onlineSeatsBySlot: mode === "Both" && Object.keys(onlineSeatsBySlot).length ? onlineSeatsBySlot : undefined,
      languages: languages.length ? languages : undefined,
      teachesInternationally: mode !== "Offline" ? teachesInternationally : undefined,
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
                <SelectTrigger><SelectValue placeholder="Pick a category" /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {Array.from(new Set([...(categoryNames as string[]), category].filter(Boolean))).sort().map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Input
                  placeholder="Don't see it? Add a new category"
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value.slice(0, 40))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const v = newCat.trim();
                      if (!v) return;
                      addCategory(v, provider.businessName).then((c) => {
                        if (c) { setCategory(c.name); setNewCat(""); toast.success(`Added "${c.name}"`); }
                      });
                    }
                  }}
                  className="h-8 text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1"
                  onClick={async () => {
                    const v = newCat.trim();
                    if (!v) return;
                    const c = await addCategory(v, provider.businessName);
                    if (c) { setCategory(c.name); setNewCat(""); toast.success(`Added "${c.name}"`); }
                  }}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
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
              <Label>{mode === "Both" ? "Offline price (optional)" : mode === "Online" ? "Online price (optional)" : "Price (optional)"}</Label>
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

          {priceUnit === "month" && (
            <div className="space-y-1.5 sm:max-w-xs">
              <Label>Sessions per month{mode === "Both" ? " (offline)" : ""}</Label>
              <Input
                type="number"
                min="1"
                max="60"
                value={sessionsPerMonth}
                onChange={(e) => setSessionsPerMonth(e.target.value)}
                placeholder="4"
              />
              <p className="text-xs text-muted-foreground">Shown to learners as e.g. "4 sessions / month".</p>
            </div>
          )}

          {mode === "Both" && (
            <div className="space-y-3 rounded-lg border p-3 bg-muted/20">
              <div>
                <Label>Online price (optional)</Label>
                <p className="text-xs text-muted-foreground">Set a different price for online batches. Leave blank to use the offline price.</p>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
                  <Input
                    type="number"
                    min="0"
                    value={onlinePriceAmount}
                    onChange={(e) => setOnlinePriceAmount(e.target.value)}
                    placeholder="2000"
                    className="pl-7"
                  />
                </div>
                <Select value={onlinePriceUnit} onValueChange={(v) => setOnlinePriceUnit(v as PriceUnit)}>
                  <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="session">per session</SelectItem>
                    <SelectItem value="month">per month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {onlinePriceUnit === "month" && (
                <div className="space-y-1.5 sm:max-w-xs">
                  <Label className="text-xs">Online sessions per month</Label>
                  <Input
                    type="number"
                    min="1"
                    max="60"
                    value={onlineSessionsPerMonth}
                    onChange={(e) => setOnlineSessionsPerMonth(e.target.value)}
                    placeholder="4"
                  />
                </div>
              )}
            </div>
          )}

          {mode !== "Offline" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-start gap-2">
                  <Globe2 className="h-4 w-4 mt-0.5 text-primary" />
                  <div>
                    <Label className="text-sm">Open to teach internationally</Label>
                    <p className="text-xs text-muted-foreground">Show this online class to learners worldwide.</p>
                  </div>
                </div>
                <Switch checked={teachesInternationally} onCheckedChange={setTeachesInternationally} />
              </div>

              {teachesInternationally && (
                <div className="rounded-lg border p-3 space-y-3 bg-muted/30">
                  <div className="flex items-start gap-2">
                    <Globe2 className="h-4 w-4 mt-0.5 text-primary" />
                    <div className="flex-1">
                      <Label className="text-sm">International price</Label>
                      <p className="text-xs text-muted-foreground">
                        Set the price in your local currency (₹). Learners outside your country will see it auto-converted to their currency in real time.
                      </p>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">{mode === "Both" ? "Offline (₹)" : "Online (₹)"}</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
                        <Input
                          type="number"
                          min="0"
                          value={intlPriceAmount}
                          onChange={(e) => setIntlPriceAmount(e.target.value)}
                          placeholder="3000"
                          className="pl-7"
                        />
                      </div>
                    </div>
                    {mode === "Both" && (
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Online (₹)</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
                          <Input
                            type="number"
                            min="0"
                            value={onlineIntlPriceAmount}
                            onChange={(e) => setOnlineIntlPriceAmount(e.target.value)}
                            placeholder="2000"
                            className="pl-7"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <LocationFields
            value={{ country, state: stateName, city, area }}
            onChange={(v) => { setCountry(v.country); setStateName(v.state); setCity(v.city); setArea(v.area); }}
            showArea={mode !== "Online"}
            hint={mode === "Online" ? "Online classes only need country & state." : "Pick the locality where the class runs."}
          />

          {mode !== "Online" && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Class address <span className="text-destructive">*</span></Label>
                <div className="space-y-2">
                  <Input
                    value={venueLine1}
                    onChange={(e) => setVenueLine1(e.target.value.slice(0, 80))}
                    placeholder="Address line 1 (building, street)"
                    required
                  />
                  <Input
                    value={venueLine2}
                    onChange={(e) => setVenueLine2(e.target.value.slice(0, 80))}
                    placeholder="Address line 2 (landmark, area)"
                  />
                  <Input
                    value={venueLine3}
                    onChange={(e) => setVenueLine3(e.target.value.slice(0, 80))}
                    placeholder="Address line 3 (optional)"
                  />
                </div>
              </div>
              <div className="space-y-1.5 sm:max-w-xs">
                <Label>Pin / Postal code</Label>
                <PinCodeInput value={pinCode} onChange={setPinCode} country={country} />
              </div>
            </div>
          )}

          {mode === "Online" && (
            <div className="space-y-1.5 sm:max-w-xs">
              <Label>Pin / Postal code (optional)</Label>
              <PinCodeInput value={pinCode} onChange={setPinCode} country={country} />
            </div>
          )}



          <LanguagesEditor value={languages} onChange={setLanguages} />

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

        {slots.length > 0 && (
          <Card className="p-5 space-y-3">
            <div>
              <h2 className="font-semibold flex items-center gap-1.5"><Users className="h-4 w-4" /> Seats per slot</h2>
              <p className="text-sm text-muted-foreground">Set total seats and how many are already filled. Learners see seats remaining.</p>
            </div>
            <div className="space-y-2">
              {slots.map((s) => {
                const info = seatsBySlot[s] ?? { total: 0, occupied: 0 };
                const left = Math.max(0, info.total - info.occupied);
                return (
                  <div key={s} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2 rounded-lg border p-2.5">
                    <div className="text-sm font-medium">{s.replace("-", " · ")}:00</div>
                    <div className="flex items-center gap-1.5">
                      <Label className="text-xs text-muted-foreground">Total</Label>
                      <Input
                        type="number" min={0} max={999}
                        value={info.total || ""}
                        onChange={(e) => {
                          const total = Math.max(0, Number(e.target.value || 0));
                          setSeatsBySlot({ ...seatsBySlot, [s]: { total, occupied: Math.min(info.occupied, total) } });
                        }}
                        className="h-8 w-20"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Label className="text-xs text-muted-foreground">Filled</Label>
                      <Input
                        type="number" min={0} max={info.total || 999}
                        value={info.occupied || ""}
                        onChange={(e) => {
                          const occupied = Math.max(0, Math.min(info.total, Number(e.target.value || 0)));
                          setSeatsBySlot({ ...seatsBySlot, [s]: { total: info.total, occupied } });
                        }}
                        className="h-8 w-20"
                      />
                    </div>
                    <div className={`text-xs font-medium px-2 py-1 rounded ${left > 0 ? "bg-success/10 text-success" : info.total > 0 ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>
                      {info.total > 0 ? `${left} left` : "no limit"}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => navigate("/provider")}>Cancel</Button>
          <Button onClick={save}>{id ? "Save changes" : "Publish class"}</Button>
        </div>
      </main>
    </div>
  );
};

export default ListingForm;
