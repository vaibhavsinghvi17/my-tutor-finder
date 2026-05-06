import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";
import { useStore } from "@/lib/store";
import { resolveActiveBoostId, recordEvent } from "@/lib/useEvents";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, LogIn, X, Maximize2, Minimize2, Rocket } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Msg {
  id: string;
  body: string;
  sender_user_id: string;
  created_at: string;
  via_boost_id?: string | null;
}

interface Props {
  listingId: string;
  listingTitle: string;
  providerUserId?: string;       // when current user is the learner
  learnerUserId?: string;        // when current user is the provider
  /** Display name of the other party — used in headers */
  otherPartyName: string;
  /** Visual variant for the trigger button */
  triggerVariant?: "default" | "outline" | "secondary" | "ghost";
  triggerLabel?: string;
  /** Render the trigger as a floating bubble pinned to the bottom-right of the viewport. */
  floating?: boolean;
}

/**
 * 1:1 real-time chat between a learner and a provider for a given class.
 * The thread is identified by (listing_id, learner_user_id, provider_user_id).
 * Either side can open the chat; messages are restricted by RLS to participants.
 */
export function ClassChat({
  listingId, listingTitle, providerUserId, learnerUserId,
  otherPartyName, triggerVariant = "outline", triggerLabel = "Message", floating = false,
}: Props) {
  const { user } = useAuth();
  const learner = useStore((s) => s.learner);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Resolve the participant pair. The current user is one of them.
  const meIsProvider = !!learnerUserId && user?.id !== learnerUserId ? false : !!providerUserId;
  // Simpler: prefer explicit props
  const learnerId = learnerUserId ?? user?.id;
  const providerId = providerUserId ?? user?.id;
  const canChat = !!user && !!learnerId && !!providerId && learnerId !== providerId;

  useEffect(() => {
    if (!open || !canChat) return;
    let mounted = true;

    (async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("id, body, sender_user_id, created_at, via_boost_id")
        .eq("listing_id", listingId)
        .eq("learner_user_id", learnerId!)
        .eq("provider_user_id", providerId!)
        .order("created_at", { ascending: true });
      if (!mounted) return;
      if (error) { toast.error(error.message); return; }
      setMessages((data ?? []) as Msg[]);
      requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: 99999 }));
    })();

    const channel = supabase
      .channel(`chat-${listingId}-${learnerId}-${providerId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `listing_id=eq.${listingId}`,
        },
        (payload) => {
          const m = payload.new as any;
          if (m.learner_user_id !== learnerId || m.provider_user_id !== providerId) return;
          setMessages((prev) => prev.some((x) => x.id === m.id) ? prev : [...prev, m]);
          requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: 99999 }));
        },
      )
      .subscribe();

    return () => { mounted = false; supabase.removeChannel(channel); };
  }, [open, canChat, listingId, learnerId, providerId]);

  async function send() {
    const text = body.trim();
    if (!text || !user || !learnerId || !providerId) return;
    setSending(true);
    // If the current user is the learner, attribute this message to an active boost (if any).
    let viaBoostId: string | null = null;
    if (user.id === learnerId) {
      viaBoostId = await resolveActiveBoostId(listingId, {
        city: learner.city,
        dob: learner.dob,
        gender: (learner as any).gender,
      });
      // Also log a message_click event so insights pick it up
      await recordEvent(
        { id: listingId, providerUserId: providerId, city: learner.city, category: "", ageGroup: "All" } as any,
        "message_click",
        { userId: user.id, city: learner.city, dob: learner.dob, gender: (learner as any).gender },
      );
    }
    const { error } = await supabase.from("messages").insert({
      listing_id: listingId,
      listing_title: listingTitle,
      learner_user_id: learnerId,
      provider_user_id: providerId,
      sender_user_id: user.id,
      body: text,
      via_boost_id: viaBoostId,
    });
    setSending(false);
    if (error) { toast.error(error.message); return; }
    setBody("");
  }

  // Shared body content
  const chatBody = (
    <>
      {!user ? (
        <div className="flex-1 grid place-items-center p-6 text-center">
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Sign in to start a private chat with {otherPartyName}.</p>
            <Button asChild size="sm" className="gap-1.5"><Link to="/auth"><LogIn className="h-4 w-4" /> Sign in</Link></Button>
          </div>
        </div>
      ) : !providerUserId && !learnerUserId ? (
        <div className="flex-1 grid place-items-center p-6 text-center">
          <p className="text-sm text-muted-foreground">
            This provider hasn't enabled chat yet. They need to sign in and re-save the class so messages can be linked to their account.
          </p>
        </div>
      ) : (
        <>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {messages.length === 0 && (
              <p className="text-xs text-center text-muted-foreground py-8">
                No messages yet — say hi 👋
              </p>
            )}
            {messages.map((m) => {
              const mine = m.sender_user_id === user.id;
              return (
                <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-3 py-1.5 text-sm",
                      mine ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted rounded-bl-sm",
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words">{m.body}</p>
                    <p className={cn("text-[10px] mt-0.5", mine ? "text-primary-foreground/70" : "text-muted-foreground")}>
                      {new Date(m.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="border-t p-3 flex items-end gap-2">
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value.slice(0, 2000))}
              placeholder="Type a message…"
              rows={1}
              className="min-h-9 resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
              }}
            />
            <Button size="icon" onClick={send} disabled={sending || !body.trim()} aria-label="Send">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </>
  );

  if (floating) {
    return (
      <>
        {!open && (
          <button
            type="button"
            aria-label="Chat instantly"
            onClick={() => setOpen(true)}
            className="fixed bottom-4 left-4 z-50 flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground pl-2 pr-3 py-1.5 shadow-elegant hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 animate-fade-in"
          >
            <span className="grid place-items-center h-6 w-6 rounded-full bg-primary-foreground/20">
              <MessageCircle className="h-3.5 w-3.5" />
            </span>
            <span className="text-xs font-semibold whitespace-nowrap">Chat instantly</span>
          </button>
        )}

        {open && (
          <div
            className={cn(
              "fixed z-50 bg-background border rounded-2xl shadow-elegant flex flex-col overflow-hidden origin-bottom-left animate-scale-in",
              expanded
                ? "inset-2 sm:inset-6"
                : "bottom-4 left-4 right-4 h-[55vh] sm:right-auto sm:w-[380px] sm:h-[60vh]",
            )}
            style={{ transformOrigin: "bottom left" }}
          >
            <div className="flex items-center justify-between gap-2 border-b p-3 bg-muted/30">
              <div className="min-w-0 flex items-center gap-2">
                <span className="grid place-items-center h-7 w-7 rounded-full bg-primary text-primary-foreground shrink-0">
                  <MessageCircle className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">Chat with {otherPartyName}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{listingTitle}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  aria-label={expanded ? "Minimize" : "Expand"}
                  onClick={() => setExpanded((v) => !v)}
                  className="h-7 w-7 grid place-items-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                >
                  {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  aria-label="Close chat"
                  onClick={() => setOpen(false)}
                  className="h-7 w-7 grid place-items-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            {chatBody}
          </div>
        )}
      </>
    );
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant={triggerVariant} size="sm" className="gap-1.5">
          <MessageCircle className="h-4 w-4" /> {triggerLabel}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="border-b p-4">
          <SheetTitle className="text-base">Chat with {otherPartyName}</SheetTitle>
          <p className="text-xs text-muted-foreground line-clamp-1">{listingTitle}</p>
        </SheetHeader>
        {chatBody}
      </SheetContent>
    </Sheet>
  );
}
