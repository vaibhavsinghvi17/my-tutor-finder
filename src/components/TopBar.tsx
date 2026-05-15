import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ProfileWizard } from "@/components/ProfileWizard";
import { store, useStore } from "@/lib/store";
import { allKnownCities } from "@/lib/locations";
import { Combobox } from "@/components/Combobox";
import {
  GraduationCap, Briefcase, MapPin, Sparkles, X, ArrowLeft,
  LayoutDashboard, UserCircle2, BookOpen, Loader2, Sparkle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const PROMPT_KEY = "scholarr-switch-prompted";
function wasPrompted(role: "learner" | "provider") {
  try {
    const raw = localStorage.getItem(PROMPT_KEY);
    if (!raw) return false;
    return (JSON.parse(raw) as Record<string, boolean>)[role] === true;
  } catch { return false; }
}
function markPrompted(role: "learner" | "provider") {
  try {
    const raw = localStorage.getItem(PROMPT_KEY);
    const obj = raw ? JSON.parse(raw) : {};
    obj[role] = true;
    localStorage.setItem(PROMPT_KEY, JSON.stringify(obj));
  } catch {}
}

export function TopBar() {
  const mode = useStore((s) => s.mode);
  const city = useStore((s) => s.city);
  const learner = useStore((s) => s.learner);
  const provider = useStore((s) => s.provider);
  const location = useLocation();
  const navigate = useNavigate();

  const isProvider = mode === "provider";
  const target: "learner" | "provider" = isProvider ? "learner" : "provider";
  const targetEmpty = target === "provider"
    ? !provider.businessName?.trim()
    : !learner.name?.trim();
  const otherHasInfo = target === "provider"
    ? !!(learner.name || learner.city || learner.phone || learner.email)
    : !!(provider.businessName || provider.city || provider.phone || provider.email);

  const [switchOpen, setSwitchOpen] = useState(false);
  const [prefill, setPrefill] = useState(true);
  const [busy, setBusy] = useState(false);
  const [wizardRole, setWizardRole] = useState<"learner" | "provider" | null>(null);

  function openSwitch() {
    // Only show the create-profile dialog the first time for this role.
    if (targetEmpty && !wasPrompted(target)) {
      setPrefill(otherHasInfo);
      setSwitchOpen(true);
      return;
    }
    // Otherwise switch directly.
    store.switchProfile(target, false);
    navigate(target === "provider" ? "/provider" : "/dashboard");
  }

  async function confirmSwitch() {
    setBusy(true);
    await new Promise((r) => setTimeout(r, 1200));
    store.switchProfile(target, prefill && otherHasInfo);
    markPrompted(target);
    setBusy(false);
    setSwitchOpen(false);
    toast.success(
      target === "provider"
        ? "Tutor profile ready! Just a few more details."
        : "Learner profile ready! Just a few more details.",
    );
    navigate(target === "provider" ? "/provider" : "/dashboard");
    // Force the rest of the setup before continuing.
    setWizardRole(target);
  }


  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b">
      <div className="container flex items-center gap-2 sm:gap-3 h-14">
        <Link to={isProvider ? "/provider" : "/dashboard"} className="flex items-center gap-2 font-bold text-base shrink-0 min-w-0">
          <span className="h-7 w-7 shrink-0 rounded-lg bg-gradient-primary grid place-items-center text-primary-foreground">
            <Sparkles className="h-3.5 w-3.5" />
          </span>
          <span className="hidden xs:inline truncate">Scholarr</span>
        </Link>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 text-sm w-[180px]">
            <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex-1">
              <Combobox
                value={city}
                onChange={(v) => store.setCity(v)}
                options={learner.city ? [learner.city] : allKnownCities()}
                placeholder={learner.city || "Any city"}
              />
            </div>
            {city && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => store.setCity("")} title="Clear">
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          <div className="flex flex-col items-end gap-0.5 shrink-0">
            <span className="text-[10px] leading-none text-muted-foreground flex items-center gap-1">
              {isProvider ? <Briefcase className="h-3 w-3" /> : <GraduationCap className="h-3 w-3" />}
              Logged in as <span className="font-semibold text-foreground">{isProvider ? "Tutor" : "Learner"}</span>
            </span>
            <button
              onClick={openSwitch}
              className="text-[10px] leading-none font-medium text-primary hover:underline transition-colors"
            >
              Switch to {isProvider ? "Learner" : "Tutor"} →
            </button>
          </div>
        </div>
      </div>
      <IconTray isProvider={isProvider} pathname={location.pathname} />

      <Dialog open={switchOpen} onOpenChange={(v) => !busy && setSwitchOpen(v)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {target === "provider" ? <Briefcase className="h-4 w-4 text-primary" /> : <GraduationCap className="h-4 w-4 text-primary" />}
              {targetEmpty
                ? `Create your ${target === "provider" ? "tutor" : "learner"} profile`
                : `Switch to ${target === "provider" ? "Tutor" : "Learner"}`}
            </DialogTitle>
            <DialogDescription>
              {targetEmpty
                ? `You don't have a ${target === "provider" ? "tutor" : "learner"} profile yet — let's make one. It'll be ready in a few seconds.`
                : `Switch to your ${target === "provider" ? "tutor" : "learner"} profile.`}
            </DialogDescription>
          </DialogHeader>

          {otherHasInfo && (
            <label className="flex items-start gap-2 rounded-lg border bg-muted/30 p-3 cursor-pointer">
              <Checkbox checked={prefill} onCheckedChange={(v) => setPrefill(!!v)} className="mt-0.5" />
              <div className="text-xs">
                <div className="font-medium flex items-center gap-1">
                  <Sparkle className="h-3 w-3 text-primary" />
                  Prefill from your {target === "provider" ? "learner" : "tutor"} profile
                </div>
                <div className="text-muted-foreground mt-0.5">
                  We'll copy your name, location, phone & email so you don't re-enter them.
                </div>
              </div>
            </label>
          )}

          <DialogFooter className="gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSwitchOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button size="sm" onClick={confirmSwitch} disabled={busy} className="gap-1.5">
              {busy ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Setting up…</> : (targetEmpty ? "Create profile" : "Switch")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {wizardRole && (
        <ProfileWizard
          mode={wizardRole}
          open={!!wizardRole}
          onClose={() => setWizardRole(null)}
        />
      )}
    </header>
  );
}

function IconTray({ isProvider, pathname }: { isProvider: boolean; pathname: string }) {
  const navigate = useNavigate();
  const noTray = new Set(["/", "/auth", "/onboarding"]);
  if (noTray.has(pathname)) return null;

  const dashHref = isProvider ? "/provider" : "/dashboard";
  const isHome = pathname === dashHref;

  const items = isProvider
    ? [
        { to: "/provider", icon: LayoutDashboard, label: "Dashboard", active: pathname === "/provider" },
        { to: "/profile/provider", icon: UserCircle2, label: "Profile", active: pathname === "/profile/provider" },
        { to: "/provider/listing/new", icon: BookOpen, label: "Classes", active: pathname.startsWith("/provider/listing") },
      ]
    : [
        { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard", active: pathname === "/dashboard" },
        { to: "/profile", icon: UserCircle2, label: "Profile", active: pathname.startsWith("/profile") && pathname !== "/profile/provider" },
      ];

  return (
    <div className="border-t bg-muted/30">
      <div className="container h-11 flex items-center gap-1">
        {!isHome && (
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 px-2 h-8 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted shrink-0"
            title="Back"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </button>
        )}
        <div className="flex items-center gap-1 ml-auto">
          {items.map((it) => (
            <Link
              key={it.to}
              to={it.to}
              className={cn(
                "flex items-center gap-1.5 px-2.5 h-8 rounded-md text-xs font-medium transition-colors",
                it.active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
            >
              <it.icon className="h-3.5 w-3.5" />
              <span>{it.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
