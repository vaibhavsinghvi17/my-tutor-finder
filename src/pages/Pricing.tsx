import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { TopBar } from "@/components/TopBar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, ArrowLeft } from "lucide-react";
import { useSubscription } from "@/lib/useSubscription";
import { useAuth } from "@/lib/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { openRazorpay } from "@/lib/razorpay";
import { toast } from "sonner";

const STARTER = [
  "1 active class",
  "Receive learner requests",
  "Limited learner contact (name + city only)",
  "Standard listing position in Discover",
  "Boost add-on: ₹500 for 3 days",
];

const GROWTH = [
  "Unlimited active classes",
  "Full learner contact details (phone, email, address)",
  "Verified tutor badge",
  "Priority listing in Discover",
  "Insights dashboard (views, clicks, audience)",
  "Pending message inbox",
  "Boost add-on: ₹500 for 7 days — ranks above Starter boosts",
];

const MONTHLY_PRICE = 359;
const YEARLY_PRICE = 3858;

export default function Pricing() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { tier, isGrowth, downgrade, refresh, loading } = useSubscription();
  const [billing, setBilling] = useState<"monthly" | "yearly">("yearly");
  const [activating, setActivating] = useState(false);

  async function onActivate() {
    if (authLoading) { toast.info("Just a moment…"); return; }
    if (!user) {
      toast.info("Please sign in to activate Growth");
      navigate("/auth", { state: { returnTo: "/pricing" } });
      return;
    }
    setActivating(true);
    try {
      const { data, error } = await supabase.functions.invoke("razorpay-create-subscription", {
        body: { billing },
      });
      if (error || !data?.subscription_id) {
        throw new Error(error?.message || data?.error || "Failed to start checkout");
      }
      await openRazorpay({
        key: data.key_id,
        subscription_id: data.subscription_id,
        name: "Scholarr",
        description: billing === "yearly" ? "Growth — Yearly" : "Growth — Monthly",
        prefill: { email: data.email },
        handler: async (resp) => {
          try {
            const { data: v, error: vErr } = await supabase.functions.invoke("razorpay-verify", { body: resp });
            if (vErr || !v?.ok) throw new Error(vErr?.message || v?.error || "Verification failed");
            toast.success("Growth plan activated!");
            // Webhook will finalise tier; small delay then refresh
            setTimeout(() => refresh(), 2500);
          } catch (e: any) {
            toast.error(e.message || "Verification failed");
          }
        },
        modal: { ondismiss: () => setActivating(false) },
      });
    } catch (e: any) {
      toast.error(e.message || "Could not start checkout");
    } finally {
      setActivating(false);
    }
  }

  const growthPrice = billing === "yearly" ? `₹${Math.round(YEARLY_PRICE / 12)}` : `₹${MONTHLY_PRICE}`;
  const growthSuffix = billing === "yearly" ? "/month, billed yearly" : "/month";

  return (
    <div className="min-h-screen">
      <TopBar />
      <main className="container py-6 space-y-6 max-w-4xl">
        <button onClick={() => navigate(-1)} className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>

        <div className="space-y-2 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold">Tutor plans</h1>
          <p className="text-muted-foreground">Learners are always free. Pay securely with UPI, card, or netbanking via Razorpay.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <PlanCard
            name="Starter"
            price="Free"
            tagline="Get started in minutes"
            features={STARTER}
            cta={tier === "starter" ? "Current plan" : "Switch to Starter"}
            ctaDisabled={tier === "starter" || loading || authLoading}
            onCta={async () => { await downgrade(); toast.success("Switched to Starter"); }}
            highlight={false}
          />
          <PlanCard
            name="Growth"
            price={growthPrice}
            priceSuffix={growthSuffix}
            tagline="For tutors growing their classes"
            features={GROWTH}
            cta={isGrowth ? "Active ✓" : activating ? "Opening…" : authLoading ? "Loading…" : billing === "yearly" ? "Activate Growth – Yearly" : "Activate Growth – Monthly"}
            ctaDisabled={isGrowth || loading || authLoading || activating}
            onCta={onActivate}
            highlight
            note={billing === "yearly" ? `₹${YEARLY_PRICE.toLocaleString("en-IN")} billed once a year · save ~₹${(MONTHLY_PRICE * 12 - YEARLY_PRICE).toLocaleString("en-IN")}` : undefined}
            billingToggle={
              <div className="inline-flex items-center rounded-full border bg-muted/40 p-1 text-xs w-full">
                <button
                  onClick={() => setBilling("monthly")}
                  className={`flex-1 px-3 py-1.5 rounded-full transition ${billing === "monthly" ? "bg-background shadow-sm font-medium" : "text-muted-foreground"}`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBilling("yearly")}
                  className={`flex-1 px-3 py-1.5 rounded-full transition flex items-center justify-center gap-1.5 ${billing === "yearly" ? "bg-background shadow-sm font-medium" : "text-muted-foreground"}`}
                >
                  Yearly
                  <Badge className="bg-primary text-primary-foreground text-[9px] h-4 px-1.5">Save 10%</Badge>
                </button>
              </div>
            }
          />
        </div>

        <Card className="p-5 bg-gradient-hero border-primary/20 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">Boost add-on</h3>
            <Badge variant="outline" className="text-[10px]">₹500</Badge>
          </div>
          <div className="grid sm:grid-cols-2 gap-2 text-sm">
            <div className="rounded-lg border bg-background/60 p-3">
              <div className="font-medium">Class Boost in Starter Plan</div>
              <div className="text-xs text-muted-foreground">₹500 · 3 days</div>
            </div>
            <div className="rounded-lg border-2 border-primary/40 bg-primary/5 p-3">
              <div className="font-medium flex items-center gap-1">Class Boost in Growth Plan <Badge className="text-[9px] h-4 px-1.5">priority</Badge></div>
              <div className="text-xs text-muted-foreground">₹500 · 7 days · ranks above Starter boosts</div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Target by city, age group and gender. Available from the class card on your dashboard.
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
  name, price, priceSuffix, tagline, features, cta, ctaDisabled, onCta, highlight, note, billingToggle,
}: {
  name: string; price: string; priceSuffix?: string; tagline: string;
  features: string[]; cta: string; ctaDisabled?: boolean; onCta: () => void; highlight: boolean;
  note?: string; billingToggle?: React.ReactNode;
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
      {billingToggle}
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold">{price}</span>
        {priceSuffix && <span className="text-sm text-muted-foreground">{priceSuffix}</span>}
      </div>
      {note && <p className="text-xs text-primary">{note}</p>}
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
