import { DAYS, Day, SlotKey, TIME_SLOTS } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  value: SlotKey[];
  onChange?: (next: SlotKey[]) => void;
  highlightSlots?: SlotKey[]; // shown but with different style (e.g. learner free time on listing)
  readOnly?: boolean;
  compact?: boolean;
  /** Number of hours each bracket spans (1-5). Defaults to 1. */
  slotHours?: number;
}

function fmtHour(h: number) {
  const period = h >= 12 ? "PM" : "AM";
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}${period}`;
}

export function ScheduleGrid({ value, onChange, highlightSlots = [], readOnly, compact, slotHours = 1 }: Props) {
  const span = Math.max(1, Math.min(5, Math.round(slotHours)));
  const valueSet = new Set(value);
  const highlightSet = new Set(highlightSlots);

  // Generate display hours stepping by `span`, but stop so brackets fit within range
  const lastHour = TIME_SLOTS[TIME_SLOTS.length - 1] + 1; // exclusive end
  const displayHours: number[] = [];
  for (let h = TIME_SLOTS[0]; h + span <= lastHour; h += span) displayHours.push(h);

  function toggle(day: Day, hour: number) {
    if (readOnly || !onChange) return;
    const keys: SlotKey[] = [];
    for (let k = 0; k < span; k++) keys.push(`${day}-${hour + k}` as SlotKey);
    const allActive = keys.every((k) => valueSet.has(k));
    if (allActive) onChange(value.filter((k) => !keys.includes(k)));
    else {
      const next = new Set(value);
      keys.forEach((k) => next.add(k));
      onChange(Array.from(next));
    }
  }

  function fmtRange(h: number) {
    return span === 1 ? fmtHour(h) : `${fmtHour(h)}–${fmtHour(h + span)}`;
  }

  return (
    <div className="overflow-auto max-h-[70vh] rounded-md border bg-background">
      <div className="min-w-[640px]">
        <div className={cn("grid gap-1 p-1", span > 1 ? "grid-cols-[80px_repeat(7,1fr)]" : "grid-cols-[60px_repeat(7,1fr)]")}>
          <div className="sticky top-0 left-0 z-30 bg-background" />
          {DAYS.map((d) => (
            <div key={d} className="sticky top-0 z-20 bg-background text-xs font-semibold text-center text-muted-foreground py-1">
              {d}
            </div>
          ))}
          {displayHours.map((h) => (
            <div key={h} className="contents">
              <div className="sticky left-0 z-10 bg-background text-[10px] text-muted-foreground text-right pr-2 self-center">
                {fmtRange(h)}
              </div>
              {DAYS.map((d) => {
                const keys: SlotKey[] = [];
                for (let k = 0; k < span; k++) keys.push(`${d}-${h + k}` as SlotKey);
                const active = keys.every((k) => valueSet.has(k));
                const highlight = keys.some((k) => highlightSet.has(k));
                return (
                  <button
                    key={`${d}-${h}`}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggle(d, h)}
                    className={cn(
                      "rounded-md border transition-all",
                      compact ? "h-6" : "h-8",
                      span > 1 && (compact ? "h-7" : "h-10"),
                      active && "bg-primary border-primary shadow-sm",
                      !active && highlight && "bg-secondary/20 border-secondary",
                      !active && !highlight && "bg-muted/40 border-transparent hover:bg-muted",
                      readOnly && "cursor-default",
                    )}
                  />
                );
              })}
            </div>
          ))}
        </div>
        {(value.length > 0 || highlightSlots.length > 0) && (
          <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
            {value.length > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-primary inline-block" /> Class times
              </span>
            )}
            {highlightSlots.length > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-secondary/40 border border-secondary inline-block" />
                Your free time
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function slotsToText(slots: SlotKey[]): string {
  if (!slots.length) return "No times set";
  const byDay = new Map<Day, number[]>();
  slots.forEach((s) => {
    const [d, h] = s.split("-") as [Day, string];
    const list = byDay.get(d) ?? [];
    list.push(parseInt(h, 10));
    byDay.set(d, list);
  });
  return DAYS.filter((d) => byDay.has(d))
    .map((d) => {
      const hrs = (byDay.get(d) ?? []).sort((a, b) => a - b).map(fmtHour).join(", ");
      return `${d} ${hrs}`;
    })
    .join(" • ");
}
