import { useEffect, useMemo, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { TopBar } from "@/components/TopBar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Shield, Users, Rocket, Tag, Sparkles, Search, Gift, XCircle, Trash2, CheckCircle2, Flag, Bell, Loader2, Send, Ban } from "lucide-react";
import { NotificationsAdminTab } from "@/components/NotificationsAdminTab";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/lib/useIsAdmin";
import { useAuth } from "@/lib/useAuth";
import { toast } from "sonner";

interface ProfileRow {
  user_id: string;
  display_name: string | null;
  subscription_tier: string;
  subscription_expires_at: string | null;
  created_at: string;
  avatar_url: string | null;
  banned_at: string | null;
  banned_reason: string | null;
}
interface BoostRow {
  id: string;
  listing_id: string;
  provider_user_id: string;
  city: string | null;
  category: string | null;
  starts_at: string;
  expires_at: string;
  status: string;
}
interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  status: string;
  created_by_name: string | null;
  created_at: string;
}

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useIsAdmin();

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar />
        <div className="container py-12 text-center text-muted-foreground">Checking access…</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar />
        <div className="container py-12 max-w-md mx-auto text-center space-y-3">
          <Shield className="h-10 w-10 mx-auto text-muted-foreground" />
          <h1 className="text-xl font-bold">Admins only</h1>
          <p className="text-sm text-muted-foreground">
            You don't have admin access. If you should, ask an existing admin to grant you the role.
          </p>
          <Button asChild variant="outline"><Link to="/discover">Back to Discover</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <div className="container py-6 space-y-6 max-w-5xl">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Admin Panel</h1>
        </div>

        <StatsRow />

        <Tabs defaultValue="users">
          <TabsList className="w-full grid grid-cols-5">
            <TabsTrigger value="users" className="gap-1.5"><Users className="h-3.5 w-3.5" />Users</TabsTrigger>
            <TabsTrigger value="boosts" className="gap-1.5"><Rocket className="h-3.5 w-3.5" />Boosts</TabsTrigger>
            <TabsTrigger value="reports" className="gap-1.5"><Flag className="h-3.5 w-3.5" />Reports</TabsTrigger>
            <TabsTrigger value="categories" className="gap-1.5"><Tag className="h-3.5 w-3.5" />Categories</TabsTrigger>
            <TabsTrigger value="notifications" className="gap-1.5"><Bell className="h-3.5 w-3.5" />Notify</TabsTrigger>
          </TabsList>
          <TabsContent value="users" className="mt-4"><UsersTab /></TabsContent>
          <TabsContent value="boosts" className="mt-4"><BoostsTab /></TabsContent>
          <TabsContent value="reports" className="mt-4"><ReportsTab /></TabsContent>
          <TabsContent value="categories" className="mt-4"><CategoriesTab /></TabsContent>
          <TabsContent value="notifications" className="mt-4"><NotificationsAdminTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

/* -------------------------------- Stats -------------------------------- */

function StatsRow() {
  const [stats, setStats] = useState({ users: 0, growth: 0, boosts: 0, messages: 0, events: 0 });
  useEffect(() => {
    (async () => {
      const [u, g, b, m, e] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("subscription_tier", "growth"),
        supabase.from("boosts").select("*", { count: "exact", head: true }).eq("status", "active").gt("expires_at", new Date().toISOString()),
        supabase.from("messages").select("*", { count: "exact", head: true }),
        supabase.from("listing_events").select("*", { count: "exact", head: true }),
      ]);
      setStats({
        users: u.count ?? 0,
        growth: g.count ?? 0,
        boosts: b.count ?? 0,
        messages: m.count ?? 0,
        events: e.count ?? 0,
      });
    })();
  }, []);
  const items = [
    { label: "Users", value: stats.users, icon: Users },
    { label: "Growth subs", value: stats.growth, icon: Sparkles },
    { label: "Active boosts", value: stats.boosts, icon: Rocket },
    { label: "Messages", value: stats.messages, icon: Tag },
    { label: "Events", value: stats.events, icon: CheckCircle2 },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
      {items.map((it) => (
        <Card key={it.label} className="p-3">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
            <it.icon className="h-3 w-3" /> {it.label}
          </div>
          <div className="text-xl font-bold mt-0.5">{it.value}</div>
        </Card>
      ))}
    </div>
  );
}

/* -------------------------------- Users -------------------------------- */

function UsersTab() {
  const [rows, setRows] = useState<ProfileRow[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ProfileRow | null>(null);

  async function refresh() {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("user_id, display_name, subscription_tier, subscription_expires_at, created_at, avatar_url")
      .order("created_at", { ascending: false })
      .limit(500);
    setRows((data as ProfileRow[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { refresh(); }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) =>
      (r.display_name ?? "").toLowerCase().includes(s) || r.user_id.toLowerCase().includes(s)
    );
  }, [rows, q]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or user ID" className="pl-8" />
      </div>
      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => (
            <Card key={r.user_id} className="p-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{r.display_name || "(no name)"}</div>
                <div className="text-[11px] text-muted-foreground truncate">{r.user_id}</div>
              </div>
              <Badge variant={r.subscription_tier === "growth" ? "default" : "outline"} className="text-[10px]">
                {r.subscription_tier}
              </Badge>
              <Button size="sm" variant="outline" onClick={() => setEditing(r)}>Manage</Button>
            </Card>
          ))}
          {filtered.length === 0 && <div className="text-sm text-muted-foreground py-6 text-center">No users found.</div>}
        </div>
      )}

      {editing && (
        <UserEditDialog row={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); refresh(); }} />
      )}
    </div>
  );
}

function UserEditDialog({ row, onClose, onSaved }: { row: ProfileRow; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(row.display_name ?? "");
  const [tier, setTier] = useState(row.subscription_tier);
  const [expires, setExpires] = useState(row.subscription_expires_at?.slice(0, 10) ?? "");
  const [busy, setBusy] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("user_roles").select("role").eq("user_id", row.user_id).eq("role", "admin").maybeSingle();
      setIsAdminUser(!!data);
    })();
  }, [row.user_id]);

  async function save() {
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: name || null,
        subscription_tier: tier,
        subscription_expires_at: expires ? new Date(expires).toISOString() : null,
      })
      .eq("user_id", row.user_id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
    onSaved();
  }

  async function gift(months: number) {
    const exp = new Date(Date.now() + months * 30 * 24 * 3600 * 1000).toISOString();
    const { error } = await supabase
      .from("profiles")
      .update({ subscription_tier: "growth", subscription_expires_at: exp })
      .eq("user_id", row.user_id);
    if (error) return toast.error(error.message);
    toast.success(`Gifted ${months} month${months > 1 ? "s" : ""} of Growth`);
    onSaved();
  }

  async function revoke() {
    const { error } = await supabase
      .from("profiles")
      .update({ subscription_tier: "starter", subscription_expires_at: null })
      .eq("user_id", row.user_id);
    if (error) return toast.error(error.message);
    toast.success("Subscription revoked");
    onSaved();
  }

  async function toggleAdmin() {
    if (isAdminUser) {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", row.user_id).eq("role", "admin");
      if (error) return toast.error(error.message);
      setIsAdminUser(false);
      toast.success("Admin role removed");
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: row.user_id, role: "admin" });
      if (error) return toast.error(error.message);
      setIsAdminUser(true);
      toast.success("Admin role granted");
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Manage user</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="text-[11px] text-muted-foreground break-all">{row.user_id}</div>

          <div className="space-y-1.5">
            <Label className="text-xs">Display name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Subscription tier</Label>
              <Select value={tier} onValueChange={setTier}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="growth">Growth</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Expires (optional)</Label>
              <Input type="date" value={expires} onChange={(e) => setExpires(e.target.value)} />
            </div>
          </div>

          <div className="rounded-lg border p-3 space-y-2 bg-muted/30">
            <div className="text-xs font-semibold flex items-center gap-1.5"><Gift className="h-3.5 w-3.5" />Quick gifts</div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => gift(1)}>+1 month Growth</Button>
              <Button size="sm" variant="outline" onClick={() => gift(3)}>+3 months</Button>
              <Button size="sm" variant="outline" onClick={() => gift(12)}>+1 year</Button>
              <Button size="sm" variant="outline" className="text-destructive gap-1" onClick={revoke}>
                <XCircle className="h-3.5 w-3.5" /> Revoke
              </Button>
            </div>
          </div>

          <div className="rounded-lg border p-3 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" />Admin role</div>
              <div className="text-[11px] text-muted-foreground">{isAdminUser ? "This user is an admin" : "Not an admin"}</div>
            </div>
            <Button size="sm" variant={isAdminUser ? "outline" : "default"} onClick={toggleAdmin} disabled={isAdminUser === null}>
              {isAdminUser ? "Remove admin" : "Make admin"}
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>Close</Button>
          <Button onClick={save} disabled={busy}>{busy ? "Saving…" : "Save changes"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------- Boosts -------------------------------- */

function BoostsTab() {
  const [rows, setRows] = useState<BoostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  async function refresh() {
    setLoading(true);
    const { data } = await supabase.from("boosts").select("*").order("created_at", { ascending: false }).limit(200);
    setRows((data as BoostRow[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { refresh(); }, []);

  async function cancelBoost(id: string) {
    if (!confirm("Cancel this boost?")) return;
    const { error } = await supabase.from("boosts").update({ status: "cancelled" }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Boost cancelled");
    refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setOpen(true)} className="gap-1.5"><Rocket className="h-3.5 w-3.5" />Create free boost</Button>
      </div>
      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : (
        <div className="space-y-2">
          {rows.map((b) => {
            const active = b.status === "active" && new Date(b.expires_at) > new Date();
            return (
              <Card key={b.id} className="p-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">Listing: {b.listing_id}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {b.city ?? "Any city"} · {b.category ?? "Any category"} ·
                      expires {new Date(b.expires_at).toLocaleDateString()}
                    </div>
                  </div>
                  <Badge variant={active ? "default" : "outline"} className="text-[10px]">{active ? "active" : b.status}</Badge>
                  {active && (
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => cancelBoost(b.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
          {rows.length === 0 && <div className="text-sm text-muted-foreground py-6 text-center">No boosts yet.</div>}
        </div>
      )}
      {open && <CreateBoostDialog onClose={() => setOpen(false)} onCreated={() => { setOpen(false); refresh(); }} />}
    </div>
  );
}

function CreateBoostDialog({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [listingId, setListingId] = useState("");
  const [providerId, setProviderId] = useState("");
  const [days, setDays] = useState(7);
  const [city, setCity] = useState("");
  const [busy, setBusy] = useState(false);

  async function create() {
    if (!listingId.trim() || !providerId.trim()) return toast.error("Listing ID and tutor user ID required");
    setBusy(true);
    const expires = new Date(Date.now() + days * 24 * 3600 * 1000).toISOString();
    const { error } = await supabase.from("boosts").insert({
      listing_id: listingId.trim(),
      provider_user_id: providerId.trim(),
      city: city.trim() || null,
      expires_at: expires,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Boost created");
    onCreated();
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Create free boost</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Listing ID</Label>
            <Input value={listingId} onChange={(e) => setListingId(e.target.value)} placeholder="e.g. listing_abc123" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Tutor user ID</Label>
            <Input value={providerId} onChange={(e) => setProviderId(e.target.value)} placeholder="uuid of the tutor" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Duration (days)</Label>
              <Input type="number" min={1} value={days} onChange={(e) => setDays(Number(e.target.value) || 1)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Target city (optional)</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Any" />
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Tip: open the listing page → the URL ends with the listing ID. The tutor user ID is in the user's admin profile dialog.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={create} disabled={busy}>{busy ? "Creating…" : "Create boost"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------- Categories -------------------------------- */

function CategoriesTab() {
  const [rows, setRows] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    const { data } = await supabase.from("categories").select("*").order("created_at", { ascending: false });
    setRows((data as CategoryRow[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { refresh(); }, []);

  async function remove(id: string) {
    if (!confirm("Delete this category?")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    refresh();
  }

  return loading ? (
    <div className="text-sm text-muted-foreground">Loading…</div>
  ) : (
    <div className="space-y-2">
      {rows.map((c) => (
        <Card key={c.id} className="p-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate">{c.name}</div>
            <div className="text-[11px] text-muted-foreground truncate">
              {c.slug} · by {c.created_by_name ?? "—"} · {new Date(c.created_at).toLocaleDateString()}
            </div>
          </div>
          <Badge variant="outline" className="text-[10px]">{c.status}</Badge>
          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove(c.id)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </Card>
      ))}
      {rows.length === 0 && <div className="text-sm text-muted-foreground py-6 text-center">No categories.</div>}
    </div>
  );
}

/* -------------------------------- Reports -------------------------------- */

interface ReportRow {
  id: string;
  reporter_user_id: string;
  reporter_name: string | null;
  target_type: string;
  target_id: string;
  reason: string;
  details: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

function ReportsTab() {
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("open");
  const [editing, setEditing] = useState<ReportRow | null>(null);

  async function refresh() {
    setLoading(true);
    let q = supabase.from("reports").select("*").order("created_at", { ascending: false }).limit(200);
    if (filter !== "all") q = q.eq("status", filter);
    const { data } = await q;
    setRows((data as ReportRow[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [filter]);

  function targetLink(r: ReportRow) {
    if (r.target_type === "listing") return <Link to={`/listing/${r.target_id}`} className="text-primary underline">View listing</Link>;
    return <span className="text-muted-foreground">{r.target_type}: {r.target_id.slice(0, 8)}…</span>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="reviewing">Reviewing</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="dismissed">Dismissed</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
        <div className="text-xs text-muted-foreground">{rows.length} report{rows.length === 1 ? "" : "s"}</div>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <Card key={r.id} className="p-3 space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-[10px] capitalize">{r.target_type}</Badge>
                <Badge variant="outline" className="text-[10px] capitalize">{r.reason}</Badge>
                <Badge
                  variant={r.status === "open" ? "destructive" : r.status === "resolved" ? "default" : "outline"}
                  className="text-[10px] capitalize"
                >
                  {r.status}
                </Badge>
                <span className="text-[11px] text-muted-foreground ml-auto">
                  {new Date(r.created_at).toLocaleString()}
                </span>
              </div>
              {r.details && <p className="text-sm">{r.details}</p>}
              <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                <span>Reported by {r.reporter_name ?? "user"} · {targetLink(r)}</span>
                <Button size="sm" variant="outline" onClick={() => setEditing(r)}>Manage</Button>
              </div>
            </Card>
          ))}
          {rows.length === 0 && <div className="text-sm text-muted-foreground py-6 text-center">No reports.</div>}
        </div>
      )}

      {editing && <ReportEditDialog row={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); refresh(); }} />}
    </div>
  );
}

function ReportEditDialog({ row, onClose, onSaved }: { row: ReportRow; onClose: () => void; onSaved: () => void }) {
  const [status, setStatus] = useState(row.status);
  const [notes, setNotes] = useState(row.admin_notes ?? "");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    const { error } = await supabase
      .from("reports")
      .update({ status, admin_notes: notes.trim() || null })
      .eq("id", row.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Report updated");
    onSaved();
  }

  async function remove() {
    if (!confirm("Delete this report?")) return;
    const { error } = await supabase.from("reports").delete().eq("id", row.id);
    if (error) return toast.error(error.message);
    toast.success("Report deleted");
    onSaved();
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Manage report</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="text-xs space-y-0.5">
            <div><span className="text-muted-foreground">Target:</span> {row.target_type} <span className="font-mono">{row.target_id}</span></div>
            <div><span className="text-muted-foreground">Reason:</span> <span className="capitalize">{row.reason}</span></div>
            <div><span className="text-muted-foreground">Reporter:</span> {row.reporter_name ?? row.reporter_user_id.slice(0, 8)}</div>
          </div>
          {row.details && <div className="rounded border p-2 text-sm bg-muted/30">{row.details}</div>}
          <div className="space-y-1.5">
            <Label className="text-xs">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="reviewing">Reviewing</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="dismissed">Dismissed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Internal notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="What action did you take?" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" className="text-destructive mr-auto" onClick={remove} disabled={busy}>
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={onClose} disabled={busy}>Close</Button>
          <Button onClick={save} disabled={busy}>{busy ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
