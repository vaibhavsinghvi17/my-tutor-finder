import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { store } from "@/lib/store";

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

const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+[1-9]\d{6,14}$/, "Use international format like +919876543210");

const AuthPage = () => {
  const navigate = useNavigate();

  const [countryCode, setCountryCode] = useState("+91");
  const [phoneLocal, setPhoneLocal] = useState("");
  const phone = `${countryCode}${phoneLocal.replace(/\D/g, "")}`;
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);
  const [resendTimer, setResendTimer] = useState(0);

  // Route based on profile completeness — new users go through onboarding.
  const getPostLoginPath = () => {
    const s = store.get();
    const hasLearner = !!s.learner.name?.trim();
    const hasProvider = !!s.provider.businessName?.trim();
    if (!s.onboarded || (!hasLearner && !hasProvider)) return "/";
    return s.mode === "provider" ? "/provider" : "/dashboard";
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        store.setAuthUser(data.session.user.id);
        navigate(getPostLoginPath(), { replace: true });
      } else {
        store.setAuthUser(null);
        setChecking(false);
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      store.setAuthUser(session?.user?.id ?? null);
      if (session) navigate(getPostLoginPath(), { replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (resendTimer <= 0) return;
    const id = setInterval(() => {
      setResendTimer((t) => t - 1);
    }, 1000);
    return () => clearInterval(id);
  }, [resendTimer]);

  async function sendOtp() {
    const parsed = phoneSchema.safeParse(phone);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("whatsapp-otp-send", {
        body: { phone: parsed.data },
      });
      if (error || (data as any)?.error) {
        toast.error((data as any)?.error || error?.message || "Failed to send OTP");
        return;
      }
      setOtpSent(true);
      toast.success(`OTP sent on WhatsApp to ${parsed.data}`);
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtp() {
    const entered = otp.trim();
    if (entered.length < 4) { toast.error("Enter the OTP you received"); return; }
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("whatsapp-otp-verify", {
        body: { phone, code: entered },
      });
      if (error || (data as any)?.error) {
        toast.error((data as any)?.error || error?.message || "Verification failed");
        return;
      }
      const { phone: digits, access_token, refresh_token } = data as { phone: string; access_token: string; refresh_token: string };
      const { error: signInErr } = await supabase.auth.setSession({ access_token, refresh_token });
      if (signInErr) { toast.error(signInErr.message); return; }
      store.updateLearner({ phone, verifiedPhone: phone });
      toast.success("Phone verified — signed in!");
      navigate(getPostLoginPath());
    } finally {
      setBusy(false);
    }
  }

  if (checking) {
    return <div className="min-h-screen grid place-items-center text-sm text-muted-foreground">Loading…</div>;
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

        <div className="text-center space-y-1">
          <h2 className="text-base font-semibold">Login via WhatsApp OTP</h2>
          <p className="text-xs text-muted-foreground">Enter your mobile number to receive a one-time code on WhatsApp.</p>
        </div>

        <div className="space-y-3">
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
                We just sent a code on WhatsApp to <span className="font-medium">{phone}</span>. It may take a few seconds.
              </p>
            </div>
          )}

          {!otpSent ? (
            <Button type="button" disabled={busy} className="w-full" onClick={sendOtp}>
              Send OTP on WhatsApp
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

        <p className="text-xs text-muted-foreground text-center">
          By continuing you agree to our terms.
        </p>
      </Card>
    </div>
  );
};

export default AuthPage;
