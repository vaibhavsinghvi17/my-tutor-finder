import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Item {
  label: string;
  done: boolean;
}

interface Props {
  title?: string;
  items: Item[];
  onSetup?: () => void;
}

export function ProfileCompletion({ title = "Profile completion", items, onSetup }: Props) {
  const doneCount = items.filter((i) => i.done).length;
  const pct = Math.round((doneCount / items.length) * 100);
  const allDone = doneCount === items.length;

  if (allDone) return null;

  return (
    <Card
      className={cn(
        "p-3 space-y-3 border",
        allDone
          ? "bg-success/5 border-success/30"
          : "bg-gradient-to-br from-primary/5 via-card to-card border-primary/20",
      )}
    >
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "h-8 w-8 rounded-lg grid place-items-center shrink-0",
            allDone ? "bg-success/15 text-success" : "bg-primary/15 text-primary",
          )}
        >
          {allDone ? <Check className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold leading-tight">{title}</div>
          <div className="text-[11px] text-muted-foreground">
            {allDone ? "All set! You're ready to go." : `${doneCount} of ${items.length} essentials filled`}
          </div>
        </div>
        <div className="text-sm font-bold tabular-nums">{pct}%</div>
      </div>
      <Progress value={pct} className="h-1.5" />
      <div className="grid grid-cols-2 gap-1.5">
        {items.map((it) => (
          <div
            key={it.label}
            className={cn(
              "flex items-center gap-1.5 text-[11px] rounded-md px-2 py-1.5 border",
              it.done
                ? "bg-success/5 border-success/20 text-foreground"
                : "bg-muted/40 border-border/60 text-muted-foreground",
            )}
          >
            {it.done ? (
              <Check className="h-3 w-3 text-success shrink-0" />
            ) : (
              <AlertCircle className="h-3 w-3 text-warning shrink-0" />
            )}
            <span className="truncate">{it.label}</span>
          </div>
        ))}
      </div>
      {!allDone && onSetup && (
        <Button size="sm" className="w-full gap-1.5" onClick={onSetup}>
          <Sparkles className="h-3.5 w-3.5" /> Quick setup
        </Button>
      )}
    </Card>
  );
}
