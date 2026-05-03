import { DAYS, Day, SlotKey, TIME_SLOTS } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  value: SlotKey[];
  onChange?: (next: SlotKey[]) => void;
  highlightSlots?: SlotKey[]; // shown but with different style (e.g. learner free time on listing)
  readOnly?: boolean;
  compact?: boolean;
}

function fmtHour(h: number) {
  const period = h >= 12 ? "PM" : "AM";
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}${period}`;
}

export function ScheduleGrid({ value, onChange, highlightSlots = [], readOnly, compact }: Props) {
  const valueSet = new Set(value);
  const highlightSet = new Set(highlightSlots);

  function toggle(day: Day, hour: number) {
    if (readOnly || !onChange) return;
    const key = `${day}-${hour}` as SlotKey;
    if (valueSet.has(key)) onChange(value.filter((k) => k !== key));
    else onChange([...value, key]);
  }

  return (
    <div className="overflow-auto max-h-[70vh] rounded-md border bg-background">
      <div className="min-w-[640px]">
        <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-1 p-1">
          <div className="sticky top-0 left-0 z-30 bg-background" />
          {DAYS.map((d) => (
            <div key={d} className="sticky top-0 z-20 bg-background text-xs font-semibold text-center text-muted-foreground py-1">
              {d}
            </div>
          ))}
          {TIME_SLOTS.map((h) => (
            <div key={h} className="contents">
              <div className="sticky left-0 z-10 bg-background text-[10px] text-muted-foreground text-right pr-2 self-center">
                {fmtHour(h)}
              </div>
              {DAYS.map((d) => {
                const key = `${d}-${h}` as SlotKey;
                const active = valueSet.has(key);
                const highlight = highlightSet.has(key);
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggle(d, h)}
                    className={cn(
                      "rounded-md border transition-all",
                      compact ? "h-6" : "h-8",
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
