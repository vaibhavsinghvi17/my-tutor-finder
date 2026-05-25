import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const COUNTRY_CODES: { code: string; label: string }[] = [
  { code: "+91", label: "🇮🇳 +91" },
  { code: "+1", label: "🇺🇸 +1" },
  { code: "+44", label: "🇬🇧 +44" },
  { code: "+61", label: "🇦🇺 +61" },
  { code: "+971", label: "🇦🇪 +971" },
  { code: "+65", label: "🇸🇬 +65" },
  { code: "+49", label: "🇩🇪 +49" },
  { code: "+33", label: "🇫🇷 +33" },
  { code: "+81", label: "🇯🇵 +81" },
  { code: "+86", label: "🇨🇳 +86" },
  { code: "+92", label: "🇵🇰 +92" },
  { code: "+880", label: "🇧🇩 +880" },
  { code: "+94", label: "🇱🇰 +94" },
];
import { Sparkles, Mail, Phone } from "lucide-react";
import { toast } from "sonner";
import { store } from "@/lib/store";

const signUpSchema = z.object({
  displayName: z.string().trim().min(1, "Name required").max(80),
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "At least 8 characters").max(128),
});
const signInSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(1, "Password required").max(128),
});
const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+[1-9]\d{6,14}$/, "Use international format like +919876543210");

const AuthPage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [tab, setTab] = useState<"signin" | "signup">(params.get("mode") === "signup" ? "signup" : "signin");
  const [method, setMethod] = useState<"email" | "phone">("email");

  // Email/password state
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Phone OTP state
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneLocal, setPhoneLocal] = useState("");
  const phone = `${countryCode}${phoneLocal.replace(/\D/g, "")}`;
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const [busy, setBusy] = useState(false);

  // If already signed in, bounce away
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/dashboard", { replace: true });
    });
  }, [navigate]);

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (tab === "signup") {
        const parsed = signUpSchema.safeParse({ displayName, email, password });
        if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { display_name: parsed.data.displayName },
          },
        });
        if (error) { toast.error(error.message); return; }
        toast.success("Check your email to verify your account.");
      } else {
        const parsed = signInSchema.safeParse({ email, password });
        if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
        const { error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
        if (error) { toast.error(error.message); return; }
        toast.success("Welcome back!");
        navigate("/dashboard");
      }
    } finally {
      setBusy(false);
    }
  }

  async function sendOtp() {
    const parsed = phoneSchema.safeParse(phone);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: parsed.data,
        options: {
          shouldCreateUser: tab === "signup",
          data: tab === "signup" && displayName.trim()
            ? { display_name: displayName.trim() }
            : undefined,
        },
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      setOtpSent(true);
      toast.success(`OTP sent to ${parsed.data}`);
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtp() {
    const entered = otp.trim();
    if (entered.length < 4) { toast.error("Enter the OTP you received"); return; }
    setBusy(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone,
        token: entered,
        type: "sms",
      });
      if (error) { toast.error(error.message); return; }
      if (displayName.trim()) {
        store.updateLearner({ phone, verifiedPhone: phone, name: displayName.trim() });
      } else {
        store.updateLearner({ phone, verifiedPhone: phone });
      }
      toast.success("Phone verified — signed in!");
      navigate("/dashboard");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/dashboard" });
    if (result.error) { toast.error("Google sign-in failed"); setBusy(false); return; }
    if (result.redirected) return;
    navigate("/dashboard");
  }

  return (
    <div className="min-h-screen grid place-items-center px-4 bg-gradient-to-br from-background to-muted/40">
      <Card className="w-full max-w-md p-6 space-y-5">
        <div className="flex items-center gap-2 justify-center">
          <span className="h-9 w-9 rounded-lg bg-gradient-primary grid place-items-center text-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </span>
          <h1 className="text-xl font-bold">Scholarr</h1>
        </div>

        <div className="grid grid-cols-2 rounded-lg bg-muted p-1 text-sm">
          <button
            type="button"
            onClick={() => { setTab("signin"); setOtpSent(false); setOtp(""); }}
            className={`rounded-md py-1.5 ${tab === "signin" ? "bg-background shadow-sm font-medium" : "text-muted-foreground"}`}
          >Sign in</button>
          <button
            type="button"
            onClick={() => { setTab("signup"); setOtpSent(false); setOtp(""); }}
            className={`rounded-md py-1.5 ${tab === "signup" ? "bg-background shadow-sm font-medium" : "text-muted-foreground"}`}
          >Sign up</button>
        </div>

        {/* Method switcher */}
        <div className="grid grid-cols-2 rounded-lg border p-1 text-xs">
          <button
            type="button"
            onClick={() => { setMethod("email"); setOtpSent(false); }}
            className={`rounded-md py-1.5 inline-flex items-center justify-center gap-1.5 ${method === "email" ? "bg-muted font-medium" : "text-muted-foreground"}`}
          ><Mail className="h-3.5 w-3.5" /> Email</button>
          <button
            type="button"
            onClick={() => setMethod("phone")}
            className={`rounded-md py-1.5 inline-flex items-center justify-center gap-1.5 ${method === "phone" ? "bg-muted font-medium" : "text-muted-foreground"}`}
          ><Phone className="h-3.5 w-3.5" /> Phone OTP</button>
        </div>

        {method === "email" ? (
          <form onSubmit={handleEmailSubmit} className="space-y-3">
            {tab === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" autoComplete="name" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={tab === "signup" ? "8+ characters" : ""} autoComplete={tab === "signup" ? "new-password" : "current-password"} />
            </div>
            <Button type="submit" disabled={busy} className="w-full">
              {tab === "signup" ? "Create account" : "Sign in"}
            </Button>
          </form>
        ) : (
          <div className="space-y-3">
            {tab === "signup" && !otpSent && (
              <div className="space-y-1.5">
                <Label htmlFor="name-phone">Name</Label>
                <Input id="name-phone" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" autoComplete="name" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="phone">Mobile number</Label>
              <div className="flex gap-2">
                <Select value={countryCode} onValueChange={setCountryCode} disabled={otpSent}>
                  <SelectTrigger className="w-[110px] shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {COUNTRY_CODES.map((c) => (
                      <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  value={phoneLocal}
                  onChange={(e) => setPhoneLocal(e.target.value.replace(/\D/g, "").slice(0, 15))}
                  placeholder="98765 43210"
                  autoComplete="tel-national"
                  disabled={otpSent}
                  className="flex-1 min-w-0"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">Choose your country code, then enter your number.</p>
            </div>

            {otpSent && (
              <div className="space-y-1.5">
                <Label htmlFor="otp">One-time code</Label>
                <Input
                  id="otp"
                  inputMode="numeric"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 8))}
                  placeholder="123456"
                  autoComplete="one-time-code"
                />
                <p className="text-[11px] text-muted-foreground">
                  Demo: use <span className="font-mono font-semibold">{DEMO_OTP}</span> to verify instantly.
                </p>
              </div>
            )}

            {!otpSent ? (
              <Button type="button" disabled={busy} className="w-full" onClick={sendOtp}>
                Send OTP
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button type="button" variant="outline" disabled={busy} onClick={() => { setOtpSent(false); setOtp(""); }}>
                  Edit number
                </Button>
                <Button type="button" disabled={busy} className="flex-1" onClick={verifyOtp}>
                  Verify &amp; continue
                </Button>
              </div>
            )}
          </div>
        )}

        <div className="relative text-center text-xs text-muted-foreground">
          <span className="bg-card px-2 relative z-10">or</span>
          <div className="absolute inset-x-0 top-1/2 h-px bg-border -z-0" />
        </div>

        <Button type="button" variant="outline" className="w-full" disabled={busy} onClick={handleGoogle}>
          Continue with Google
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          By continuing you agree to our terms.
        </p>
      </Card>
    </div>
  );
};

export default AuthPage;
