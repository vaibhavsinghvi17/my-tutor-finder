import { useState } from "react";
import { TopBar } from "@/components/TopBar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Category, ContactInfo, SocialLinks } from "@/lib/types";
import { LocationFields } from "@/components/LocationFields";
import { AddressFields } from "@/components/AddressFields";
import { SocialLinksRow } from "@/components/SocialLinksRow";
import { ContactActions } from "@/components/ContactActions";
import { useCategories } from "@/lib/useCategories";
import { store, useStore } from "@/lib/store";
import { Instagram, Facebook, Youtube, Twitter, Linkedin, Globe, MessageCircle, Phone, MapPin, Plus, X, Languages } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PinCodeInput } from "@/components/PinCodeInput";
import { LanguagesEditor } from "@/components/LanguagesEditor";

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
  const { names: categoryNames, addCategory } = useCategories();
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
      toast.success(`"${created.name}" added to global categories`);
    }
  }

  return (
    <div className="min-h-screen">
      <TopBar />
      <main className="container py-6 space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold">Provider profile</h1>
          <p className="text-sm text-muted-foreground">Tell learners who you are and what you offer.</p>
        </div>

        <Card className="p-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Business / studio name</Label>
              <Input
                value={provider.businessName}
                onChange={(e) => store.updateProvider({ businessName: e.target.value.slice(0, 80) })}
                placeholder="e.g. Rhythm Studio"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Contact (email or phone)</Label>
              <Input
                value={provider.contact}
                onChange={(e) => store.updateProvider({ contact: e.target.value.slice(0, 80) })}
                placeholder="hello@example.com"
              />
            </div>
          </div>

          <LocationFields
            value={{ country: provider.country, state: provider.state, city: provider.city, area: provider.area }}
            onChange={(v) => store.updateProvider(v)}
            hint="Where is your studio? For online-only, just pick country & state."
          />

          <div className="grid sm:grid-cols-[1fr_180px] gap-3">
            <div className="space-y-1.5">
              <Label>Studio / venue address</Label>
              <AddressFields
                value={provider.address}
                onChange={(v) => store.updateProvider({ address: v })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Pin / Postal code</Label>
              <PinCodeInput
                value={provider.pinCode ?? ""}
                onChange={(v) => store.updateProvider({ pinCode: v })}
                country={provider.country}
              />
            </div>
          </div>

          <LanguagesEditor
            value={provider.languages ?? []}
            onChange={(v) => store.updateProvider({ languages: v })}
          />

          <div className="grid sm:grid-cols-[1fr_auto] gap-4 items-end">
            <div className="space-y-1.5">
              <Label>About</Label>
              <Textarea
                value={provider.bio}
                onChange={(e) => store.updateProvider({ bio: e.target.value.slice(0, 600) })}
                rows={4}
                placeholder="Briefly describe your experience, teaching style, what makes you unique..."
              />
            </div>
            <div className="space-y-1.5 sm:w-36">
              <Label>Years of experience</Label>
              <Input
                type="number"
                min={0}
                max={80}
                value={provider.yearsExperience ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  store.updateProvider({ yearsExperience: v === "" ? undefined : Math.max(0, Math.min(80, Number(v))) });
                }}
                placeholder="e.g. 5"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>What you teach</Label>

            {provider.categories.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {provider.categories.map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-primary text-primary-foreground"
                  >
                    {c}
                    <button
                      type="button"
                      onClick={() => toggleCat(c)}
                      className="hover:opacity-70"
                      aria-label={`Remove ${c}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <Select
              value=""
              onValueChange={(v) => { if (v && !provider.categories.includes(v)) toggleCat(v); }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select categories to add..." />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {Array.from(new Set([...categoryNames, ...provider.categories]))
                  .filter((c) => !provider.categories.includes(c))
                  .sort()
                  .map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2 pt-1">
              <Input
                placeholder="Don't see your category? Add a new one"
                value={newCat}
                onChange={(e) => setNewCat(e.target.value.slice(0, 40))}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddCategory(); } }}
                className="h-9"
              />
              <Button type="button" size="sm" onClick={handleAddCategory} className="gap-1">
                <Plus className="h-3.5 w-3.5" /> Add
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              New categories are added to the app's global list and become available to all users.
            </p>
          </div>
        </Card>

        {/* Contact actions */}
        <Card className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h2 className="font-semibold">Contact actions</h2>
              <p className="text-sm text-muted-foreground">Learners can call, WhatsApp, or get directions in one tap.</p>
            </div>
            <ContactActions contact={contactInfo} fallbackAddress={provider.address} size="sm" />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> Phone (for Call button)</Label>
              <Input
                value={contactInfo.phone ?? ""}
                onChange={(e) => setContact({ phone: e.target.value.slice(0, 20) })}
                placeholder="+91 9XXXXXXXXX"
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5"><MessageCircle className="h-3.5 w-3.5 text-[#25D366]" /> WhatsApp number</Label>
              <Input
                value={contactInfo.whatsapp ?? ""}
                onChange={(e) => setContact({ whatsapp: e.target.value.slice(0, 20) })}
                placeholder="Same as phone if blank"
                className="h-9"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Google Maps link or address</Label>
              <Input
                value={contactInfo.mapsUrl ?? ""}
                onChange={(e) => setContact({ mapsUrl: e.target.value.slice(0, 500) })}
                placeholder="Paste a Google Maps link, or leave blank to use studio address"
                className="h-9"
              />
            </div>
          </div>
        </Card>

        <Card className="p-5 space-y-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h2 className="font-semibold">Social links</h2>
              <p className="text-sm text-muted-foreground">Linked icons appear on your class pages — tapping opens the app.</p>
            </div>
            <SocialLinksRow socials={provider.socials} size="sm" />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {SOCIAL_FIELDS.map(({ key, icon: Icon, label, placeholder }) => (
              <div key={key} className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5" /> {label}
                </Label>
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
              </div>
            ))}
          </div>
        </Card>

        <div className="flex justify-end">
          <Button onClick={() => toast.success("Profile saved!")}>Save profile</Button>
        </div>
      </main>
    </div>
  );
};

export default ProviderProfilePage;
