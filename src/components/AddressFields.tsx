import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}

/**
 * Address stored as a single string with up to 4 lines joined by " | ":
 *   House/Flat No. (required) | Street Address | Landmark | Area
 */
export function AddressFields({ value, onChange, hint }: Props) {
  const parts = (value || "").split(" | ");
  const lines = [parts[0] ?? "", parts[1] ?? "", parts[2] ?? "", parts[3] ?? ""];

  function update(i: number, v: string) {
    const next = [...lines];
    next[i] = v.slice(0, 120);
    while (next.length > 1 && !next[next.length - 1]) next.pop();
    onChange(next.join(" | "));
  }

  const fields: { label: string; placeholder: string; required?: boolean }[] = [
    { label: "House / Flat No.", placeholder: "e.g. Flat 302, Tower B", required: true },
    { label: "Street Name", placeholder: "e.g. MG Road, 4th Cross", required: true },
    { label: "Landmark", placeholder: "e.g. Near Central Park" },
    { label: "Area", placeholder: "e.g. Indiranagar, 560038" },
  ];

  return (
    <div className="space-y-2">
      {fields.map((f, i) => (
        <div key={i} className="space-y-1.5">
          <Label>
            {f.label}{" "}
            {f.required ? (
              <span className="text-destructive">*</span>
            ) : (
              <span className="text-muted-foreground font-normal">(optional)</span>
            )}
          </Label>
          <Input
            value={lines[i]}
            onChange={(e) => update(i, e.target.value)}
            placeholder={f.placeholder}
            className="placeholder:text-xs"
          />
        </div>
      ))}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
