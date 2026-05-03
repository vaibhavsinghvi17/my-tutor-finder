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
    <div className={`flex flex-wrap gap-2 ${className ?? ""}`}>
      <Button
        size={size}
        variant="outline"
        className="gap-1.5"
        disabled={!phone}
        onClick={() => {
          if (!phone) return;
          window.location.href = `tel:${digitsOnly(phone)}`;
        }}
      >
        <Phone className="h-4 w-4" /> Call
      </Button>
      <Button
        size={size}
        variant="outline"
        className="gap-1.5 text-[#25D366] border-[#25D366]/40 hover:bg-[#25D366]/10"
        disabled={!wa}
        onClick={() => {
          if (!wa) return;
          window.open(`https://wa.me/${digitsOnly(wa)}`, "_blank", "noopener,noreferrer");
        }}
      >
        <MessageCircle className="h-4 w-4" /> WhatsApp
      </Button>
      <Button
        size={size}
        variant="outline"
        className="gap-1.5"
        disabled={!mapsHref}
        onClick={() => {
          if (!mapsHref) { toast.info("No location set"); return; }
          window.open(mapsHref, "_blank", "noopener,noreferrer");
        }}
      >
        <MapPin className="h-4 w-4" /> Directions
      </Button>
    </div>
  );
}
