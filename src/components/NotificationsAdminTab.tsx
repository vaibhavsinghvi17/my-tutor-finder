import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Bell, Loader2, Send, Sparkles, Users, Eye, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Role = "all" | "tutor" | "learner";
type Tier = "all" | "starter" | "growth";
type Activity = "all" | "inactive_30d" | "no_avatar" | "no_listings";

interface Filters {
  role: Role;
  tier: Tier;
  activity: Activity;
  cities: string[];
  categories: string[];
}

interface PreviewResult {
  count: number;
  sample: Array<{ user_id: string; display_name: string | null; city: string | null; subscription_tier: string }>;
}

export function NotificationsAdminTab() {
  const [filters, setFilters] = useState<Filters>({
    role: "all", tier: "all", activity: "all", cities: [], categories: [],
  });
  const [citiesInput, setCitiesInput] = useState("");
  const [catsInput, setCatsInput] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [link, setLink] = useState("");
  const [useAi, setUseAi] = useState(false);
  const [aiIntent, setAiIntent] = useState("engagement");
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [busy, setBusy] = useState<"preview" | "send" | "ai" | "auto" | null>(null);

  function syncFilters(): Filters {
    const f: Filters = {
      ...filters,
      cities: citiesInput.split(",").map((s) => s.trim()).filter(Boolean),
      categories: catsInput.split(",").map((s) => s.trim()).filter(Boolean),
    };
    setFilters(f);
    return f;
  }

  async function handlePreview() {
    setBusy("preview");
    const f = syncFilters();
    const { data, error } = await supabase.functions.invoke("notifications-send", {
      body: { action: "preview", filters: f },
    });
    setBusy(null);
    if (error || (data as any)?.error) {
      toast.error((data as any)?.error ?? error?.message ?? "Preview failed");
      return;
    }
    setPreview(data as PreviewResult);
  }

  async function handleAiSuggest() {
    setBusy("ai");
    const f = syncFilters();
    const audience = describe(f);
    const { data, error } = await supabase.functions.invoke("notifications-send", {
      body: { action: "ai-suggest", audience, intent: aiIntent },
    });
    setBusy(null);
    if (error || (data as any)?.error) {
      toast.error((data as any)?.error ?? error?.message ?? "AI failed");
      return;
    }
    setTitle((data as any).title ?? "");
    setBody((data as any).body ?? "");
    toast.success("AI draft ready — review before sending");
  }

  async function handleSend() {
    if (!useAi && !title.trim()) { toast.error("Add a title or enable AI"); return; }
    setBusy("send");
    const f = syncFilters();
    const { data, error } = await supabase.functions.invoke("notifications-send", {
      body: { action: "send", filters: f, title, body, link, useAi, aiIntent },
    });
    setBusy(null);
    if (error || (data as any)?.error) {
      toast.error((data as any)?.error ?? error?.message ?? "Send failed");
      return;
    }
    toast.success(`Sent to ${(data as any).sent} users`);
    setTitle(""); setBody(""); setLink("");
  }

  async function handleAutoRun(intent: string) {
    setBusy("auto");
    const { data, error } = await supabase.functions.invoke("notifications-send", {
      body: { action: "auto-run", intent },
    });
    setBusy(null);
    if (error || (data as any)?.error) {
      toast.error((data as any)?.error ?? error?.message ?? "Auto-run failed");
      return;
    }
    toast.success(`AI sent ${(data as any).sent} nudges${(data as any).skipped ? ` (skipped ${(data as any).skipped})` : ""}`);
  }

  return (
    <div className="space-y-4">
      {/* AI auto-nudges */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <div className="font-semibold text-sm">AI auto-nudges</div>
        </div>
        <p className="text-xs text-muted-foreground">
          Generates a personalised notification per user using AI, then sends it. Skips anyone who already got the same kind in the last 24h.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" disabled={busy === "auto"} onClick={() => handleAutoRun("tutor_insights")} className="gap-1.5">
            {busy === "auto" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
            Tutor insights
          </Button>
          <Button size="sm" variant="outline" disabled={busy === "auto"} onClick={() => handleAutoRun("learner_recs")} className="gap-1.5">
            {busy === "auto" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
            Learner recommendations
          </Button>
          <Button size="sm" variant="outline" disabled={busy === "auto"} onClick={() => handleAutoRun("engagement")} className="gap-1.5">
            {busy === "auto" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
            Re-engage inactive
          </Button>
        </div>
      </Card>

      {/* Custom send */}
      <Card className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          <div className="font-semibold text-sm">Send custom notification</div>
        </div>

        {/* Filters */}
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Role</Label>
            <Select value={filters.role} onValueChange={(v) => setFilters({ ...filters, role: v as Role })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Everyone</SelectItem>
                <SelectItem value="tutor">Tutors only</SelectItem>
                <SelectItem value="learner">Learners only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Subscription tier</Label>
            <Select value={filters.tier} onValueChange={(v) => setFilters({ ...filters, tier: v as Tier })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All tiers</SelectItem>
                <SelectItem value="starter">Starter</SelectItem>
                <SelectItem value="growth">Growth</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Activity</Label>
            <Select value={filters.activity} onValueChange={(v) => setFilters({ ...filters, activity: v as Activity })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any activity</SelectItem>
                <SelectItem value="inactive_30d">Inactive 30+ days</SelectItem>
                <SelectItem value="no_avatar">No profile photo</SelectItem>
                <SelectItem value="no_listings">No listings yet (tutors)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 sm:col-span-3">
            <Label className="text-xs">Cities (comma-separated)</Label>
            <Input value={citiesInput} onChange={(e) => setCitiesInput(e.target.value)} placeholder="Mumbai, Bangalore" className="h-8 text-xs" />
          </div>
          <div className="space-y-1 sm:col-span-3">
            <Label className="text-xs">Categories (comma-separated, matches tutor boost categories)</Label>
            <Input value={catsInput} onChange={(e) => setCatsInput(e.target.value)} placeholder="Maths, Music" className="h-8 text-xs" />
          </div>
        </div>

        {/* Preview */}
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handlePreview} disabled={busy === "preview"} className="gap-1.5">
            {busy === "preview" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Eye className="h-3 w-3" />}
            Preview audience
          </Button>
          {preview && (
            <Badge variant="outline" className="gap-1 text-xs"><Users className="h-3 w-3" /> {preview.count} users</Badge>
          )}
        </div>
        {preview && preview.sample.length > 0 && (
          <div className="text-xs text-muted-foreground">
            Sample: {preview.sample.map((s) => s.display_name || s.user_id.slice(0, 6)).join(", ")}
          </div>
        )}

        {/* Message */}
        <div className="space-y-2 border-t pt-3">
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <Checkbox checked={useAi} onCheckedChange={(v) => setUseAi(!!v)} />
            <Sparkles className="h-3 w-3 text-primary" />
            Let AI write this notification (uses audience filters)
          </label>
          {useAi && (
            <div className="flex items-center gap-2">
              <Label className="text-xs shrink-0">Intent</Label>
              <Select value={aiIntent} onValueChange={setAiIntent}>
                <SelectTrigger className="h-8 text-xs flex-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="engagement">Engagement nudge</SelectItem>
                  <SelectItem value="tutor_insights">Tutor insight</SelectItem>
                  <SelectItem value="learner_recs">Learner recommendation</SelectItem>
                  <SelectItem value="boost">Boost suggestion</SelectItem>
                  <SelectItem value="announcement">Product announcement</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" onClick={handleAiSuggest} disabled={busy === "ai"} className="gap-1.5">
                {busy === "ai" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
                Draft with AI
              </Button>
            </div>
          )}
          <div className="space-y-1">
            <Label className="text-xs">Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} className="h-8 text-xs" placeholder="Short, punchy headline" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Body</Label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={600} rows={3} className="text-xs" placeholder="Optional message body" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Link (optional)</Label>
            <Input value={link} onChange={(e) => setLink(e.target.value)} className="h-8 text-xs" placeholder="/discover or https://..." />
          </div>
        </div>

        <Button onClick={handleSend} disabled={busy === "send"} className="w-full gap-2">
          {busy === "send" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Send notification
        </Button>
      </Card>
    </div>
  );
}

function describe(f: Filters): string {
  const bits: string[] = [];
  bits.push(f.role === "all" ? "users" : `${f.role}s`);
  if (f.cities.length) bits.push(`in ${f.cities.join(", ")}`);
  if (f.categories.length) bits.push(`interested in ${f.categories.join(", ")}`);
  if (f.tier !== "all") bits.push(`on ${f.tier} plan`);
  if (f.activity !== "all") bits.push(`(${f.activity.replace(/_/g, " ")})`);
  return bits.join(" ");
}
