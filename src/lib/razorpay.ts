// Razorpay Checkout loader + helpers

let scriptPromise: Promise<void> | null = null;

export function loadRazorpay(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("No window"));
  if ((window as any).Razorpay) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      scriptPromise = null;
      reject(new Error("Failed to load Razorpay"));
    };
    document.head.appendChild(s);
  });
  return scriptPromise;
}

export interface RazorpayCommonOptions {
  key: string;
  name?: string;
  description?: string;
  image?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
}

export interface SubscriptionCheckoutOptions extends RazorpayCommonOptions {
  subscription_id: string;
  handler: (resp: {
    razorpay_payment_id: string;
    razorpay_subscription_id: string;
    razorpay_signature: string;
  }) => void;
}

export interface OrderCheckoutOptions extends RazorpayCommonOptions {
  order_id: string;
  amount: number; // paise
  currency: string;
  handler: (resp: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
}

export async function openRazorpay(
  options: SubscriptionCheckoutOptions | OrderCheckoutOptions,
): Promise<void> {
  await loadRazorpay();
  const rzp = new (window as any).Razorpay({
    name: "Scholarr",
    theme: { color: "#6366f1" },
    ...options,
  });
  rzp.on("payment.failed", (resp: any) => {
    console.error("Razorpay payment failed", resp?.error);
  });
  rzp.open();
}
