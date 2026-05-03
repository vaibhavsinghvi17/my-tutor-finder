import { useEffect, useState } from "react";
import { FxRates, getFxRates } from "./currency";

let cached: FxRates | null = null;
let pending: Promise<FxRates | null> | null = null;

export function useFxRates(): FxRates | null {
  const [rates, setRates] = useState<FxRates | null>(cached);

  useEffect(() => {
    if (cached) { setRates(cached); return; }
    if (!pending) pending = getFxRates();
    let alive = true;
    pending.then((r) => {
      if (r) cached = r;
      if (alive) setRates(r);
    });
    return () => { alive = false; };
  }, []);

  return rates;
}
