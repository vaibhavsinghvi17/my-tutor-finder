import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { TopBar } from "@/components/TopBar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { store, useStore } from "@/lib/store";
import { slotsToText } from "@/components/ScheduleGrid";
import { LearnerProfileDialog } from "@/components/LearnerProfileDialog";
import { ClassChat } from "@/components/ClassChat";
import { DatePicker } from "@/components/DatePicker";
import { JoinRequest, SlotKey } from "@/lib/types";
import { findProfileByUsername } from "@/lib/usernames";
import { ArrowLeft, Check, X, Inbox, CheckCircle2, Sparkles, UserPlus, AtSign, Repeat } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ProviderRequests = () => {
  const navigate = useNavigate();
  const listings = useStore((s) => s.listings);
  const requests = useStore((s) => s.requests);
  const [viewing, setViewing] = useState<JoinRequest | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const myListingIds = new Set(listings.map((l) => l.id));
  const incoming = requests.filter((r) => myListingIds.has(r.listingId));

  // Trial requests appear on top of pending list
  const pending = useMemo(
    () => incoming.filter((r) => r.status === "Pending")
      .sort((a, b) => Number(!!b.isTrial) - Number(!!a.isTrial) || b.createdAt - a.createdAt),
    [incoming],
  );
  const approved = incoming.filter((r) => r.status === "Approved");

  return (
    <div className="min-h-screen">
      <TopBar />
      <main className="container py-4 sm:py-6 space-y-4 max-w-3xl">
        <button
          onClick={() => navigate(-1)}
          className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>

        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-lg font-semibold">Join requests</h1>
            <p className="text-sm text-muted-foreground">Approve or decline learners interested in your classes.</p>
          </div>
          <Button size="sm" className="gap-1.5 rounded-full" onClick={() => setAddOpen(true)}>
            <UserPlus className="h-4 w-4" /> Add student
          </Button>
        </div>

        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending" className="gap-1.5">
              <Inbox className="h-3.5 w-3.5" /> Requests
              {pending.length > 0 && (
                <Badge variant="outline" className="ml-1 h-5 px-1.5 text-[10px]">{pending.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved" className="gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" /> Approved
              {approved.length > 0 && (
                <Badge variant="outline" className="ml-1 h-5 px-1.5 text-[10px]">{approved.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-2 mt-3">
            {pending.length === 0 ? (
              <Card className="p-6 text-sm text-muted-foreground text-center">
                No pending requests right now.
              </Card>
            ) : (
              pending.map((r) => (
                <RequestRow
                  key={r.id}
                  r={r}
                  className={listings.find((l) => l.id === r.listingId)?.title ?? "Class"}
                  onView={() => setViewing(r)}
                  actions={
                    <>
                      <Button
                        size="icon"
                        className="h-8 w-8 rounded-full bg-success text-success-foreground hover:bg-success/90"
                        onClick={() => { store.setRequestStatus(r.id, "Approved"); toast.success("Approved"); }}
                        title="Approve"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 rounded-full text-destructive"
                        onClick={() => { store.setRequestStatus(r.id, "Declined"); toast.success("Declined"); }}
                        title="Decline"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  }
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-2 mt-3">
            {approved.length === 0 ? (
              <Card className="p-6 text-sm text-muted-foreground text-center">
                No approved students yet.
              </Card>
            ) : (
              approved.map((r) => (
                <RequestRow
                  key={r.id}
                  r={r}
                  className={listings.find((l) => l.id === r.listingId)?.title ?? "Class"}
                  onView={() => setViewing(r)}
                  actions={
                    <div className="flex items-center gap-1.5">
                      {r.isTrial && !r.converted && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 gap-1 rounded-full"
                          onClick={() => { store.updateRequest(r.id, { converted: true, isTrial: false }); toast.success("Marked as converted"); }}
                          title="Mark as converted"
                        >
                          <Repeat className="h-3.5 w-3.5" /> Converted
                        </Button>
                      )}
                      {r.converted && (
                        <Badge variant="outline" className="border-success text-success">Converted</Badge>
                      )}
                      {r.isTrial && !r.converted && (
                        <Badge variant="outline" className="border-primary/40 text-primary">Trial</Badge>
                      )}
                      {!r.isTrial && !r.converted && (
                        <Badge className="bg-success text-success-foreground border-0">Approved</Badge>
                      )}
                    </div>
                  }
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>

      <LearnerProfileDialog request={viewing} onOpenChange={(o) => !o && setViewing(null)} />
      <AddStudentDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
};

function RequestRow({
  r, className, onView, actions,
}: { r: JoinRequest; className: string; onView: () => void; actions: React.ReactNode }) {
  const date = new Date(r.createdAt);
  const dateStr = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const timeStr = date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return (
    <Card className={cn("p-3 flex items-center gap-3", r.isTrial && r.status === "Pending" && "ring-1 ring-primary/40")}>
      <div className="flex-1 min-w-0">
        <Link to={`/listing/${r.listingId}`} className="text-sm font-semibold truncate block hover:text-primary">
          {className}
        </Link>
        <button
          type="button"
          onClick={onView}
          className="text-xs text-muted-foreground hover:text-primary hover:underline truncate block text-left max-w-full"
        >
          {r.forKidName ?? r.learnerName}
          {r.learnerUsername && <span className="text-muted-foreground"> · @{r.learnerUsername}</span>}
        </button>
        <div className="text-[11px] text-muted-foreground mt-0.5 truncate flex items-center gap-1.5">
          {r.isTrial && r.status === "Pending" && (
            <span className="inline-flex items-center gap-0.5 text-primary font-medium">
              <Sparkles className="h-3 w-3" /> Trial
            </span>
          )}
          <span>{dateStr} • {timeStr} • slot {slotsToText([r.slot])}</span>
        </div>
        {(r.startDate || r.endDate) && (
          <div className="text-[11px] text-muted-foreground mt-0.5">
            {r.startDate ? `Starts ${r.startDate}` : ""}{r.endDate ? ` · Ends ${r.endDate}` : ""}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {r.learnerUserId && (
          <ClassChat
            listingId={r.listingId}
            listingTitle={className}
            learnerUserId={r.learnerUserId}
            otherPartyName={r.forKidName ?? r.learnerName}
            triggerVariant="ghost"
            triggerLabel=""
          />
        )}
        {actions}
      </div>
    </Card>
  );
}

function AddStudentDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const listings = useStore((s) => s.listings);
  const state = useStore((s) => s);
  const [username, setUsername] = useState("");
  const [listingId, setListingId] = useState<string>("");
  const [slot, setSlot] = useState<string>("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const listing = listings.find((l) => l.id === listingId);

  function reset() {
    setUsername(""); setListingId(""); setSlot(""); setStartDate(""); setEndDate("");
  }

  function submit() {
    const profile = findProfileByUsername(state, username);
    if (!profile) { toast.error("No profile found with that username"); return; }
    if (!listingId) { toast.error("Pick a class"); return; }
    if (!slot) { toast.error("Pick a slot"); return; }
    if (!startDate) { toast.error("Pick a class joining date"); return; }

    store.addRequestRaw({
      listingId,
      learnerName: profile.kind === "kid" || profile.kind === "adult" ? profile.name : profile.name,
      learnerUsername: profile.username,
      forKidName: profile.kind === "kid" ? profile.name : undefined,
      slot: slot as SlotKey,
      note: "Added by tutor",
      isTrial: false,
      status: "Approved",
      startDate,
      endDate: endDate || undefined,
      addedByTutor: true,
    } as any);
    toast.success(`Added ${profile.name} to the class`);
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Add student to a class</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-sm">Student username</Label>
            <div className="relative">
              <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value.slice(0, 24))}
                placeholder="e.g. priya.sharma"
                className="pl-9"
              />
            </div>
            {username && (() => {
              const p = findProfileByUsername(state, username);
              return p ? (
                <p className="text-xs text-success">Found: {p.name} ({p.kind})</p>
              ) : (
                <p className="text-xs text-muted-foreground">No matching profile yet.</p>
              );
            })()}
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Class</Label>
            <Select value={listingId} onValueChange={(v) => { setListingId(v); setSlot(""); }}>
              <SelectTrigger><SelectValue placeholder={listings.length ? "Pick a class" : "Create a class first"} /></SelectTrigger>
              <SelectContent>
                {listings.map((l) => <SelectItem key={l.id} value={l.id}>{l.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {listing && (
            <div className="space-y-1.5">
              <Label className="text-sm">Slot</Label>
              <Select value={slot} onValueChange={setSlot}>
                <SelectTrigger><SelectValue placeholder="Pick a slot" /></SelectTrigger>
                <SelectContent>
                  {listing.slots.map((s) => (
                    <SelectItem key={s} value={s}>{slotsToText([s])}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Joining date</Label>
              <DatePicker value={startDate} onChange={setStartDate} placeholder="Pick joining date" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">End date (optional)</Label>
              <DatePicker value={endDate} min={startDate || undefined} onChange={setEndDate} placeholder="Pick end date" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit}>Add student</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ProviderRequests;
