import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { store, useStore } from "@/lib/store";
import { allKnownCities } from "@/lib/locations";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Combobox } from "@/components/Combobox";
import { GraduationCap, Briefcase, MapPin, User, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function TopBar() {
  const mode = useStore((s) => s.mode);
  const city = useStore((s) => s.city);
  const learner = useStore((s) => s.learner);
  const provider = useStore((s) => s.provider);
  const location = useLocation();
  const navigate = useNavigate();

  const isProvider = mode === "provider";

  function switchMode() {
    const next = isProvider ? "learner" : "provider";
    store.setMode(next);
    navigate(next === "provider" ? "/provider" : "/discover");
  }

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b">
      <div className="container flex items-center gap-3 h-16">
        <Link to={isProvider ? "/provider" : "/discover"} className="flex items-center gap-2 font-bold text-lg">
          <span className="h-8 w-8 rounded-lg bg-gradient-primary grid place-items-center text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </span>
          <span>LearnLocal</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 ml-4">
          {isProvider ? (
            <>
              <NavBtn to="/provider" active={location.pathname === "/provider"}>Listings</NavBtn>
              <NavBtn to="/provider/listing/new" active={location.pathname.startsWith("/provider/listing")}>
                New Class
              </NavBtn>
              <NavBtn to="/profile/provider" active={location.pathname === "/profile/provider"}>Profile</NavBtn>
            </>
          ) : (
            <>
              <NavBtn to="/discover" active={location.pathname === "/discover"}>Discover</NavBtn>
              <NavBtn to="/requests" active={location.pathname === "/requests"}>My Requests</NavBtn>
              <NavBtn to="/profile/learner" active={location.pathname === "/profile/learner"}>Profile</NavBtn>
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
                options={allKnownCities()}
                placeholder="Any city"
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
            <span className="hidden sm:inline">Switch to {isProvider ? "Learner" : "Provider"}</span>
            <span className="sm:hidden">Switch</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-popover">
              <DropdownMenuLabel>
                {isProvider
                  ? provider.businessName || "Provider"
                  : learner.name || "Learner"}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/profile/learner")}>Learner profile</DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/profile/provider")}>Provider profile</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { store.reset(); navigate("/"); }}>
                Reset everything
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
