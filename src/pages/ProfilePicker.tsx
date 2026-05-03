import { Link, useNavigate } from "react-router-dom";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { store, useStore } from "@/lib/store";
import { ageFromDob } from "@/lib/timeUtils";
import { Plus, UserCog } from "lucide-react";
import { cn } from "@/lib/utils";

const COLORS = [
  "from-sky-400 to-cyan-500",
  "from-emerald-400 to-teal-500",
  "from-amber-400 to-orange-500",
  "from-fuchsia-400 to-pink-500",
  "from-indigo-400 to-blue-500",
  "from-lime-400 to-green-500",
];

function colorFor(seed: string, idx: number) {
  return COLORS[(seed.charCodeAt(0) + idx) % COLORS.length];
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

interface Circle {
  key: string;
  name: string;
  subtitle: string;
  href: string;
  color: string;
}

const ProfilePicker = () => {
  const learner = useStore((s) => s.learner);
  const provider = useStore((s) => s.provider);
  const navigate = useNavigate();
  const hasBothProfiles = !!learner.name?.trim() && !!provider.businessName?.trim();

  const circles: Circle[] = [
    {
      key: "self",
      name: learner.name || "You",
      subtitle: ageFromDob(learner.dob) !== null ? `Age ${ageFromDob(learner.dob)}` : "Main profile",
      href: "/profile/learner",
      color: colorFor((learner.name || "Y"), 0),
    },
    ...learner.adults.map((a, i) => ({
      key: a.id,
      name: a.name,
      subtitle: ageFromDob(a.dob) !== null ? `Age ${ageFromDob(a.dob)}` : (a.occupation || "Adult"),
      href: `/profile/adult/${a.id}`,
      color: colorFor(a.name || "A", i + 1),
    })),
    ...learner.kids.map((k, i) => ({
      key: k.id,
      name: k.name,
      subtitle: ageFromDob(k.dob) !== null ? `Age ${ageFromDob(k.dob)}` : "Kid",
      href: `/profile/kid/${k.id}`,
      color: colorFor(k.name || "K", i + 10),
    })),
  ];

  return (
    <div className="min-h-screen">
      <TopBar />
      <main className="container py-8 max-w-3xl">
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-2xl font-bold">Who's it for?</h1>
          <p className="text-sm text-muted-foreground mt-1">Pick a profile to view or edit.</p>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-5">
          {circles.map((c, i) => (
            <Link
              key={c.key}
              to={c.href}
              className="group flex flex-col items-center text-center gap-2 animate-scale-in"
              style={{ animationDelay: `${i * 60}ms`, animationFillMode: "backwards" }}
            >
              <div
                className={cn(
                  "h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-gradient-to-br grid place-items-center text-white text-2xl font-semibold shadow-lg ring-2 ring-transparent group-hover:ring-primary group-hover:scale-105 transition-all",
                  c.color,
                )}
              >
                {initials(c.name)}
              </div>
              <div className="min-w-0 w-full">
                <div className="text-sm font-medium truncate">{c.name || "Unnamed"}</div>
                <div className="text-xs text-muted-foreground truncate">{c.subtitle}</div>
              </div>
            </Link>
          ))}

          <button
            type="button"
            onClick={() => navigate("/profile/adult/new")}
            className="group flex flex-col items-center text-center gap-2 animate-scale-in"
            style={{ animationDelay: `${circles.length * 60}ms`, animationFillMode: "backwards" }}
          >
            <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full border-2 border-dashed border-muted-foreground/40 grid place-items-center text-muted-foreground group-hover:border-primary group-hover:text-primary transition-colors">
              <Plus className="h-7 w-7" />
            </div>
            <div className="text-sm font-medium">Add adult</div>
            <div className="text-xs text-muted-foreground -mt-2">Spouse, parent…</div>
          </button>

          <button
            type="button"
            onClick={() => navigate("/profile/kid/new")}
            className="group flex flex-col items-center text-center gap-2 animate-scale-in"
            style={{ animationDelay: `${(circles.length + 1) * 60}ms`, animationFillMode: "backwards" }}
          >
            <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full border-2 border-dashed border-muted-foreground/40 grid place-items-center text-muted-foreground group-hover:border-primary group-hover:text-primary transition-colors">
              <Plus className="h-7 w-7" />
            </div>
            <div className="text-sm font-medium">Add kid</div>
            <div className="text-xs text-muted-foreground -mt-2">Child profile</div>
          </button>
        </div>

        {hasBothProfiles && (
          <div className="mt-10 flex justify-center">
            <Button variant="outline" size="sm" onClick={() => navigate("/profile/provider")} className="gap-2">
              <UserCog className="h-4 w-4" /> Manage provider profile
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default ProfilePicker;
