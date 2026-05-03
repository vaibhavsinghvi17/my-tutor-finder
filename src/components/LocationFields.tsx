import { Combobox } from "./Combobox";
import { Label } from "@/components/ui/label";
import {
  COUNTRIES, getCities, getLocalities, getStates,
} from "@/lib/locations";

export interface LocationValue {
  country: string;
  state: string;
  city: string;
  area: string;
}

interface Props {
  value: LocationValue;
  onChange: (next: LocationValue) => void;
  /** When true, area (locality) is required-styling; default true */
  showArea?: boolean;
  hint?: string;
}

export function LocationFields({ value, onChange, showArea = true, hint }: Props) {
  const states = value.country ? getStates(value.country) : [];
  const cities = value.country && value.state ? getCities(value.country, value.state) : [];
  const localities = value.city ? getLocalities(value.city) : [];

  return (
    <div className="space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Country</Label>
          <Combobox
            value={value.country}
            onChange={(country) => onChange({ country, state: "", city: "", area: "" })}
            options={COUNTRIES.map((c) => c.name)}
            placeholder="Select country"
          />
        </div>
        <div className="space-y-1.5">
          <Label>State / Province</Label>
          <Combobox
            value={value.state}
            onChange={(state) => onChange({ ...value, state, city: "", area: "" })}
            options={states}
            placeholder={value.country ? "Select state" : "Pick a country first"}
            disabled={!value.country}
            emptyText={value.country ? "Type to add a custom state." : "Pick a country first."}
          />
        </div>
        <div className="space-y-1.5">
          <Label>City</Label>
          <Combobox
            value={value.city}
            onChange={(city) => onChange({ ...value, city, area: "" })}
            options={cities}
            placeholder={value.state ? "Select city" : "Pick a state first"}
            disabled={!value.state}
            emptyText={value.state ? "Type to add a custom city." : "Pick a state first."}
          />
        </div>
        {showArea && (
          <div className="space-y-1.5">
            <Label>Locality / area</Label>
            <Combobox
              value={value.area}
              onChange={(area) => onChange({ ...value, area })}
              options={localities}
              placeholder={value.city ? "Select locality" : "Pick a city first"}
              disabled={!value.city}
              emptyText={value.city ? "Type to add your locality." : "Pick a city first."}
            />
          </div>
        )}
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
