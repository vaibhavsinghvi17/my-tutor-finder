import { TopBar } from "@/components/TopBar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CATEGORIES, Category, SocialLinks } from "@/lib/types";
import { LocationFields } from "@/components/LocationFields";
import { AddressFields } from "@/components/AddressFields";
import { SocialLinksRow } from "@/components/SocialLinksRow";
import { store, useStore } from "@/lib/store";
import { Instagram, Facebook, Youtube, Twitter, Linkedin, Globe, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

  function toggleCat(c: Category) {
    const has = provider.categories.includes(c);
    store.updateProvider({
      categories: has ? provider.categories.filter((x) => x !== c) : [...provider.categories, c],
    });
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

          <div className="space-y-1.5">
            <Label>Studio / venue address</Label>
            <AddressFields
              value={provider.address}
              onChange={(v) => store.updateProvider({ address: v })}
            />
          </div>

          <div className="space-y-1.5">
            <Label>About</Label>
            <Textarea
              value={provider.bio}
              onChange={(e) => store.updateProvider({ bio: e.target.value.slice(0, 600) })}
              rows={4}
              placeholder="Briefly describe your experience, teaching style, what makes you unique..."
            />
          </div>

          <div className="space-y-2">
            <Label>What you teach</Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => {
                const active = provider.categories.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleCat(c)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm border transition-all",
                      active ? "bg-primary text-primary-foreground border-primary"
                             : "bg-background hover:bg-muted",
                    )}
                  >
                    {c}
                  </button>
                );
              })}
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
