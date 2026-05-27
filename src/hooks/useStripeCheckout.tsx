import { useState, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { StripeEmbeddedCheckout, type CheckoutInvokeBody } from "@/components/StripeEmbeddedCheckout";

export function useStripeCheckout() {
  const [options, setOptions] = useState<CheckoutInvokeBody | null>(null);

  const openCheckout = useCallback((opts: CheckoutInvokeBody) => setOptions(opts), []);
  const closeCheckout = useCallback(() => setOptions(null), []);

  const checkoutElement = (
    <Dialog open={!!options} onOpenChange={(o) => { if (!o) closeCheckout(); }}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden max-h-[calc(100dvh-2rem)]">
        <div className="overflow-y-auto max-h-[calc(100dvh-2rem)]">
          {options && <StripeEmbeddedCheckout {...options} />}
        </div>
      </DialogContent>
    </Dialog>
  );

  return { openCheckout, closeCheckout, isOpen: !!options, checkoutElement };
}
