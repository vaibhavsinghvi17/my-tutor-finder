import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, LocateFixed } from "lucide-react";
import { toast } from "sonner";

export interface ResolvedLocation {
  country?: string;
  state?: string;
  city?: string;
  area?: string;
  pinCode?: string;
  address?: string;
  mapsUrl?: string;
  lat?: number;
  lng?: number;
}

interface Props {
  onResolved: (loc: ResolvedLocation) => void;
  className?: string;
  label?: string;
}

/**
 * Uses browser geolocation + free BigDataCloud reverse geocoding
 * (no API key required) to autofill address fields.
 */
export function UseMyLocationButton({ onResolved, className, label }: Props) {
  const [loading, setLoading] = useState(false);

  async function handle() {
    if (!("geolocation" in navigator)) {
      toast.error("Geolocation not supported on this device");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude: lat, longitude: lng } = pos.coords;
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
          );
          if (!res.ok) throw new Error("reverse geocode failed");
          const d = await res.json();
          const country = d.countryName || "";
          const state = d.principalSubdivision || "";
          const city = d.city || d.locality || d.localityInfo?.administrative?.[3]?.name || "";
          const area = d.locality || d.localityInfo?.administrative?.[4]?.name || "";
          const pinCode = d.postcode || "";
          const addressParts = [
            d.localityInfo?.administrative?.slice(-1)?.[0]?.name,
            area,
            city,
          ].filter(Boolean);
          const address = addressParts.join(" | ");
          const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
          onResolved({ country, state, city, area, pinCode, address, mapsUrl, lat, lng });
          toast.success("Location detected");
        } catch (e) {
          toast.error("Couldn't resolve your location");
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setLoading(false);
        toast.error(err.code === err.PERMISSION_DENIED ? "Location permission denied" : "Couldn't get location");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }

  return (
    <Button type="button" size="sm" variant="outline" className={className} onClick={handle} disabled={loading}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
      <span className="ml-1.5">{label ?? "Use my current location"}</span>
    </Button>
  );
}
