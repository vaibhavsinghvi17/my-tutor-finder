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

function toIso(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

export function DatePicker({
  value, onChange, placeholder = "Pick a date",
  min, max, disabled, className, triggerClassName,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const date = fromIso(value);
  const minDate = fromIso(min || "");
  const maxDate = fromIso(max || "");

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
          <span className="truncate">{date ? format(date, "PPP") : placeholder}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-popover z-50" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => {
            if (d) {
              onChange(toIso(d));
              setOpen(false);
            } else {
              onChange("");
            }
          }}
          defaultMonth={date ?? maxDate ?? undefined}
          captionLayout="dropdown-buttons"
          fromYear={1920}
          toYear={maxDate ? maxDate.getFullYear() : new Date().getFullYear() + 10}
          disabled={(d) => {
            if (minDate && d < minDate) return true;
            if (maxDate && d > maxDate) return true;
            return false;
          }}
          initialFocus
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  );
}
