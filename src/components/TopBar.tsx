import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { store, useStore } from "@/lib/store";
import { allKnownCities } from "@/lib/locations";
import { Combobox } from "@/components/Combobox";
import {
  GraduationCap, Briefcase, MapPin, Sparkles, X, ArrowLeft,
  LayoutDashboard, UserCircle2, BookOpen, Loader2, Sparkle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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

  function openSwitch() {
    setPrefill(otherHasInfo);
    setSwitchOpen(true);
  }

  async function confirmSwitch() {
    setBusy(true);
    if (targetEmpty) await new Promise((r) => setTimeout(r, 1200));
    store.switchProfile(target, prefill && otherHasInfo);
    setBusy(false);
    setSwitchOpen(false);
    if (targetEmpty) {
      toast.success(
        target === "provider"
          ? "Tutor profile ready! Add a few details to publish."
          : "Learner profile ready!",
      );
    } else if (prefill && otherHasInfo) {
      toast.success("Personal info synced from your other profile");
    }
    navigate(target === "provider" ? "/provider" : "/dashboard");
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
              onClick={switchMode}
              className="text-[10px] leading-none font-medium text-primary hover:underline transition-colors"
            >
              Switch to {isProvider ? "Learner" : "Tutor"} →
            </button>
          </div>
        </div>
      </div>
      <IconTray isProvider={isProvider} pathname={location.pathname} />
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
