import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Languages, Plus, X } from "lucide-react";

const COMMON_LANGUAGES = [
  "English", "Hindi", "Kannada", "Tamil", "Telugu", "Marathi", "Bengali",
  "Gujarati", "Punjabi", "Malayalam", "Urdu", "Spanish", "French", "German",
  "Mandarin", "Arabic", "Japanese", "Portuguese",
];

interface Props {
  value: string[];
  onChange: (next: string[]) => void;
  label?: string;
}

export function LanguagesEditor({ value, onChange, label = "Languages of teaching" }: Props) {
  const [draft, setDraft] = useState("");

  function add(lang: string) {
    const v = lang.trim();
    if (!v) return;
    if (value.some((x) => x.toLowerCase() === v.toLowerCase())) return;
    onChange([...value, v]);
    setDraft("");
  }
  function remove(lang: string) {
    onChange(value.filter((x) => x !== lang));
  }

  const suggestions = COMMON_LANGUAGES.filter((l) => !value.includes(l));

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1.5"><Languages className="h-3.5 w-3.5" /> {label}</Label>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((l) => (
            <span key={l} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-primary/10 text-primary border border-primary/20">
              {l}
              <button type="button" onClick={() => remove(l)} className="hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, 30))}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(draft); } }}
          placeholder="Add a language and press Enter"
          className="h-9"
        />
        <Button type="button" size="sm" onClick={() => add(draft)} className="gap-1">
          <Plus className="h-3.5 w-3.5" /> Add
        </Button>
      </div>
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {suggestions.slice(0, 8).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => add(l)}
              className="text-[11px] px-2 py-0.5 rounded-full border bg-background hover:bg-muted transition-colors"
            >
              + {l}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
