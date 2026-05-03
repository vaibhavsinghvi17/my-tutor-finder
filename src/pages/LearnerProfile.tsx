import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { TopBar } from "@/components/TopBar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { FreeTimeEditor } from "@/components/FreeTimeEditor";
import { StarRating } from "@/components/StarRating";
import { CATEGORIES, FreeTimeBlock, Mode } from "@/lib/types";
import { LocationFields } from "@/components/LocationFields";
import { AddressFields } from "@/components/AddressFields";
import { store, useStore, getAllListings } from "@/lib/store";
import { ageFromDob, blockSummary } from "@/lib/timeUtils";
import {
  ArrowLeft, UserCircle2, MapPin, Clock, Pencil, Plus, Camera,
  ChevronDown, Bookmark, Hourglass, Star, GraduationCap,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Section = "about" | "address" | "time" | null;

const LearnerProfilePage = () => {
  const learner = useStore((s) => s.learner);
  const requests = useStore((s) => s.requests);
  const ratings = useStore((s) => s.ratings);
  const age = ageFromDob(learner.dob);
  const navigate = useNavigate();
  const [open, setOpen] = useState<Section>(null);
  const [interestsOpen, setInterestsOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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
          <button
            onClick={() => navigate("/profile")}
            className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Profiles
          </button>
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
            <h1 className="text-lg font-bold leading-tight truncate">{learner.name || "Your profile"}</h1>
            <p className="text-xs text-muted-foreground truncate">
              {age !== null ? `Age ${age}` : "Add your details"}
              {learner.occupation && ` • ${learner.occupation}`}
            </p>
          </div>
        </div>

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

        {/* Compact tabs as dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Pencil className="h-3.5 w-3.5" /> Edit details <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="bg-popover">
            <DropdownMenuItem onClick={() => setOpen("about")}>
              <UserCircle2 className="h-4 w-4 mr-2" /> About
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setOpen("address")}>
              <MapPin className="h-4 w-4 mr-2" /> Address
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setOpen("time")}>
              <Clock className="h-4 w-4 mr-2" /> Free time
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Quick summary lines */}
        <div className="rounded-xl border border-border/60 bg-card/40 backdrop-blur-sm divide-y divide-border/50 overflow-hidden text-sm">
          <div className="p-3 flex items-start gap-2">
            <UserCircle2 className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="truncate">{learner.name || "—"}{learner.email ? ` • ${learner.email}` : ""}</div>
              <div className="text-xs text-muted-foreground truncate">
                {[learner.preferredMode === "Any" ? "Any mode" : learner.preferredMode, learner.occupation].filter(Boolean).join(" • ")}
              </div>
            </div>
          </div>
          <div className="p-3 flex items-start gap-2">
            <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="truncate">{fullLocation || "—"}</div>
              {addressLines.length > 0 && (
                <div className="text-xs text-muted-foreground truncate">{addressLines.join(", ")}</div>
              )}
            </div>
          </div>
          <div className="p-3 flex items-start gap-2">
            <Clock className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0 space-y-0.5">
              {learner.freeBlocks.length === 0 && <div className="text-muted-foreground">—</div>}
              {learner.freeBlocks.map((b) => (
                <div key={b.id} className="text-xs">{blockSummary(b)}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Saved classes */}
        <Section title="Saved classes" icon={Bookmark} count={savedClasses.length}>
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
        <Section title="Ratings you've given" icon={Star} count={myRatings.length}>
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

      <Dialog open={interestsOpen} onOpenChange={setInterestsOpen}>
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
            <Button onClick={() => { setInterestsOpen(false); toast.success("Saved"); }}>Done</Button>
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

function Section({
  title, icon: Icon, count, children,
}: { title: string; icon: React.ElementType; count: number; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/40 backdrop-blur-sm p-3 space-y-2">
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

export default LearnerProfilePage;
