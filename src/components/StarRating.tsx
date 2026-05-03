import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface Props {
  value: number;             // current avg or selection
  onChange?: (v: number) => void; // if provided, interactive
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function StarRating({ value, onChange, size = "md", className }: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const display = hover ?? value;
  const sz = size === "sm" ? "h-3.5 w-3.5" : size === "lg" ? "h-6 w-6" : "h-4 w-4";
  const interactive = !!onChange;

  return (
    <div
      className={cn("inline-flex items-center gap-0.5", className)}
      onMouseLeave={() => setHover(null)}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = display >= n;
        const half = !filled && display >= n - 0.5;
        return (
          <button
            key={n}
            type="button"
            disabled={!interactive}
            onMouseEnter={() => interactive && setHover(n)}
            onClick={() => onChange?.(n)}
            className={cn(
              interactive ? "cursor-pointer transition-transform hover:scale-110" : "cursor-default",
            )}
          >
            <Star
              className={cn(
                sz,
                filled ? "fill-amber-400 text-amber-400"
                       : half ? "fill-amber-400/50 text-amber-400"
                              : "text-muted-foreground/40",
              )}
              strokeWidth={1.5}
            />
          </button>
        );
      })}
    </div>
  );
}
