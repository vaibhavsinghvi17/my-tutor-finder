// Razorpay loader + helpers — uses native plugin on Capacitor (iOS/Android),
// falls back to the hosted Checkout JS modal on the web.
import { Capacitor } from "@capacitor/core";

let scriptPromise: Promise<void> | null = null;

function loadWebScript(): Promise<void> {
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

export const loadRazorpay = loadWebScript;

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

type AnyOptions = SubscriptionCheckoutOptions | OrderCheckoutOptions;

async function openNative(options: AnyOptions): Promise<void> {
  // Dynamic import so the web bundle doesn't try to resolve native code.
  const { Checkout } = await import("capacitor-razorpay");
  const payload: any = {
    key: options.key,
    name: options.name ?? "Scholarr",
    description: options.description,
    image: options.image,
    prefill: options.prefill,
    theme: { color: options.theme?.color ?? "#6366f1" },
  };
  if ("subscription_id" in options) {
    payload.subscription_id = options.subscription_id;
  } else {
    payload.order_id = options.order_id;
    payload.amount = options.amount;
    payload.currency = options.currency;
  }
  try {
    const result: any = await Checkout.open(payload);
    const r = result?.response ?? result ?? {};
    if ("subscription_id" in options) {
      const sub = options as SubscriptionCheckoutOptions;
      if (r.razorpay_payment_id && r.razorpay_signature) {
        sub.handler({
          razorpay_payment_id: r.razorpay_payment_id,
          razorpay_subscription_id: r.razorpay_subscription_id ?? options.subscription_id,
          razorpay_signature: r.razorpay_signature,
        });
      } else {
        options.modal?.ondismiss?.();
      }
    } else {
      const ord = options as OrderCheckoutOptions;
      if (r.razorpay_payment_id && r.razorpay_signature) {
        ord.handler({
          razorpay_payment_id: r.razorpay_payment_id,
          razorpay_order_id: r.razorpay_order_id ?? options.order_id,
          razorpay_signature: r.razorpay_signature,
        });
      } else {
        options.modal?.ondismiss?.();
      }
    }
  } catch (err) {
    console.error("Native Razorpay error", err);
    options.modal?.ondismiss?.();
    throw err;
  }
}

async function openWeb(options: AnyOptions): Promise<void> {
  await loadWebScript();
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

export async function openRazorpay(options: AnyOptions): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    return openNative(options);
  }
  return openWeb(options);
}
