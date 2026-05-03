import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { store, useStore } from "@/lib/store";
import { GraduationCap, Briefcase, Sparkles, ArrowRight } from "lucide-react";
import { useEffect } from "react";

const Onboarding = () => {
  const navigate = useNavigate();
  const onboarded = useStore((s) => s.onboarded);
  const mode = useStore((s) => s.mode);

  useEffect(() => {
    if (onboarded) navigate(mode === "provider" ? "/provider" : "/discover", { replace: true });
  }, [onboarded, mode, navigate]);

  function pick(m: "learner" | "provider") {
    store.setOnboarded(m);
    navigate(m === "provider" ? "/provider" : "/discover");
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-background flex flex-col">
      {/* subtle corner glows, kept far from headline */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-48 -left-48 w-[360px] h-[360px] rounded-full bg-primary/15 blur-3xl animate-blob" />
        <div className="absolute -bottom-48 -right-48 w-[360px] h-[360px] rounded-full bg-secondary/15 blur-3xl animate-blob [animation-delay:-6s]" />
      </div>

      <div className="relative container py-6 sm:py-8 flex-1 flex flex-col">
        <header className="flex items-center gap-2 font-bold animate-fade-in">
          <span className="h-9 w-9 rounded-xl bg-gradient-primary grid place-items-center text-primary-foreground shadow-elegant animate-float">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="text-lg">LearnLocal</span>
        </header>

        <main className="flex-1 flex flex-col justify-center max-w-3xl mx-auto w-full text-center py-8">
          <span className="inline-flex mx-auto items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4 animate-fade-in">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Tuitions • Activities • Hobbies
          </span>

          <h1 className="text-3xl sm:text-5xl font-bold leading-[1.05] animate-slide-up">
            Local learning,{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">made simple.</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto mt-3 animate-slide-up [animation-delay:80ms] opacity-0 [animation-fill-mode:forwards]">
            Discover tutors and activities near you, or list your own classes.
          </p>

          <div className="grid gap-3 sm:grid-cols-2 mt-7 animate-slide-up [animation-delay:160ms] opacity-0 [animation-fill-mode:forwards]">
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
      className="group relative text-left p-5 rounded-2xl bg-card border border-border/60 backdrop-blur-sm
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
