import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { TopBar } from "@/components/TopBar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { FreeTimeEditor } from "@/components/FreeTimeEditor";
import { StarRating } from "@/components/StarRating";
import { CATEGORIES, FreeTimeBlock, Mode } from "@/lib/types";
import { useCategories } from "@/lib/useCategories";
import { LocationFields } from "@/components/LocationFields";
import { AddressFields } from "@/components/AddressFields";
import { DatePicker } from "@/components/DatePicker";
import { store, useStore, getAllListings } from "@/lib/store";
import { ageFromDob, blockSummary } from "@/lib/timeUtils";
import {
  ArrowLeft, UserCircle2, MapPin, Clock, Pencil, Plus, Camera,
  ChevronDown, Bookmark, Hourglass, Star, GraduationCap, Search, Locate, LogOut,
  ShieldCheck, ShieldAlert, Phone, Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { UsernameInput } from "@/components/UsernameInput";
import { InterestPicker } from "@/components/InterestPicker";
import { VerifyContact } from "@/components/VerifyContact";
import { PinCodeInput } from "@/components/PinCodeInput";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";
import { ProfileWizard } from "@/components/ProfileWizard";
import { ProfileCompletion } from "@/components/ProfileCompletion";

function SignOutFooter() {
  const navigate = useNavigate();
  async function handleSignOut() {
    try { await supabase.auth.signOut(); } catch {}
    toast.success("Signed out");
    navigate("/auth");
  }
  return (
    <div className="mt-8 mb-16 pb-8 flex justify-center">
      <Button variant="outline" size="lg" onClick={handleSignOut} className="gap-2 text-destructive hover:text-destructive border-destructive/30">
        <LogOut className="h-4 w-4" /> Sign out
      </Button>
    </div>
  );
}

const LearnerProfilePage = () => {
  const learner = useStore((s) => s.learner);
  const requests = useStore((s) => s.requests);
  const ratings = useStore((s) => s.ratings);
  const { names: categoryNames, addCategory } = useCategories();
  const age = ageFromDob(learner.dob);
  const navigate = useNavigate();
  const { user } = useAuth();
  async function handleSignOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate("/auth");
  }
  const [interestsOpen, setInterestsOpen] = useState(false);
  const [timingsOpen, setTimingsOpen] = useState(false);
  const [customInterest, setCustomInterest] = useState("");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<number | undefined>(undefined);
  const fileRef = useRef<HTMLInputElement>(null);

  const phoneVerified = !!learner.phone && learner.verifiedPhone === learner.phone;
  const completionItems = [
    { label: "Name", done: !!learner.name?.trim(), step: 0 },
    { label: "Date of birth", done: !!learner.dob?.trim(), step: 0 },
    { label: "City", done: !!learner.city?.trim(), step: 1 },
    { label: "Pin code", done: !!learner.pinCode?.trim(), step: 1 },
    { label: "Interests", done: (learner.interests?.length ?? 0) > 0, step: 2 },
    { label: "Phone verified", done: phoneVerified, step: 4 },
  ];
  const profileEmpty = !learner.name?.trim();
  const firstIncomplete = completionItems.find((i) => !i.done);
  const profileIncomplete = !profileEmpty && !!firstIncomplete;
  function openWizardAt(step?: number) {
    setWizardStep(step);
    setWizardOpen(true);
  }

  useEffect(() => {
    if (profileEmpty && !sessionStorage.getItem("learnerWizardSeen")) {
      setWizardOpen(true);
      sessionStorage.setItem("learnerWizardSeen", "1");
    }
  }, [profileEmpty]);


  async function addCustomInterest() {
    const v = customInterest.trim();
    if (!v) return;
    const created = await addCategory(v, learner.name);
    const name = created?.name ?? v;
    if (!learner.interests.includes(name)) {
      store.updateLearner({ interests: [...learner.interests, name] });
    }
    setCustomInterest("");
    if (created) toast.success(`"${name}" added globally`);
  }

  const fullLocation = [learner.area, learner.city, learner.state, learner.country].filter(Boolean).join(", ");
  const addressLines = (learner.address || "").split(" | ").filter(Boolean);

  const allListings = getAllListings();
  const savedIds = learner.savedListings || [];
  const completedIds = learner.completedListings || [];
  const savedClasses = allListings.filter((l) => savedIds.includes(l.id));
  const completedClasses = allListings.filter((l) => completedIds.includes(l.id));
  const myName = learner.name || "Guest";
  const myRequests = requests.filter((r) => r.learnerName === myName);
  const myRatings = ratings.filter((r) => r.byName === myName);

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) { toast.error("Please pick an image under 2 MB"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      store.updateLearner({ avatarDataUrl: reader.result as string });
      toast.success("Profile photo updated");
    };
    reader.readAsDataURL(f);
  }

  return (
    <div className="min-h-screen">
      <TopBar />
      <main className="container py-4 space-y-4 max-w-3xl">
        <div className="flex items-center justify-between gap-2">
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 max-w-[60%]">
                <UserCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="truncate text-xs font-medium">{learner.name || "You"}</span>
                <ChevronDown className="h-3.5 w-3.5 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 bg-popover z-50">
              <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Switch profile
              </DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigate("/profile")}>
                <UserCircle2 className="h-3.5 w-3.5 mr-2" />
                <span className="truncate">{learner.name || "You"}</span>
                <span className="ml-auto text-[10px] text-muted-foreground">Self</span>
              </DropdownMenuItem>
              {learner.adults.map((a) => (
                <DropdownMenuItem key={a.id} onClick={() => navigate(`/profile/adult/${a.id}`)}>
                  <UserCircle2 className="h-3.5 w-3.5 mr-2" />
                  <span className="truncate">{a.name || "Adult"}</span>
                  <span className="ml-auto text-[10px] text-muted-foreground">Adult</span>
                </DropdownMenuItem>
              ))}
              {learner.kids.map((k) => (
                <DropdownMenuItem key={k.id} onClick={() => navigate(`/profile/kid/${k.id}`)}>
                  <UserCircle2 className="h-3.5 w-3.5 mr-2" />
                  <span className="truncate">{k.name || "Kid"}</span>
                  <span className="ml-auto text-[10px] text-muted-foreground">Kid</span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Add family
              </DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigate("/profile/adult/new")}>
                <Plus className="h-3.5 w-3.5 mr-2 text-primary" />
                Add spouse / parent
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/profile/kid/new")}>
                <Plus className="h-3.5 w-3.5 mr-2 text-primary" />
                Add kid
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex items-center gap-2">
            <LanguageSwitcher compact />
            {user && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="gap-1.5 h-8 text-destructive hover:text-destructive"
              >
                <LogOut className="h-3.5 w-3.5" /> Sign out
              </Button>
            )}
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="relative">
            {learner.avatarDataUrl ? (
              <img
                src={learner.avatarDataUrl}
                alt="Profile"
                className="h-16 w-16 rounded-full object-cover ring-2 ring-white/40 shadow-md"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 grid place-items-center text-white text-lg font-semibold shadow-md ring-2 ring-white/40">
                {(learner.name || "Y").trim().split(/\s+/).slice(0, 2).map((s) => s[0]).join("").toUpperCase()}
              </div>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-primary text-primary-foreground grid place-items-center shadow ring-2 ring-background"
              title="Change photo"
            >
              <Camera className="h-3 w-3" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickFile} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h1 className="text-lg font-bold leading-tight truncate">{learner.name || "Your profile"}</h1>
              {(() => {
                const phoneVerified = !!learner.phone && learner.verifiedPhone === learner.phone;
                if (phoneVerified) {
                  return (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-success/10 text-success border border-success/30">
                      <ShieldCheck className="h-3 w-3" /> Verified
                    </span>
                  );
                }
                return (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-destructive/10 text-destructive border border-destructive/30">
                    <ShieldAlert className="h-3 w-3" /> Profile not verified
                  </span>
                );
              })()}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {age !== null ? `Age ${age}` : "Add your details"}
              {learner.occupation && ` • ${learner.occupation}`}
            </p>
            {profileIncomplete && (
              <button
                onClick={() => openWizardAt(firstIncomplete?.step)}
                className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition"
                title={`Complete: ${firstIncomplete?.label}`}
              >
                <Sparkles className="h-3 w-3" /> Profile incomplete · Quick complete
              </button>
            )}
          </div>
        </div>

        {(!learner.city || !learner.pinCode) && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs flex items-start gap-2">
            <ShieldAlert className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
            <div className="flex-1">
              <div className="font-medium text-destructive">Complete your address</div>
              <div className="text-muted-foreground">
                {!learner.city && !learner.pinCode
                  ? "City and Pin code are required to find classes near you."
                  : !learner.city
                    ? "City is required to find classes near you."
                    : "Pin code is required to find classes near you."}
              </div>
            </div>
          </div>
        )}

        {(profileEmpty || profileIncomplete) && (
          <ProfileCompletion items={completionItems} onSetup={() => openWizardAt(firstIncomplete?.step ?? 0)} />
        )}

        <ProfileWizard mode="learner" open={wizardOpen} onClose={() => setWizardOpen(false)} initialStep={wizardStep} />

        {/* Interests directly under name */}
        <div className="rounded-xl border border-border/60 bg-card/40 backdrop-blur-sm p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Interests</div>
            <button
              onClick={() => setInterestsOpen(true)}
              className="h-6 w-6 rounded-full grid place-items-center text-muted-foreground hover:text-primary hover:bg-primary/10"
              title="Edit interests"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          </div>
          {learner.interests.length === 0 ? (
            <button onClick={() => setInterestsOpen(true)} className="text-sm text-primary flex items-center gap-1 hover:underline">
              <Plus className="h-3.5 w-3.5" /> Add interests
            </button>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {learner.interests.map((c) => (
                <span key={c} className="px-2.5 py-0.5 rounded-full text-xs bg-primary/10 text-primary border border-primary/20">
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-2 py-1 w-full">
          <Button asChild size="sm" className="gap-1.5 rounded-full flex-1 min-w-0">
            <Link to="/discover">
              <Search className="h-4 w-4" />
              <span className="text-xs font-medium truncate">Search for classes</span>
            </Link>
          </Button>
        </div>

        {/* Edit details accordion */}
        <Accordion type="single" collapsible className="rounded-xl border border-border/60 bg-card/40 backdrop-blur-sm overflow-hidden">
          <AccordionItem value="about" className="border-b border-border/60">
            <AccordionTrigger className="px-3 py-3 hover:no-underline">
              <span className="flex items-center gap-2 text-sm font-medium">
                <UserCircle2 className="h-4 w-4 text-primary" /> Personal Details
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-3">
              <div className="grid sm:grid-cols-2 gap-3">
                {/* Username field hidden for launch — mechanism preserved for future release. */}
                <Field label="Name">
                  <Input value={learner.name} onChange={(e) => store.updateLearner({ name: e.target.value.slice(0, 80) })} className="h-9" />
                </Field>
                <Field label="Email">
                  <Input type="email" value={learner.email} onChange={(e) => store.updateLearner({ email: e.target.value.slice(0, 120) })} className="h-9" />
                </Field>
                <Field label="Phone (for SMS verification)">
                  <div className="flex gap-2">
                    <Input
                      type="tel"
                      inputMode="tel"
                      value={learner.phone ?? ""}
                      onChange={(e) => store.updateLearner({ phone: e.target.value.slice(0, 20) })}
                      placeholder="+91 98765 43210"
                      className="h-9"
                    />
                    <VerifyContact
                      kind="phone"
                      value={learner.phone ?? ""}
                      verifiedValue={learner.verifiedPhone}
                      onVerified={() => store.updateLearner({ verifiedPhone: learner.phone })}
                    />
                  </div>
                </Field>
                <Field label={`Date of birth${age !== null ? ` • age ${age}` : ""}`}>
                  <DatePicker value={learner.dob} max={new Date().toISOString().split("T")[0]} onChange={(v) => store.updateLearner({ dob: v })} placeholder="Pick date of birth" triggerClassName="h-9" />
                </Field>
                <Field label="Occupation (optional)">
                  <Input value={learner.occupation} onChange={(e) => store.updateLearner({ occupation: e.target.value.slice(0, 80) })} className="h-9" />
                </Field>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="address" className="border-b border-border/60">
            <AccordionTrigger className="px-3 py-3 hover:no-underline">
              <span className="flex items-center gap-2 text-sm font-medium">
                <MapPin className="h-4 w-4 text-primary" /> Address
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-3">
              <div className="space-y-3">
                <p className="text-[11px] text-muted-foreground">
                  <span className="text-destructive">*</span> City and Pin code are required so we can show classes near you.
                </p>
                <LocationFields
                  value={{ country: learner.country, state: learner.state, city: learner.city, area: learner.area }}
                  onChange={(v) => store.updateLearner(v)}
                />
                <Field label="Pin / Postal code *">
                  <PinCodeInput
                    value={learner.pinCode ?? ""}
                    onChange={(v) => store.updateLearner({ pinCode: v })}
                    country={learner.country}
                  />
                </Field>
                <div className="pt-2 border-t">
                  <AddressFields value={learner.address} onChange={(v) => store.updateLearner({ address: v })} />
                </div>
                <div className="pt-2 border-t space-y-1.5">
                  <Label className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-primary" /> Home location pin (optional)</Label>
                  <Input
                    value={learner.homePin ?? ""}
                    onChange={(e) => store.updateLearner({ homePin: e.target.value.slice(0, 300) })}
                    placeholder="Paste Google Maps link or lat,lng"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button" variant="outline" size="sm" className="gap-1.5"
                      onClick={() => {
                        if (!navigator.geolocation) return toast.error("Geolocation not supported");
                        toast.info("Getting your current location…");
                        navigator.geolocation.getCurrentPosition(
                          (pos) => {
                            const { latitude, longitude } = pos.coords;
                            store.updateLearner({ homePin: `https://www.google.com/maps?q=${latitude},${longitude}` });
                            toast.success("Home pin saved");
                          },
                          (err) => toast.error(err.message || "Could not get location"),
                          { enableHighAccuracy: true, timeout: 10000 },
                        );
                      }}
                    >
                      <Locate className="h-3.5 w-3.5" /> Use current location
                    </Button>
                    {learner.homePin && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => store.updateLearner({ homePin: "" })}>Clear pin</Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">Used to show how far classes are from your home.</p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

        </Accordion>

        {/* Quick summary lines */}
        <div className="rounded-xl border border-border/60 bg-card/40 backdrop-blur-sm divide-y divide-border/50 overflow-hidden text-sm">
          <div className="p-3 flex items-center gap-2">
            <UserCircle2 className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Preferred Mode</div>
              <div className="text-sm">{learner.preferredMode === "Any" ? "Online / Offline" : learner.preferredMode}</div>
            </div>
            <Select value={learner.preferredMode} onValueChange={(v) => store.updateLearner({ preferredMode: v as Mode | "Any" })}>
              <SelectTrigger className="h-8 w-auto gap-1 px-2 text-xs" aria-label="Edit preferred mode">
                <Pencil className="h-3.5 w-3.5" />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="Any">No preference</SelectItem>
                <SelectItem value="Online">Online</SelectItem>
                <SelectItem value="Offline">Offline</SelectItem>
                <SelectItem value="Both">Either works</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="p-3 flex items-start gap-2">
            <Clock className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Preferred Timings</div>
              {learner.freeBlocks.length === 0 ? (
                <div className="text-muted-foreground">—</div>
              ) : (
                <div className="space-y-0.5 mt-0.5">
                  {learner.freeBlocks.map((b) => (
                    <div key={b.id} className="text-xs">{blockSummary(b)}</div>
                  ))}
                </div>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1 px-2 text-xs"
              onClick={() => setTimingsOpen(true)}
              aria-label="Edit preferred timings"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Saved classes */}
        <Section id="saved" title="Saved classes" icon={Bookmark} count={savedClasses.length}>
          {savedClasses.length === 0 ? (
            <Empty text="Tap the bookmark on any class to save it." />
          ) : (
            <div className="space-y-2">
              {savedClasses.map((l) => (
                <MiniListing key={l.id} id={l.id} title={l.title} subtitle={`${l.providerName} • ${l.category}`} />
              ))}
            </div>
          )}
        </Section>

        {/* Trial requests */}
        <Section title="Demo / trial requests" icon={Hourglass} count={myRequests.length}>
          {myRequests.length === 0 ? (
            <Empty text="You haven't requested a demo yet." />
          ) : (
            <div className="space-y-2">
              {myRequests.map((r) => {
                const l = allListings.find((x) => x.id === r.listingId);
                return (
                  <div key={r.id} className="rounded-lg border bg-card/60 p-3 flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <Link to={`/listing/${r.listingId}`} className="text-sm font-medium truncate block hover:text-primary">
                        {l?.title || "Class"}
                      </Link>
                      <div className="text-xs text-muted-foreground truncate">
                        {l?.providerName} • slot {r.slot}
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        r.status === "Approved" && "border-success text-success",
                        r.status === "Declined" && "border-destructive text-destructive",
                      )}
                    >
                      {r.status}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </Section>

        {/* Your ratings */}
        <Section id="ratings" title="Ratings you've given" icon={Star} count={myRatings.length}>
          {myRatings.length === 0 ? (
            <Empty text="No reviews yet." />
          ) : (
            <div className="space-y-2">
              {myRatings.map((r) => {
                const l = allListings.find((x) => x.id === r.listingId);
                return (
                  <div key={r.id} className="rounded-lg border bg-card/60 p-3 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <Link to={`/listing/${r.listingId}`} className="text-sm font-medium truncate hover:text-primary">
                        {l?.title || "Class"}
                      </Link>
                      <StarRating value={r.stars} size="sm" />
                    </div>
                    {r.comment && <p className="text-xs text-muted-foreground line-clamp-2">{r.comment}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </Section>

        {/* Completed classes */}
        <Section title="Completed classes" icon={GraduationCap} count={completedClasses.length}>
          {completedClasses.length === 0 ? (
            <Empty text="Mark a class complete from its page to see it here." />
          ) : (
            <div className="space-y-2">
              {completedClasses.map((l) => (
                <MiniListing key={l.id} id={l.id} title={l.title} subtitle={`${l.providerName} • ${l.category}`} />
              ))}
            </div>
          )}
        </Section>

        <SignOutFooter />
      </main>

      {/* Interests dialog (kept for the pencil icon shortcut) */}
      <Dialog open={interestsOpen} onOpenChange={setInterestsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Interests</DialogTitle></DialogHeader>
          <InterestPicker
            value={learner.interests}
            onChange={(next) => store.updateLearner({ interests: next })}
            extra={Array.from(new Set([...categoryNames, ...CATEGORIES, ...learner.interests]))}
            onAddCustom={async (name) => {
              const created = await addCategory(name, learner.name);
              if (created) toast.success(`"${created.name}" added`);
            }}
          />
          <DialogFooter>
            <Button onClick={() => { setInterestsOpen(false); toast.success("Saved"); }}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={timingsOpen} onOpenChange={setTimingsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Preferred Timings</DialogTitle></DialogHeader>
          <FreeTimeEditor
            value={learner.freeBlocks}
            onChange={(v: FreeTimeBlock[]) => store.updateLearner({ freeBlocks: v })}
          />
          <DialogFooter>
            <Button onClick={() => { setTimingsOpen(false); toast.success("Saved"); }}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

function Section({
  title, icon: Icon, count, children, id,
}: { title: string; icon: React.ElementType; count: number; children: React.ReactNode; id?: string }) {
  return (
    <div id={id} className="rounded-xl border border-border/60 bg-card/40 backdrop-blur-sm p-3 space-y-2 scroll-mt-20">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">{title}</h2>
        <span className="text-xs text-muted-foreground">({count})</span>
      </div>
      {children}
    </div>
  );
}

function MiniListing({ id, title, subtitle }: { id: string; title: string; subtitle: string }) {
  return (
    <Link to={`/listing/${id}`} className="block rounded-lg border bg-card/60 p-3 hover:bg-muted/40 transition-colors">
      <div className="text-sm font-medium truncate">{title}</div>
      <div className="text-xs text-muted-foreground truncate">{subtitle}</div>
    </Link>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-xs text-muted-foreground">{text}</p>;
}

function SummaryRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="p-3 flex items-start gap-2">
      <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="truncate">{value}</div>
      </div>
    </div>
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
