import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { store, useStore } from "@/lib/store";
import { GraduationCap, Briefcase, Sparkles, MapPin, Calendar, Users } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-hero">
      <div className="container py-10 sm:py-16">
        <header className="flex items-center gap-2 font-bold text-lg mb-12">
          <span className="h-9 w-9 rounded-lg bg-gradient-primary grid place-items-center text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </span>
          <span>LearnLocal</span>
        </header>

        <main className="max-w-4xl mx-auto text-center space-y-4 mb-12 animate-fade-in">
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
            Tuitions • Activities • Hobbies — all in one place
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
            Discover and offer learning <br className="hidden sm:block" />
            <span className="bg-gradient-primary bg-clip-text text-transparent">in your neighbourhood</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            From maths tutors to dance studios, yoga to coding clubs — bring local teachers and learners together.
            Tell us how you'd like to start.
          </p>
        </main>

        <div className="grid gap-5 md:grid-cols-2 max-w-4xl mx-auto">
          <RoleCard
            title="I'm a Learner"
            description="Find tuitions, classes and activities for yourself or your kids — matched to your area and free time."
            icon={<GraduationCap className="h-6 w-6" />}
            tone="primary"
            features={["Discover by city & interest", "Add free-time slots", "Create kid profiles"]}
            onClick={() => pick("learner")}
            cta="Find classes"
          />
          <RoleCard
            title="I'm a Service Provider"
            description="Tutors, coaches, studios — list your classes and let learners in your area find and request to join."
            icon={<Briefcase className="h-6 w-6" />}
            tone="secondary"
            features={["Publish unlimited classes", "Set your weekly schedule", "Accept join requests"]}
            onClick={() => pick("provider")}
            cta="List my services"
          />
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          You can switch between Learner and Provider anytime from the top bar.
        </p>

        <div className="mt-16 grid gap-6 sm:grid-cols-3 max-w-4xl mx-auto text-center">
          <Stat icon={<MapPin className="h-5 w-5" />} title="Local-first" body="Suggestions ranked by your city and area." />
          <Stat icon={<Calendar className="h-5 w-5" />} title="Schedule-aware" body="Match classes to when you're actually free." />
          <Stat icon={<Users className="h-5 w-5" />} title="For all ages" body="Adults, teens, kids — one account, multiple profiles." />
        </div>
      </div>
    </div>
  );
};

function RoleCard({
  title, description, icon, features, onClick, cta, tone,
}: {
  title: string; description: string; icon: React.ReactNode; features: string[];
  onClick: () => void; cta: string; tone: "primary" | "secondary";
}) {
  return (
    <Card className="p-6 sm:p-8 text-left hover:shadow-float transition-all cursor-pointer group" onClick={onClick}>
      <div className={`h-12 w-12 rounded-xl grid place-items-center text-primary-foreground mb-4
        ${tone === "primary" ? "bg-gradient-primary" : "bg-gradient-cool"}`}>
        {icon}
      </div>
      <h2 className="text-xl font-semibold mb-1.5">{title}</h2>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>
      <ul className="space-y-1.5 text-sm mb-6">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" /> {f}
          </li>
        ))}
      </ul>
      <Button className="w-full group-hover:translate-x-0.5 transition-transform" onClick={onClick}>
        {cta}
      </Button>
    </Card>
  );
}

function Stat({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="p-4">
      <div className="h-10 w-10 mx-auto rounded-lg bg-primary/10 text-primary grid place-items-center mb-2">
        {icon}
      </div>
      <h3 className="font-semibold text-sm">{title}</h3>
      <p className="text-xs text-muted-foreground">{body}</p>
    </div>
  );
}

export default Onboarding;
