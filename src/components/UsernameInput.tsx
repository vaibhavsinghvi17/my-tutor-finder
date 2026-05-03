import { Input } from "@/components/ui/input";
import { AtSign, CheckCircle2, AlertCircle } from "lucide-react";
import { isUsernameTaken, slugifyUsername } from "@/lib/usernames";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (next: string) => void;
  /** Stable identifier for the owning profile so its own current username is ignored in the taken check. */
  ownerKey?: string;
  placeholder?: string;
  className?: string;
}

/**
 * Username input with live validation:
 *  - normalizes to slug (lowercase, allowed chars)
 *  - shows error if too short or already taken by another profile
 */
export function UsernameInput({ value, onChange, ownerKey, placeholder = "e.g. priya.sharma", className }: Props) {
  const state = useStore((s) => s);
  const slug = slugifyUsername(value);
  const tooShort = value.length > 0 && slug.length < 3;
  // ignoreOwner allows the user's current handle to remain valid while editing
  const taken = slug.length >= 3 && isUsernameTaken(state, slug, ownerKey ? value : undefined);
  const error = tooShort
    ? "At least 3 characters"
    : taken
    ? "Already taken"
    : null;
  const ok = !error && slug.length >= 3;

  return (
    <div className="space-y-1">
      <div className="relative">
        <AtSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          value={value}
          onChange={(e) =>
            onChange(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, "").slice(0, 24))
          }
          placeholder={placeholder}
          aria-invalid={!!error}
          className={cn(
            "h-9 pl-8",
            error && "border-destructive focus-visible:ring-destructive",
            className,
          )}
        />
      </div>
      {error ? (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" /> {error}
        </p>
      ) : ok ? (
        <p className="text-xs text-primary flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" /> @{slug} is available
        </p>
      ) : null}
    </div>
  );
}
