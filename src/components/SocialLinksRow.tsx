import { SocialLinks } from "@/lib/types";
import { Instagram, Facebook, Youtube, Twitter, Linkedin, Globe, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  socials?: SocialLinks;
  className?: string;
  size?: "sm" | "md";
}

const ITEMS: { key: keyof SocialLinks; icon: React.ComponentType<{ className?: string }>; label: string; color: string; build?: (v: string) => string }[] = [
  { key: "instagram", icon: Instagram, label: "Instagram", color: "from-pink-500 to-orange-500",
    build: (v) => v.startsWith("http") ? v : `https://instagram.com/${v.replace(/^@/, "")}` },
  { key: "facebook", icon: Facebook, label: "Facebook", color: "from-blue-600 to-blue-800",
    build: (v) => v.startsWith("http") ? v : `https://facebook.com/${v}` },
  { key: "youtube", icon: Youtube, label: "YouTube", color: "from-red-500 to-red-700",
    build: (v) => v.startsWith("http") ? v : `https://youtube.com/@${v.replace(/^@/, "")}` },
  { key: "twitter", icon: Twitter, label: "X / Twitter", color: "from-slate-700 to-slate-900",
    build: (v) => v.startsWith("http") ? v : `https://x.com/${v.replace(/^@/, "")}` },
  { key: "linkedin", icon: Linkedin, label: "LinkedIn", color: "from-sky-600 to-blue-700",
    build: (v) => v.startsWith("http") ? v : `https://linkedin.com/in/${v}` },
  { key: "whatsapp", icon: MessageCircle, label: "WhatsApp", color: "from-emerald-500 to-green-600",
    build: (v) => v.startsWith("http") ? v : `https://wa.me/${v.replace(/[^\d]/g, "")}` },
  { key: "website", icon: Globe, label: "Website", color: "from-indigo-500 to-purple-600",
    build: (v) => v.startsWith("http") ? v : `https://${v}` },
];

export function SocialLinksRow({ socials, className, size = "md" }: Props) {
  if (!socials) return null;
  const present = ITEMS.filter((i) => socials[i.key]?.trim());
  if (present.length === 0) return null;
  const sz = size === "sm" ? "h-7 w-7" : "h-9 w-9";
  const ic = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {present.map(({ key, icon: Icon, label, color, build }) => {
        const raw = socials[key]!.trim();
        const href = build ? build(raw) : raw;
        return (
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            title={label}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "rounded-lg bg-gradient-to-br grid place-items-center text-white shadow-sm hover:scale-110 transition-transform ring-1 ring-white/30",
              sz, color,
            )}
            style={{ boxShadow: "0 2px 6px -1px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.4)" }}
          >
            <Icon className={ic} />
          </a>
        );
      })}
    </div>
  );
}
