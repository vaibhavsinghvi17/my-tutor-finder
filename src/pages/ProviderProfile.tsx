import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { TopBar } from "@/components/TopBar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Category, ContactInfo, SocialLinks } from "@/lib/types";
import { LocationFields } from "@/components/LocationFields";
import { AddressFields } from "@/components/AddressFields";
import { SocialLinksRow } from "@/components/SocialLinksRow";
import { ContactActions } from "@/components/ContactActions";
import { PinCodeInput } from "@/components/PinCodeInput";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { UseMyLocationButton } from "@/components/UseMyLocationButton";
import { LanguagesEditor } from "@/components/LanguagesEditor";
import { InterestPicker } from "@/components/InterestPicker";
import { VerifyContact } from "@/components/VerifyContact";
import { useCategories } from "@/lib/useCategories";
import { store, useStore } from "@/lib/store";
import {
  ArrowLeft, Camera, ChevronDown, Pencil, Plus, X, MapPin, Phone, MessageCircle,
  Briefcase, BookOpen, Award, Languages as LanguagesIcon, Trash2,
  Instagram, Facebook, Youtube, Twitter, Linkedin, Globe, Share2, LogOut,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";
import { SubscriptionPanel } from "@/components/SubscriptionPanel";
import { useSubscription } from "@/lib/useSubscription";
import { Sparkles } from "lucide-react";

function SignOutFooter() {
  const { user } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;
  async function handleSignOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate("/auth");
  }
  return (
    <div className="pt-6 pb-4 flex justify-center">
      <Button variant="outline" size="sm" onClick={handleSignOut} className="gap-2 text-destructive hover:text-destructive">
        <LogOut className="h-4 w-4" /> Sign out
      </Button>
    </div>
  );
}

type Section = "about" | "address" | "contact" | "socials" | null;

const SOCIAL_FIELDS: { key: keyof SocialLinks; icon: React.ComponentType<{ className?: string }>; label: string; placeholder: string }[] = [
  { key: "instagram", icon: Instagram, label: "Instagram", placeholder: "@yourhandle or full URL" },
  { key: "facebook", icon: Facebook, label: "Facebook", placeholder: "page name or URL" },
  { key: "youtube", icon: Youtube, label: "YouTube", placeholder: "@channel or URL" },
  { key: "twitter", icon: Twitter, label: "X / Twitter", placeholder: "@handle or URL" },
  { key: "linkedin", icon: Linkedin, label: "LinkedIn", placeholder: "username or URL" },
  { key: "whatsapp", icon: MessageCircle, label: "WhatsApp", placeholder: "+91 9XXXXXXXXX" },
  { key: "website", icon: Globe, label: "Website", placeholder: "yoursite.com" },
];

const ProviderProfilePage = () => {
  const provider = useStore((s) => s.provider);
  const listings = useStore((s) => s.listings);
  const { isGrowth } = useSubscription();
  const { names: categoryNames, addCategory } = useCategories();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState<Section>(null);
  const [catsOpen, setCatsOpen] = useState(false);
  const [newCat, setNewCat] = useState("");

  const contactInfo: ContactInfo = provider.contactInfo ?? {};

  function setContact(patch: Partial<ContactInfo>) {
    store.updateProvider({ contactInfo: { ...contactInfo, ...patch } });
  }

  function toggleCat(c: Category) {
    const has = provider.categories.includes(c);
    store.updateProvider({
      categories: has ? provider.categories.filter((x) => x !== c) : [...provider.categories, c],
    });
  }

  async function handleAddCategory() {
    const v = newCat.trim();
    if (!v) return;
    const created = await addCategory(v, provider.businessName);
    if (created) {
      if (!provider.categories.includes(created.name)) {
        store.updateProvider({ categories: [...provider.categories, created.name] });
      }
      setNewCat("");
      toast.success(`"${created.name}" added globally`);
    }
  }

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) { toast.error("Please pick an image under 2 MB"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      store.updateProvider({ avatarDataUrl: reader.result as string });
      toast.success("Profile photo updated");
    };
    reader.readAsDataURL(f);
  }

  const initials = (provider.businessName || "S").trim().split(/\s+/).slice(0, 2).map((s) => s[0]).join("").toUpperCase();
  const locationLine = [provider.area, provider.city].filter(Boolean).join(", ") || "—";

  return (
    <div className="min-h-screen">
      <TopBar />
      <main className="container py-4 space-y-4 max-w-3xl">
        <div className="flex justify-end">
          <LanguageSwitcher compact />
        </div>
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="relative">
            {provider.avatarDataUrl ? (
              <img
                src={provider.avatarDataUrl}
                alt="Class"
                className="h-16 w-16 rounded-full object-cover ring-2 ring-white/40 shadow-md"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-600 grid place-items-center text-white text-lg font-semibold shadow-md ring-2 ring-white/40">
                {initials}
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
            <h1 className="text-lg font-bold leading-tight truncate">
              {provider.businessName || "Your class name"}
            </h1>
            <p className="text-xs text-muted-foreground truncate">
              {provider.yearsExperience ? `${provider.yearsExperience}+ yrs experience` : "Add your details"}
              {locationLine !== "—" && ` • ${locationLine}`}
            </p>
            <Link
              to="/pricing"
              className={cn(
                "inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border",
                isGrowth
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "bg-muted text-muted-foreground border-border"
              )}
            >
              <Sparkles className="h-3 w-3" />
              {isGrowth ? "Growth plan" : "Starter plan"}
            </Link>
          </div>
        </div>


        {(!provider.city || !provider.pinCode) && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs flex items-start gap-2">
            <MapPin className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
            <div className="flex-1">
              <div className="font-medium text-destructive">Complete your Classes Address</div>
              <div className="text-muted-foreground">
                {!provider.city && !provider.pinCode
                  ? "City and Pin code are required so learners nearby can discover your classes."
                  : !provider.city
                    ? "City is required so learners nearby can discover your classes."
                    : "Pin code is required so learners nearby can discover your classes."}
              </div>
              <Button
                size="sm"
                variant="destructive"
                className="mt-2 h-7 px-3 text-xs"
                onClick={() => setOpen("address")}
              >
                Complete now
              </Button>
            </div>
          </div>
        )}

        {/* Quick action tray */}
        <div className="flex items-center gap-2 py-1 w-full">
          <Button asChild variant="secondary" size="sm" className="gap-1.5 rounded-full flex-1 min-w-0">
            <Link to="/provider">
              <BookOpen className="h-4 w-4" />
              <span className="text-xs font-medium truncate">Classes</span>
              <Badge variant="outline" className="ml-0.5 h-5 px-1.5 text-[10px] bg-background/60">
                {listings.length}
              </Badge>
            </Link>
          </Button>
          <Button asChild size="sm" className="gap-1.5 rounded-full flex-1 min-w-0">
            <Link to="/provider/listing/new">
              <Plus className="h-4 w-4" />
              <span className="text-xs font-medium truncate">New class</span>
            </Link>
          </Button>
        </div>

        {/* Categories chip block — mirrors learner Interests */}
        <div className="rounded-xl border border-border/60 bg-card/40 backdrop-blur-sm p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              What you teach
            </div>
            <button
              onClick={() => setCatsOpen(true)}
              className="h-6 w-6 rounded-full grid place-items-center text-muted-foreground hover:text-primary hover:bg-primary/10"
              title="Edit categories"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          </div>
          {provider.categories.length === 0 ? (
            <button onClick={() => setCatsOpen(true)} className="text-sm text-primary flex items-center gap-1 hover:underline">
              <Plus className="h-3.5 w-3.5" /> Add categories
            </button>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {provider.categories.map((c) => (
                <span key={c} className="px-2.5 py-0.5 rounded-full text-xs bg-primary/10 text-primary border border-primary/20">
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Edit dropdown — mirrors learner UI */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Pencil className="h-3.5 w-3.5" /> Edit details <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="bg-popover">
            <DropdownMenuItem onClick={() => setOpen("about")}>
              <Briefcase className="h-4 w-4 mr-2" /> About class
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setOpen("address")}>
              <MapPin className="h-4 w-4 mr-2" /> Address
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setOpen("contact")}>
              <Phone className="h-4 w-4 mr-2" /> Contact
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setOpen("socials")}>
              <Share2 className="h-4 w-4 mr-2" /> Social links
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Summary rows */}
        <div className="rounded-xl border border-border/60 bg-card/40 backdrop-blur-sm divide-y divide-border/50 overflow-hidden text-sm">
          <SummaryRow icon={Award} label="Experience"
            value={provider.yearsExperience ? `${provider.yearsExperience}+ years` : "—"} />
          <SummaryRow icon={MapPin} label="Class location" value={locationLine} />
          <SummaryRow icon={LanguagesIcon} label="Teaching languages"
            value={(provider.languages && provider.languages.length) ? provider.languages.join(", ") : "—"} />
          <div className="p-3 flex items-start gap-2">
            <Phone className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Contact</div>
              <div className="space-y-0.5 mt-0.5 text-xs">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="truncate">{provider.email || "—"}</span>
                  {provider.email && provider.verifiedEmail === provider.email && (
                    <Badge variant="outline" className="border-success text-success h-5 px-1.5 text-[10px]">Verified</Badge>
                  )}
                </div>
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-muted-foreground">WhatsApp:</span>
                  <span className="truncate">{contactInfo.whatsapp || "—"}</span>
                  {contactInfo.whatsapp && provider.verifiedWhatsapp === contactInfo.whatsapp && (
                    <Badge variant="outline" className="border-success text-success h-5 px-1.5 text-[10px]">Verified</Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* My classes section — mirrors learner Section style */}
        <ProviderSection
          title="My classes"
          icon={BookOpen}
          count={listings.length}
          action={
            <Button asChild size="sm" className="h-7 px-2 gap-1">
              <Link to="/provider/listing/new"><Plus className="h-3.5 w-3.5" /> Add</Link>
            </Button>
          }
        >
          {listings.length === 0 ? (
            <Empty text="No classes yet — add your first one." />
          ) : (
            <div className="space-y-2">
              {listings.map((l) => (
                <div key={l.id} className="rounded-lg border bg-card/60 p-3 flex items-center gap-2">
                  <Link to={`/listing/${l.id}`} className="flex-1 min-w-0 hover:text-primary">
                    <div className="text-sm font-medium truncate">{l.title}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {l.category} · {l.mode} · {l.ageGroup}
                    </div>
                  </Link>
                  <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                    <Link to={`/provider/listing/${l.id}`} title="Edit"><Pencil className="h-3.5 w-3.5" /></Link>
                  </Button>
                  <Button
                    variant="ghost" size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => {
                      if (confirm(`Delete "${l.title}"?`)) {
                        store.removeListing(l.id);
                        toast.success("Class deleted");
                      }
                    }}
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ProviderSection>

        {/* Bio preview */}
        {provider.bio && (
          <ProviderSection title="About" icon={Briefcase} count={1}>
            <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">{provider.bio}</p>
          </ProviderSection>
        )}

        {/* Social preview */}
        {provider.socials && Object.values(provider.socials).some(Boolean) && (
          <ProviderSection title="Social links" icon={Share2} count={Object.values(provider.socials).filter(Boolean).length}>
            <SocialLinksRow socials={provider.socials} size="sm" />
          </ProviderSection>
        )}

        <SubscriptionPanel />

        <SignOutFooter />
      </main>

      {/* === Edit dialogs === */}

      {/* About */}
      <Dialog open={open === "about"} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>About your class</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
            <Field label="Business / class name">
              <Input
                value={provider.businessName}
                onChange={(e) => store.updateProvider({ businessName: e.target.value.slice(0, 80) })}
                className="h-9"
                placeholder="e.g. Rhythm Studio"
              />
            </Field>
            <Field label="Years of experience">
              <Input
                type="number" min={0} max={80}
                value={provider.yearsExperience ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  store.updateProvider({ yearsExperience: v === "" ? undefined : Math.max(0, Math.min(80, Number(v))) });
                }}
                className="h-9"
                placeholder="e.g. 5"
              />
            </Field>
            <Field label="About">
              <Textarea
                value={provider.bio}
                onChange={(e) => store.updateProvider({ bio: e.target.value.slice(0, 600) })}
                rows={4}
                placeholder="Briefly describe your experience, teaching style, what makes you unique..."
              />
            </Field>
            <LanguagesEditor
              value={provider.languages ?? []}
              onChange={(v) => store.updateProvider({ languages: v })}
            />
          </div>
          <DialogFooter>
            <Button onClick={() => { setOpen(null); toast.success("Saved"); }}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Address */}
      <Dialog open={open === "address"} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Class address</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
            <p className="text-[11px] text-muted-foreground">
              <span className="text-destructive">*</span> City and Pin code are required so learners nearby can find your classes.
            </p>
            <div className="flex justify-end">
              <UseMyLocationButton
                onResolved={(loc) => {
                  store.updateProvider({
                    country: loc.country || provider.country,
                    state: loc.state || provider.state,
                    city: loc.city || provider.city,
                    area: loc.area || provider.area,
                    pinCode: loc.pinCode || provider.pinCode,
                    address: loc.address || provider.address,
                  });
                  toast.success("Address fields updated");
                }}
              />
            </div>
            <LocationFields
              value={{ country: provider.country, state: provider.state, city: provider.city, area: provider.area }}
              onChange={(v) => store.updateProvider(v)}
              hint="Where is your class? For online-only, just pick country & state."
            />
            <Field label="Pin / Postal code *">
              <PinCodeInput
                value={provider.pinCode ?? ""}
                onChange={(v) => store.updateProvider({ pinCode: v })}
                country={provider.country}
              />
            </Field>
            <div className="pt-2 border-t">
              <AddressFields value={provider.address} onChange={(v) => store.updateProvider({ address: v })} />
            </div>
            <div className="pt-2 border-t space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-xs">Google Maps location</Label>
                <UseMyLocationButton
                  label="Fetch live location"
                  onResolved={(loc) => {
                    if (loc.mapsUrl) {
                      setContact({ mapsUrl: loc.mapsUrl });
                      store.updateProvider({
                        country: loc.country || provider.country,
                        state: loc.state || provider.state,
                        city: loc.city || provider.city,
                        area: loc.area || provider.area,
                        pinCode: loc.pinCode || provider.pinCode,
                      });
                      toast.success("Live location captured");
                    }
                  }}
                />
              </div>
              <Input
                value={contactInfo.mapsUrl ?? ""}
                onChange={(e) => setContact({ mapsUrl: e.target.value.slice(0, 500) })}
                placeholder="Paste a Google Maps link (https://maps.google.com/...)"
                className="h-9"
              />
              {contactInfo.mapsUrl && (
                <a
                  href={contactInfo.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                >
                  <MapPin className="h-3 w-3" /> Preview on Google Maps
                </a>
              )}
              <p className="text-[11px] text-muted-foreground">
                Adds a precise pin so learners can navigate directly to your class.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => { setOpen(null); toast.success("Saved"); }}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contact */}
      <Dialog open={open === "contact"} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Contact actions</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
            <div className="flex justify-end">
              <ContactActions contact={contactInfo} fallbackAddress={provider.address} size="sm" />
            </div>
            <Field
              label="Email"
              right={
                <VerifyContact
                  kind="email"
                  value={provider.email ?? ""}
                  verifiedValue={provider.verifiedEmail}
                  onVerified={() => store.updateProvider({ verifiedEmail: (provider.email ?? "").trim() })}
                />
              }
            >
              <Input
                type="email"
                value={provider.email ?? ""}
                onChange={(e) => store.updateProvider({ email: e.target.value.slice(0, 120) })}
                placeholder="hello@example.com"
                className="h-9"
              />
            </Field>
            <Field label="Phone (for Call button)">
              <Input
                value={contactInfo.phone ?? ""}
                onChange={(e) => setContact({ phone: e.target.value.slice(0, 20) })}
                placeholder="+91 9XXXXXXXXX"
                className="h-9"
              />
            </Field>
            <Field
              label="WhatsApp number"
              right={
                <VerifyContact
                  kind="whatsapp"
                  value={contactInfo.whatsapp ?? ""}
                  verifiedValue={provider.verifiedWhatsapp}
                  onVerified={() => store.updateProvider({ verifiedWhatsapp: (contactInfo.whatsapp ?? "").trim() })}
                />
              }
            >
              <Input
                value={contactInfo.whatsapp ?? ""}
                onChange={(e) => setContact({ whatsapp: e.target.value.slice(0, 20) })}
                placeholder="Same as phone if blank"
                className="h-9"
              />
            </Field>
            <Field label="Google Maps link or address">
              <Input
                value={contactInfo.mapsUrl ?? ""}
                onChange={(e) => setContact({ mapsUrl: e.target.value.slice(0, 500) })}
                placeholder="Paste a Google Maps link, or leave blank to use class address"
                className="h-9"
              />
            </Field>
            <Field label="Other contact (alt)">
              <Input
                value={provider.contact}
                onChange={(e) => store.updateProvider({ contact: e.target.value.slice(0, 80) })}
                placeholder="Backup email or phone"
                className="h-9"
              />
            </Field>
          </div>
          <DialogFooter>
            <Button onClick={() => { setOpen(null); toast.success("Saved"); }}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Socials */}
      <Dialog open={open === "socials"} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Social links</DialogTitle></DialogHeader>
          <div className="grid sm:grid-cols-2 gap-3 max-h-[65vh] overflow-y-auto pr-1">
            {SOCIAL_FIELDS.map(({ key, icon: Icon, label, placeholder }) => (
              <Field key={key} label={<span className="flex items-center gap-1.5"><Icon className="h-3.5 w-3.5" /> {label}</span>}>
                <Input
                  value={provider.socials?.[key] ?? ""}
                  onChange={(e) =>
                    store.updateProvider({
                      socials: { ...(provider.socials ?? {}), [key]: e.target.value.slice(0, 200) },
                    })
                  }
                  placeholder={placeholder}
                  className="h-9"
                />
              </Field>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => { setOpen(null); toast.success("Saved"); }}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Categories — mirrors learner Interests */}
      <Dialog open={catsOpen} onOpenChange={setCatsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>What you teach</DialogTitle></DialogHeader>

          <InterestPicker
            value={provider.categories}
            extra={categoryNames}
            onChange={(next) => store.updateProvider({ categories: next as Category[] })}
            onAddCustom={async (name) => {
              await addCategory(name, provider.businessName);
            }}
          />

          <p className="text-xs text-muted-foreground">
            Pick subcategories under each group (e.g. Sports → Badminton). New entries are added globally.
          </p>

          <DialogFooter>
            <Button onClick={() => { setCatsOpen(false); toast.success("Saved"); }}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

function ProviderSection({
  title, icon: Icon, count, action, children,
}: { title: string; icon: React.ElementType; count: number; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/40 backdrop-blur-sm p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">{title}</h2>
        <span className="text-xs text-muted-foreground">({count})</span>
        {action && <div className="ml-auto">{action}</div>}
      </div>
      {children}
    </div>
  );
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

function Field({
  label, children, right,
}: { label: React.ReactNode; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs">{label}</Label>
        {right}
      </div>
      {children}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-xs text-muted-foreground italic">{text}</p>;
}

export default ProviderProfilePage;
