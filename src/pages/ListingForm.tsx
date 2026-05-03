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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScheduleGrid } from "@/components/ScheduleGrid";
import { DatePicker } from "@/components/DatePicker";
import { LocationFields } from "@/components/LocationFields";
import { PinCodeInput } from "@/components/PinCodeInput";
import { LanguagesEditor } from "@/components/LanguagesEditor";
import { Combobox } from "@/components/Combobox";
import { AGE_GROUPS, AgeGroup, Category, Mode, PriceUnit, SeatInfo, SlotKey } from "@/lib/types";
import { useCategories } from "@/lib/useCategories";
import { useAuth } from "@/lib/useAuth";
import { Plus, Globe2, Users, Wifi, MapPin, Locate } from "lucide-react";
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
  const [locationPin, setLocationPin] = useState<string>(existing?.locationPin ?? "");
  const [continuous, setContinuous] = useState<boolean>(existing?.continuous ?? !existing?.endDate);
  const [startDate, setStartDate] = useState<string>(existing?.startDate ?? "");
  const [endDate, setEndDate] = useState<string>(existing?.endDate ?? "");

  // Bracket span = full hours of duration (1-5). For 30/45/75/90, round to nearest hour, min 1.
  const slotHours = Math.max(1, Math.min(5, Math.round((Number(durationMins) || 60) / 60)));

  function fillCurrentLocation() {
    if (!navigator.geolocation) return toast.error("Geolocation not supported");
    toast.info("Getting your current location…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
        setLocationPin(url);
        toast.success("Location pin saved");
      },
      (err) => toast.error(err.message || "Could not get location"),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  useEffect(() => {
    if (id && !existing) {
      toast.error("Class not found");
      navigate("/provider");
    }
  }, [id, existing, navigate]);

  function save(asDraft = false) {
    if (!title.trim()) return toast.error("Add a title");
    if (!asDraft) {
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
    }

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
      locationPin: mode !== "Online" ? (locationPin.trim() || undefined) : undefined,
      startDate: startDate || undefined,
      endDate: continuous ? undefined : (endDate || undefined),
      continuous,
      draft: asDraft || undefined,
    };

    if (id && existing) {
      store.updateListing(id, data);
      toast.success(asDraft ? "Draft saved" : (existing.draft ? "Class published" : "Class updated"));
    } else {
      store.addListing(data);
      toast.success(asDraft ? "Saved to drafts" : "Class published");
    }
    navigate("/provider");
  }

  return (
    <div className="min-h-screen">
      <TopBar />
      <main className="container py-6 space-y-6 max-w-3xl">
        <div>
          <h1 className="text-lg font-semibold">{id ? "Edit class" : "New class"}</h1>
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
              <Combobox
                value={category}
                onChange={async (v) => {
                  const known = (categoryNames as string[]).some((n) => n.toLowerCase() === v.toLowerCase());
                  if (known) {
                    setCategory(v as Category);
                  } else {
                    const c = await addCategory(v, provider.businessName);
                    if (c) { setCategory(c.name); toast.success(`Added "${c.name}"`); }
                    else setCategory(v as Category);
                  }
                }}
                options={Array.from(new Set([...(categoryNames as string[]), category].filter(Boolean))).sort()}
                placeholder="Search or pick a category"
                emptyText="No matching category"
              />
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
              {mode === "Both" && (
                <p className="text-xs text-muted-foreground">
                  This class will appear in both <span className="font-medium text-foreground">Online</span> and <span className="font-medium text-foreground">Offline</span> searches. Set separate weekly batches and prices for each below.
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Duration</Label>
              <Select value={durationMins} onValueChange={setDurationMins}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[30, 45, 60, 90, 120, 180, 240, 300].map((m) => (
                    <SelectItem key={m} value={String(m)}>
                      {m < 60 ? `${m} min` : m === 60 ? "1 hour" : `${Math.floor(m / 60)} hour${m / 60 > 1 ? "s" : ""}${m % 60 ? ` ${m % 60}m` : ""}`}
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

              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-primary" /> Google location pin (optional)</Label>
                <Input
                  value={locationPin}
                  onChange={(e) => setLocationPin(e.target.value.slice(0, 300))}
                  placeholder="Paste Google Maps link (e.g. https://maps.app.goo.gl/...)"
                />
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={fillCurrentLocation}>
                    <Locate className="h-3.5 w-3.5" /> Use current location
                  </Button>
                  {locationPin && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => setLocationPin("")}>Clear pin</Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Powers the <span className="font-medium text-foreground">Directions</span> button on the class listing.
                </p>
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

          <div className="space-y-2 rounded-lg border p-3">
            <Label className="text-sm">Class duration window</Label>
            <RadioGroup
              value={continuous ? "continuous" : "fixed"}
              onValueChange={(v) => setContinuous(v === "continuous")}
              className="flex flex-col gap-2"
            >
              <label className="flex items-center gap-2 text-sm">
                <RadioGroupItem value="continuous" id="dur-continuous" />
                <span>Continuous — runs until I stop it</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <RadioGroupItem value="fixed" id="dur-fixed" />
                <span>Fixed start &amp; end dates</span>
              </label>
            </RadioGroup>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Start date {continuous ? "(optional)" : ""}</Label>
                <DatePicker value={startDate} onChange={setStartDate} placeholder="Pick start date" />
              </div>
              {!continuous && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">End date</Label>
                  <DatePicker value={endDate} min={startDate || undefined} onChange={setEndDate} placeholder="Pick end date" />
                </div>
              )}
            </div>
          </div>

          <LanguagesEditor value={languages} onChange={setLanguages} />

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label className="text-sm">Free trial available</Label>
              <p className="text-xs text-muted-foreground">Encourages first-time learners to try a session.</p>
            </div>
            <Switch checked={trial} onCheckedChange={setTrial} />
          </div>
        </Card>

        <Card className="p-2 sm:p-3">
          <Accordion type="multiple" defaultValue={["offline-times"]} className="w-full">
            <AccordionItem value="offline-times" className="border-b-0">
              <AccordionTrigger className="px-2 py-3 hover:no-underline">
                <div className="text-left">
                  <div className="font-semibold text-sm">{mode === "Both" ? "Offline batch timings" : "Class timings"}</div>
                  <div className="text-xs text-muted-foreground font-normal">
                    {slots.length} slot{slots.length === 1 ? "" : "s"} selected · {slotHours}h bracket{slotHours > 1 ? "s" : ""}
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-1">
                <ScheduleGrid value={slots} onChange={setSlots} slotHours={slotHours} />
              </AccordionContent>
            </AccordionItem>

            {mode === "Both" && (
              <AccordionItem value="online-times" className="border-b-0">
                <AccordionTrigger className="px-2 py-3 hover:no-underline">
                  <div className="text-left">
                    <div className="font-semibold text-sm flex items-center gap-1.5"><Wifi className="h-4 w-4" /> Online batch timings</div>
                    <div className="text-xs text-muted-foreground font-normal">
                      {onlineSlots.length} slot{onlineSlots.length === 1 ? "" : "s"} selected · {slotHours}h bracket{slotHours > 1 ? "s" : ""}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-1">
                  <ScheduleGrid value={onlineSlots} onChange={setOnlineSlots} slotHours={slotHours} />
                </AccordionContent>
              </AccordionItem>
            )}

            {(slots.length > 0 || (mode === "Both" && onlineSlots.length > 0)) && (
              <AccordionItem value="seats" className="border-b-0">
                <AccordionTrigger className="px-2 py-3 hover:no-underline">
                  <div className="text-left">
                    <div className="font-semibold text-sm flex items-center gap-1.5"><Users className="h-4 w-4" /> Seats per slot</div>
                    <div className="text-xs text-muted-foreground font-normal">Set total &amp; filled seats per batch.</div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-1 space-y-4">
                  <SeatsList
                    title={mode === "Both" ? "Offline batches" : undefined}
                    slots={slots}
                    seats={seatsBySlot}
                    onChange={setSeatsBySlot}
                  />
                  {mode === "Both" && onlineSlots.length > 0 && (
                    <SeatsList
                      title="Online batches"
                      slots={onlineSlots}
                      seats={onlineSeatsBySlot}
                      onChange={setOnlineSeatsBySlot}
                    />
                  )}
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </Card>
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" onClick={() => navigate("/provider")}>Cancel</Button>
          <Button variant="secondary" onClick={() => save(true)}>
            {existing?.draft || !id ? "Save as draft" : "Move to drafts"}
          </Button>
          <Button onClick={() => save(false)}>
            {id ? (existing?.draft ? "Publish class" : "Save changes") : "Publish class"}
          </Button>
        </div>
      </main>
    </div>
  );
};

const SEAT_OPTIONS = [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 40, 50];

interface SeatsListProps {
  title?: string;
  slots: SlotKey[];
  seats: Record<string, SeatInfo>;
  onChange: (next: Record<string, SeatInfo>) => void;
}

function SeatsList({ title, slots, seats, onChange }: SeatsListProps) {
  if (!slots.length) return null;
  return (
    <div className="space-y-2">
      {title && <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{title}</div>}
      {slots.map((s) => {
        const info = seats[s] ?? { total: 1, occupied: 0 };
        const left = Math.max(0, info.total - info.occupied);
        const filledOptions = Array.from({ length: info.total + 1 }, (_, i) => i);
        return (
          <div key={s} className="rounded-lg border p-2.5 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-medium truncate">{s.replace("-", " · ")}:00</div>
              <div className={`text-[11px] font-medium px-2 py-0.5 rounded shrink-0 ${left > 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                {left} left
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Total seats</Label>
                <Select
                  value={String(info.total || 1)}
                  onValueChange={(v) => {
                    const total = Math.max(1, Number(v));
                    onChange({ ...seats, [s]: { total, occupied: Math.min(info.occupied, total) } });
                  }}
                >
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-64">
                    {SEAT_OPTIONS.map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Filled</Label>
                <Select
                  value={String(info.occupied || 0)}
                  onValueChange={(v) => {
                    const occupied = Math.max(0, Math.min(info.total, Number(v)));
                    onChange({ ...seats, [s]: { total: info.total, occupied } });
                  }}
                >
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-64">
                    {filledOptions.map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default ListingForm;
