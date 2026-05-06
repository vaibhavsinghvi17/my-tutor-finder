import { Link, useNavigate } from "react-router-dom";
import { TopBar } from "@/components/TopBar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, ArrowLeft } from "lucide-react";
import { useSubscription } from "@/lib/useSubscription";
import { useAuth } from "@/lib/useAuth";
import { toast } from "sonner";

const STARTER = [
  "Up to 2 active classes",
  "Receive learner requests",
  "Limited learner contact (name + city only)",
  "Standard listing position in Discover",
];

const GROWTH = [
  "Unlimited active classes",
  "Full learner contact details (phone, email, address)",
  "Verified tutor badge",
  "Priority listing in Discover",
  "Pending message inbox",
  "Boost add-on available (₹500 / 7 days)",
];

export default function Pricing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tier, isGrowth, activateGrowth, downgrade, loading } = useSubscription();

  async function onActivate() {
    if (!user) {
      toast.info("Please sign in to activate Growth");
      navigate("/auth");
      return;
    }
    try {
      await activateGrowth();
      toast.success("Growth activated (test mode)");
      navigate("/provider");
    } catch (e: any) {
      toast.error(e.message ?? "Could not activate");
    }
  }

  return (
    <div className="min-h-screen">
      <TopBar />
      <main className="container py-6 space-y-6 max-w-4xl">
        <button onClick={() => navigate(-1)} className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>

        <div className="space-y-2 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold">Tutor plans</h1>
          <p className="text-muted-foreground">Learners are always free. Pick a plan that suits your tutoring.</p>
          <p className="text-[11px] text-muted-foreground italic">Razorpay test mode — payments are bypassed for now.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <PlanCard
            name="Starter"
            price="Free"
            tagline="Get started in minutes"
            features={STARTER}
            cta={tier === "starter" ? "Current plan" : "Switch to Starter"}
            ctaDisabled={tier === "starter" || loading}
            onCta={async () => { await downgrade(); toast.success("Switched to Starter"); }}
            highlight={false}
          />
          <PlanCard
            name="Growth"
            price="₹399"
            priceSuffix="/month"
            tagline="For tutors growing their classes"
            features={GROWTH}
            cta={isGrowth ? "Active ✓" : "Activate Growth"}
            ctaDisabled={isGrowth || loading}
            onCta={onActivate}
            highlight
          />
        </div>

        <Card className="p-5 bg-gradient-hero border-primary/20 space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">Boost add-on</h3>
            <Badge variant="outline" className="text-[10px]">₹500 / 7 days</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Boost any class to the top of Discover for learners in your city, age group and category.
            Available from the class card on your dashboard.
          </p>
          <div>
            <Button asChild size="sm" variant="outline">
              <Link to="/provider">Go to your classes</Link>
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
}

function PlanCard({
  name, price, priceSuffix, tagline, features, cta, ctaDisabled, onCta, highlight,
}: {
  name: string; price: string; priceSuffix?: string; tagline: string;
  features: string[]; cta: string; ctaDisabled?: boolean; onCta: () => void; highlight: boolean;
}) {
  return (
    <Card className={`p-6 space-y-4 ${highlight ? "border-primary border-2 shadow-elegant" : ""}`}>
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold">{name}</h2>
          {highlight && <Badge className="bg-primary text-primary-foreground">Most popular</Badge>}
        </div>
        <p className="text-xs text-muted-foreground">{tagline}</p>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold">{price}</span>
        {priceSuffix && <span className="text-sm text-muted-foreground">{priceSuffix}</span>}
      </div>
      <ul className="space-y-2">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm">
            <Check className="h-4 w-4 mt-0.5 text-primary shrink-0" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Button className="w-full" disabled={ctaDisabled} onClick={onCta} variant={highlight ? "default" : "outline"}>
        {cta}
      </Button>
    </Card>
  );
}
