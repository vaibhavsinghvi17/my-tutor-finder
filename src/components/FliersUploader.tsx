import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { ImagePlus, X } from "lucide-react";
import { toast } from "sonner";

interface Props {
  value: string[];
  onChange: (next: string[]) => void;
  max?: number;
}

const MAX_BYTES = 1_500_000; // ~1.5 MB per image after compression

async function fileToCompressedDataUrl(file: File): Promise<string> {
  const dataUrl: string = await new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = () => rej(r.error);
    r.readAsDataURL(file);
  });
  // Compress via canvas
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = dataUrl;
  });
  const maxDim = 1280;
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, w, h);
  let q = 0.85;
  let out = canvas.toDataURL("image/jpeg", q);
  while (out.length * 0.75 > MAX_BYTES && q > 0.4) {
    q -= 0.1;
    out = canvas.toDataURL("image/jpeg", q);
  }
  return out;
}

export function FliersUploader({ value, onChange, max = 4 }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const remaining = Math.max(0, max - value.length);

  async function handleFiles(files: FileList | null) {
    if (!files || !files.length) return;
    const arr = Array.from(files).slice(0, remaining);
    const next = [...value];
    for (const f of arr) {
      if (!f.type.startsWith("image/")) { toast.error(`${f.name} is not an image`); continue; }
      try {
        const url = await fileToCompressedDataUrl(f);
        next.push(url);
      } catch {
        toast.error(`Could not read ${f.name}`);
      }
    }
    onChange(next.slice(0, max));
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {value.map((src, i) => (
          <div key={i} className="relative aspect-[3/4] rounded-md overflow-hidden border bg-muted">
            <img src={src} alt={`Flier ${i + 1}`} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(value.filter((_, idx) => idx !== i))}
              className="absolute top-1 right-1 h-6 w-6 grid place-items-center rounded-full bg-background/90 hover:bg-background shadow"
              aria-label="Remove flier"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {remaining > 0 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="aspect-[3/4] rounded-md border-2 border-dashed border-muted-foreground/30 hover:border-primary/60 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary transition-colors"
          >
            <ImagePlus className="h-5 w-5" />
            <span className="text-[11px] font-medium">Add flier</span>
          </button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Upload up to {max} images (posters, sample work, venue photos). {value.length}/{max} added.
      </p>
    </div>
  );
}
