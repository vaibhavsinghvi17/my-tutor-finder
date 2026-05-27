import { FreeTimeBlock, DAYS, Day } from "@/lib/types";
import { blockSummary, fmtHour, newBlock } from "@/lib/timeUtils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Clock } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  value: FreeTimeBlock[];
  onChange: (next: FreeTimeBlock[]) => void;
}

export function FreeTimeEditor({ value, onChange }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);

  function add() {
    const b = newBlock();
    onChange([...value, b]);
    setEditingId(b.id);
  }
  function remove(id: string) {
    onChange(value.filter((b) => b.id !== id));
    if (editingId === id) setEditingId(null);
  }
  function update(id: string, patch: Partial<FreeTimeBlock>) {
    onChange(value.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }

  return (
    <div className="space-y-2.5">
      {value.length === 0 && (
        <p className="text-sm text-muted-foreground italic">No free-time blocks yet.</p>
      )}

      {value.map((b) => {
        const isEditing = editingId === b.id;
        return (
          <Card key={b.id} className="p-3 bg-muted/30">
            {!isEditing ? (
              <div className="flex items-center gap-2 flex-wrap">
                <Clock className="h-4 w-4 text-primary shrink-0" />
                <div className="flex-1 text-sm font-medium min-w-[140px]">{blockSummary(b)}</div>
                <Button size="sm" variant="ghost" onClick={() => setEditingId(b.id)} className="gap-1">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
                <Button size="sm" variant="ghost" onClick={() => remove(b.id)} className="text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <div className="text-xs font-medium mb-1.5">Days</div>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const allSelected = DAYS.every((d) => b.days.includes(d));
                        update(b.id, { days: allSelected ? [] : [...DAYS] });
                      }}
                      className={cn(
                        "px-2.5 py-1 rounded-md text-xs font-medium border transition-colors",
                        DAYS.every((d) => b.days.includes(d))
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background hover:bg-muted",
                      )}
                    >
                      Everyday
                    </button>
                    {DAYS.map((d) => {
                      const active = b.days.includes(d);
                      return (
                        <button
                          key={d}
                          type="button"
                          onClick={() =>
                            update(b.id, {
                              days: active ? b.days.filter((x) => x !== d) : [...b.days, d as Day],
                            })
                          }
                          className={cn(
                            "px-2.5 py-1 rounded-md text-xs font-medium border transition-colors",
                            active
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background hover:bg-muted",
                          )}
                        >
                          {d}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-xs font-medium mb-1.5">From</div>
                    <Select
                      value={String(b.fromHour)}
                      onValueChange={(v) => {
                        const n = parseInt(v, 10);
                        update(b.id, { fromHour: n, toHour: Math.max(b.toHour, n + 1) });
                      }}
                    >
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => i).map((h) => (
                          <SelectItem key={h} value={String(h)}>{fmtHour(h)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <div className="text-xs font-medium mb-1.5">To</div>
                    <Select
                      value={String(b.toHour)}
                      onValueChange={(v) => update(b.id, { toHour: parseInt(v, 10) })}
                    >
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => i + 1)
                          .filter((h) => h > b.fromHour)
                          .map((h) => (
                            <SelectItem key={h} value={String(h)}>{fmtHour(h)}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="ghost" onClick={() => remove(b.id)} className="text-destructive gap-1">
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </Button>
                  <Button size="sm" onClick={() => setEditingId(null)}>Done</Button>
                </div>
              </div>
            )}
          </Card>
        );
      })}

      <Button variant="outline" size="sm" onClick={add} className="gap-1.5 w-full">
        <Plus className="h-4 w-4" /> Add free-time block
      </Button>
    </div>
  );
}
