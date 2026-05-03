import { Button } from "@/components/ui/button";
import { Phone, MessageCircle, MapPin } from "lucide-react";
import { ContactInfo } from "@/lib/types";
import { toast } from "sonner";

interface Props {
  contact?: ContactInfo;
  fallbackAddress?: string;
  size?: "sm" | "default";
  className?: string;
}

function digitsOnly(s: string) {
  return s.replace(/[^\d+]/g, "").replace(/^\+?/, "");
}

export function ContactActions({ contact, fallbackAddress, size = "default", className }: Props) {
  const phone = contact?.phone?.trim();
  const wa = contact?.whatsapp?.trim() || phone;
  const mapsTarget = contact?.mapsUrl?.trim() || fallbackAddress?.trim();

  const mapsHref = mapsTarget
    ? (mapsTarget.startsWith("http")
      ? mapsTarget
      : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapsTarget)}`)
    : "";

  return (
    <div className={`flex flex-nowrap gap-1.5 w-full ${className ?? ""}`}>
      <Button
        size={size}
        variant="outline"
        className="flex-1 min-w-0 gap-1 px-2 text-xs"
        disabled={!phone}
        onClick={() => {
          if (!phone) return;
          window.location.href = `tel:${digitsOnly(phone)}`;
        }}
      >
        <Phone className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">Call</span>
      </Button>
      <Button
        size={size}
        variant="outline"
        className="flex-1 min-w-0 gap-1 px-2 text-xs text-[#25D366] border-[#25D366]/40 hover:bg-[#25D366]/10"
        disabled={!wa}
        onClick={() => {
          if (!wa) return;
          window.open(`https://wa.me/${digitsOnly(wa)}`, "_blank", "noopener,noreferrer");
        }}
      >
        <MessageCircle className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">WhatsApp</span>
      </Button>
      <Button
        size={size}
        variant="outline"
        className="flex-1 min-w-0 gap-1 px-2 text-xs"
        disabled={!mapsHref}
        onClick={() => {
          if (!mapsHref) { toast.info("No location set"); return; }
          window.open(mapsHref, "_blank", "noopener,noreferrer");
        }}
      >
        <MapPin className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">Directions</span>
      </Button>
    </div>
  );
}
