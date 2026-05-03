import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}

/**
 * Address is stored as a single string with 3 lines joined by " | ":
 *   line1 (required) | line2 (optional) | line3 (optional)
 * Standard format: house number / street, landmark, area / postal code.
 */
export function AddressFields({ value, onChange, hint }: Props) {
  const parts = (value || "").split(" | ");
  const line1 = parts[0] ?? "";
  const line2 = parts[1] ?? "";
  const line3 = parts[2] ?? "";

  function update(i: number, v: string) {
    const next = [line1, line2, line3];
    next[i] = v.slice(0, 120);
    // trim trailing empties so we don't store "a |  | "
    while (next.length > 1 && !next[next.length - 1]) next.pop();
    onChange(next.join(" | "));
  }

  return (
    <div className="space-y-2">
      <div className="space-y-1.5">
        <Label>
          Address line 1 <span className="text-destructive">*</span>
        </Label>
        <Input
          value={line1}
          onChange={(e) => update(0, e.target.value)}
          placeholder="House / flat number, street"
        />
      </div>
      <div className="grid sm:grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label>
            Landmark <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Input
            value={line2}
            onChange={(e) => update(1, e.target.value)}
            placeholder="Near park, opposite school..."
          />
        </div>
        <div className="space-y-1.5">
          <Label>
            Area / postal code <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Input
            value={line3}
            onChange={(e) => update(2, e.target.value)}
            placeholder="Pin / ZIP code"
          />
        </div>
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
