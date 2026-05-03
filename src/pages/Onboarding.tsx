import { useNavigate } from "react-router-dom";
import { store, useStore } from "@/lib/store";
import { GraduationCap, Briefcase, Sparkles, ArrowRight, AtSign } from "lucide-react";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { isUsernameTaken, slugifyUsername } from "@/lib/usernames";
import { toast } from "sonner";

const Onboarding = () => {
  const navigate = useNavigate();
  const onboarded = useStore((s) => s.onboarded);
  const mode = useStore((s) => s.mode);
  const learner = useStore((s) => s.learner);
  const provider = useStore((s) => s.provider);
  const [showSplash, setShowSplash] = useState(true);
  const [pendingRole, setPendingRole] = useState<"learner" | "provider" | null>(null);
  const [username, setUsername] = useState("");

  useEffect(() => {
    if (onboarded) {
      navigate(mode === "provider" ? "/provider" : "/dashboard", { replace: true });
      return;
    }
    const t = setTimeout(() => setShowSplash(false), 1600);
    return () => clearTimeout(t);
  }, [onboarded, mode, navigate]);

  function pick(m: "learner" | "provider") {
    setPendingRole(m);
    setUsername("");
  }

  function confirmUsername() {
    if (!pendingRole) return;
    const u = slugifyUsername(username);
    if (u.length < 3) { toast.error("Pick a username (3+ characters)"); return; }
    if (isUsernameTaken(store.get(), u)) { toast.error("That username is taken"); return; }
    if (pendingRole === "learner") store.updateLearner({ username: u });
    else store.updateProvider({ username: u });
    store.setOnboarded(pendingRole);
    navigate(pendingRole === "provider" ? "/provider" : "/dashboard");
  }

  if (showSplash) {
    return (
      <div className="min-h-screen grid place-items-center bg-background relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-40 -left-40 w-[420px] h-[420px] rounded-full bg-primary/15 blur-3xl animate-blob" />
          <div className="absolute -bottom-40 -right-40 w-[420px] h-[420px] rounded-full bg-secondary/15 blur-3xl animate-blob [animation-delay:-6s]" />
        </div>
        <div className="flex flex-col items-center gap-4 animate-scale-in">
          <span className="relative h-20 w-20 rounded-2xl bg-gradient-primary grid place-items-center text-primary-foreground shadow-float animate-float">
            <span className="absolute inset-0 rounded-2xl bg-primary/40 blur-xl animate-pulse -z-10" />
            <Sparkles className="h-9 w-9" />
          </span>
          <div className="text-2xl font-bold tracking-tight animate-fade-in [animation-delay:300ms] opacity-0 [animation-fill-mode:forwards]">
            LearnLocal
          </div>
          <div className="flex gap-1.5 animate-fade-in [animation-delay:600ms] opacity-0 [animation-fill-mode:forwards]">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" />
            <span className="h-1.5 w-1.5 rounded-full bg-secondary animate-bounce [animation-delay:120ms]" />
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-bounce [animation-delay:240ms]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-background flex flex-col animate-fade-in">
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-48 -left-48 w-[360px] h-[360px] rounded-full bg-primary/15 blur-3xl animate-blob" />
        <div className="absolute -bottom-48 -right-48 w-[360px] h-[360px] rounded-full bg-secondary/15 blur-3xl animate-blob [animation-delay:-6s]" />
      </div>

      <main className="flex-1 container py-8 flex flex-col items-center justify-center text-center max-w-3xl mx-auto w-full">
        <div className="flex flex-col items-center gap-2 mb-6 animate-scale-in">
          <span className="h-12 w-12 rounded-xl bg-gradient-primary grid place-items-center text-primary-foreground shadow-elegant animate-float">
            <Sparkles className="h-5 w-5" />
          </span>
          <span className="font-bold text-lg">LearnLocal</span>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4 animate-fade-in">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          Tuitions • Activities • Hobbies
        </span>

        <h1 className="text-3xl sm:text-5xl font-bold leading-[1.1] animate-slide-up">
          Local learning,{" "}
          <span className="text-primary">made simple.</span>
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground max-w-lg mt-3 animate-slide-up [animation-delay:80ms] opacity-0 [animation-fill-mode:forwards]">
          Discover tutors and activities near you, or list your own classes.
        </p>

        <div className="grid gap-3 sm:grid-cols-2 mt-7 w-full animate-slide-up [animation-delay:160ms] opacity-0 [animation-fill-mode:forwards]">
          <RoleCard
            title="I'm a Learner"
            subtitle="Find classes for me or my kids"
            icon={<GraduationCap className="h-5 w-5" />}
            tone="primary"
            onClick={() => pick("learner")}
          />
          <RoleCard
            title="I'm a Provider"
            subtitle="List my classes & studio"
            icon={<Briefcase className="h-5 w-5" />}
            tone="cool"
            onClick={() => pick("provider")}
          />
        </div>

        <p className="text-xs text-muted-foreground mt-5 animate-fade-in [animation-delay:300ms] opacity-0 [animation-fill-mode:forwards]">
          Switch between Learner and Provider anytime.
        </p>
      </main>
    </div>
  );
};

function RoleCard({
  title, subtitle, icon, onClick, tone,
}: {
  title: string; subtitle: string; icon: React.ReactNode;
  onClick: () => void; tone: "primary" | "cool";
}) {
  return (
    <button
      onClick={onClick}
      className="group relative text-left p-5 rounded-2xl bg-card border border-border/60
                 transition-all duration-300 hover:-translate-y-1 hover:shadow-float hover:border-primary/40
                 focus:outline-none focus:ring-2 focus:ring-primary/40"
    >
      <div className={`h-11 w-11 rounded-xl grid place-items-center text-primary-foreground mb-3
        transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3
        ${tone === "primary" ? "bg-gradient-primary" : "bg-gradient-cool"}`}>
        {icon}
      </div>
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="font-semibold">{title}</h2>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground transition-all duration-300 group-hover:text-primary group-hover:translate-x-1" />
      </div>
    </button>
  );
}

export default Onboarding;
