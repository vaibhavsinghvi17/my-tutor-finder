import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { store, useStore } from "@/lib/store";
import { useAuth } from "@/lib/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { allKnownCities } from "@/lib/locations";
import { Combobox } from "@/components/Combobox";
import { GraduationCap, Briefcase, MapPin, User, Sparkles, X, LogIn, LogOut } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function TopBar() {
  const mode = useStore((s) => s.mode);
  const city = useStore((s) => s.city);
  const learner = useStore((s) => s.learner);
  const provider = useStore((s) => s.provider);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isProvider = mode === "provider";

  function switchMode() {
    const next = isProvider ? "learner" : "provider";
    store.setMode(next);
    navigate(next === "provider" ? "/provider" : "/dashboard");
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate("/auth");
  }

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b">
      <div className="container flex items-center gap-3 h-16">
        <Link to={isProvider ? "/provider" : "/dashboard"} className="flex items-center gap-2 font-bold text-lg">
          <span className="h-8 w-8 rounded-lg bg-gradient-primary grid place-items-center text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </span>
          <span>LearnLocal</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 ml-4">
          {isProvider ? (
            <>
              <NavBtn to="/provider" active={location.pathname === "/provider"}>Dashboard</NavBtn>
              <NavBtn to="/provider/listing/new" active={location.pathname.startsWith("/provider/listing")}>
                New Class
              </NavBtn>
              <NavBtn to="/profile/provider" active={location.pathname === "/profile/provider"}>Profile</NavBtn>
            </>
          ) : (
            <>
              <NavBtn to="/dashboard" active={location.pathname === "/dashboard"}>Dashboard</NavBtn>
              <NavBtn to="/discover" active={location.pathname === "/discover"}>Discover</NavBtn>
              <NavBtn to="/requests" active={location.pathname === "/requests"}>My Requests</NavBtn>
              <NavBtn to="/profile" active={location.pathname.startsWith("/profile") && location.pathname !== "/profile/provider"}>Profile</NavBtn>
            </>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 text-sm w-[200px]">
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

          <Button variant="outline" size="sm" onClick={switchMode} className="gap-1.5">
            {isProvider ? <GraduationCap className="h-4 w-4" /> : <Briefcase className="h-4 w-4" />}
            <span className="text-xs font-medium">Switch to {isProvider ? "Learner" : "Provider"}</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => navigate(isProvider ? "/profile/provider" : "/profile")}
            title={isProvider ? provider.businessName || "Provider" : learner.name || "Learner"}
          >
            <User className="h-5 w-5" />
          </Button>

          {user ? (
            <Button variant="ghost" size="icon" className="rounded-full" onClick={handleSignOut} title="Sign out">
              <LogOut className="h-5 w-5" />
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => navigate("/auth")} className="gap-1.5">
              <LogIn className="h-4 w-4" /> <span className="hidden sm:inline">Sign in</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

function NavBtn({ to, active, children }: { to: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className={cn(
        "px-3 py-1.5 text-sm rounded-md transition-colors",
        active ? "bg-muted text-foreground font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
      )}
    >
      {children}
    </Link>
  );
}
