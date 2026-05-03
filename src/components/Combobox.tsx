import { useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Props {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  disabled?: boolean;
  emptyText?: string;
  /** Show "Use this as custom value" when user types something not in list */
  allowCustom?: boolean;
}

export function Combobox({
  value, onChange, options, placeholder = "Select...", disabled,
  emptyText = "Nothing found.", allowCustom = true,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const trimmed = query.trim();
  const lower = trimmed.toLowerCase();
  const filtered = trimmed
    ? options.filter((o) => o.toLowerCase().includes(lower))
    : options;
  const exists = options.some((o) => o.toLowerCase() === lower);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal h-10",
            !value && "text-muted-foreground",
          )}
        >
          <span className="truncate">{value || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[--radix-popover-trigger-width] bg-popover z-50" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Type to search..."
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {filtered.length === 0 && !trimmed && (
              <CommandEmpty>{emptyText}</CommandEmpty>
            )}
            {filtered.length > 0 && (
              <CommandGroup>
                {filtered.slice(0, 80).map((opt) => (
                  <CommandItem
                    key={opt}
                    value={opt}
                    onSelect={() => {
                      onChange(opt);
                      setQuery("");
                      setOpen(false);
                    }}
                  >
                    <Check className={cn("mr-2 h-4 w-4", value === opt ? "opacity-100" : "opacity-0")} />
                    {opt}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {allowCustom && trimmed && !exists && (
              <CommandGroup heading="Add new">
                <CommandItem
                  value={`__add__${trimmed}`}
                  onSelect={() => {
                    onChange(trimmed);
                    setQuery("");
                    setOpen(false);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4 text-primary" />
                  Use "<span className="font-medium">{trimmed}</span>"
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
