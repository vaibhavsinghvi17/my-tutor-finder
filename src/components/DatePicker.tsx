import * as React from "react";
import { format, parse, isValid } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Props {
  /** ISO date string YYYY-MM-DD or empty */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** ISO date string lower bound (inclusive) */
  min?: string;
  /** ISO date string upper bound (inclusive) */
  max?: string;
  disabled?: boolean;
  className?: string;
  /** Tailwind height class for trigger button. Defaults to h-10. */
  triggerClassName?: string;
}

function fromIso(s: string): Date | undefined {
  if (!s) return undefined;
  const d = parse(s, "yyyy-MM-dd", new Date());
  return isValid(d) ? d : undefined;
}

const toIso = (d: Date) => format(d, "yyyy-MM-dd");

export function DatePicker({
  value, onChange, placeholder = "Pick a date",
  min, max, disabled, className, triggerClassName,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const date = fromIso(value);
  const minDate = fromIso(min || "");
  const maxDate = fromIso(max || "");

  const today = new Date();
  const fromYear = minDate ? minDate.getFullYear() : 1920;
  // Always allow scrolling at least 10 years ahead of today, even if max is set.
  const toYear = Math.max(maxDate?.getFullYear() ?? 0, today.getFullYear() + 10);

  const [viewMonth, setViewMonth] = React.useState<Date>(date ?? maxDate ?? today);
  const [typed, setTyped] = React.useState<string>(date ? format(date, "dd-MM-yyyy") : "");
  const [typedError, setTypedError] = React.useState(false);
  React.useEffect(() => {
    if (open) {
      setViewMonth(date ?? maxDate ?? today);
      setTyped(date ? format(date, "dd-MM-yyyy") : "");
      setTypedError(false);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleTypedChange(raw: string) {
    // Keep only digits, auto-insert dashes as DD-MM-YYYY
    const digits = raw.replace(/\D/g, "").slice(0, 8);
    let formatted = digits;
    if (digits.length > 4) formatted = `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
    else if (digits.length > 2) formatted = `${digits.slice(0, 2)}-${digits.slice(2)}`;
    setTyped(formatted);
    setTypedError(false);
    if (digits.length === 8) {
      const d = parse(formatted, "dd-MM-yyyy", new Date());
      if (!isValid(d)) { setTypedError(true); return; }
      if (minDate && d < minDate) { setTypedError(true); return; }
      if (maxDate && d > maxDate) { setTypedError(true); return; }
      onChange(toIso(d));
      setViewMonth(d);
    }
  }

  const years: number[] = [];
  for (let y = toYear; y >= fromYear; y--) years.push(y);
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            triggerClassName,
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          <span className="truncate text-sm">{date ? format(date, "d MMM yyyy") : placeholder}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2 bg-popover z-50" align="start">
        <div className="px-1 pb-2">
          <input
            type="text"
            inputMode="numeric"
            value={typed}
            onChange={(e) => handleTypedChange(e.target.value)}
            placeholder="DD-MM-YYYY"
            maxLength={10}
            className={cn(
              "h-8 w-full rounded-md border bg-background px-2 text-xs tracking-wider",
              typedError ? "border-destructive" : "border-input",
            )}
          />
          {typedError && (
            <div className="text-[10px] text-destructive mt-1">Invalid or out-of-range date</div>
          )}
        </div>
        <div className="flex items-center gap-1.5 px-1 pb-2">
          <select
            value={viewMonth.getMonth()}
            onChange={(e) => {
              const m = Number(e.target.value);
              setViewMonth(new Date(viewMonth.getFullYear(), m, 1));
            }}
            className="h-7 rounded-md border border-input bg-background px-1.5 text-xs"
          >
            {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
          </select>
          <select
            value={viewMonth.getFullYear()}
            onChange={(e) => {
              const y = Number(e.target.value);
              setViewMonth(new Date(y, viewMonth.getMonth(), 1));
            }}
            className="h-7 rounded-md border border-input bg-background px-1.5 text-xs"
          >
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <Calendar
          mode="single"
          selected={date}
          month={viewMonth}
          onMonthChange={setViewMonth}
          onSelect={(d) => {
            if (d) {
              onChange(toIso(d));
              setTyped(format(d, "dd-MM-yyyy"));
              setTypedError(false);
              setOpen(false);
            } else {
              onChange("");
              setTyped("");
            }
          }}
          disabled={(d) => {
            if (minDate && d < minDate) return true;
            if (maxDate && d > maxDate) return true;
            return false;
          }}
          showOutsideDays={false}
          initialFocus
          className={cn("p-0 pointer-events-auto")}
          classNames={{
            months: "flex flex-col",
            month: "space-y-1",
            caption: "hidden",
            table: "w-full border-collapse",
            head_row: "flex",
            head_cell: "text-muted-foreground rounded-md w-7 font-normal text-[0.65rem]",
            row: "flex w-full mt-0.5",
            cell: "h-7 w-7 text-center text-xs p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
            day: "h-7 w-7 p-0 font-normal rounded-md hover:bg-accent hover:text-accent-foreground aria-selected:opacity-100 text-xs",
            day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary",
            day_today: "bg-accent text-accent-foreground",
            day_disabled: "text-muted-foreground opacity-40",
            day_hidden: "invisible",
          }}
        />
        {(date || !value) && (
          <div className="flex items-center justify-between gap-2 pt-2 border-t mt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                const t = new Date();
                if (minDate && t < minDate) return;
                if (maxDate && t > maxDate) return;
                onChange(toIso(t));
                setOpen(false);
              }}
            >
              Today
            </Button>
            {date && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground"
                onClick={() => { onChange(""); setOpen(false); }}
              >
                Clear
              </Button>
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
