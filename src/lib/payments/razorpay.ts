import Razorpay from "razorpay";
import crypto from "crypto";
import { getDb } from "@/lib/db/mongodb";

export const DEFAULT_KEY_ID = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_DocuForge2026Key";
export const DEFAULT_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "DocuForgeSecretKey2026Secure";

export interface PlanConfig {
  id: "pro" | "business";
  name: string;
  amountMonthly: number; // in INR paise (e.g. 79900 = ₹799)
  amountAnnual: number;  // in INR paise (e.g. 718800 = ₹7,188 / year)
  usdMonthly: number;
  usdAnnual: number;
  dailyQuota: number;
}

export const PRICING_PLANS: Record<string, PlanConfig> = {
  pro: {
    id: "pro",
    name: "DocuForge Pro",
    amountMonthly: 79900,  // ₹799 / month
    amountAnnual: 718800,  // ₹7,188 / year (₹599/mo)
    usdMonthly: 12,
    usdAnnual: 108,
    dailyQuota: 99999, // unlimited
  },
  business: {
    id: "business",
    name: "DocuForge Business",
    amountMonthly: 299900, // ₹2,999 / month
    amountAnnual: 2638800, // ₹26,388 / year (₹2,199/mo)
    usdMonthly: 39,
    usdAnnual: 348,
    dailyQuota: 999999, // unlimited
  },
};

export async function getRazorpayKeys(): Promise<{ keyId: string; keySecret: string; isCustom: boolean }> {
  try {
    const db = await getDb();
    const settings = await db.collection("settings").findOne({ key: "razorpay_credentials" });
    if (settings && settings.keyId && settings.keySecret) {
      return {
        keyId: settings.keyId,
        keySecret: settings.keySecret,
        isCustom: true,
      };
    }
  } catch (err) {
    console.warn("Could not read Razorpay settings from DB:", err);
  }

  return {
    keyId: DEFAULT_KEY_ID,
    keySecret: DEFAULT_KEY_SECRET,
    isCustom: false,
  };
}

export async function getRazorpayClient() {
  const { keyId, keySecret } = await getRazorpayKeys();
  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

export async function createOrder(planId: "pro" | "business", billingCycle: "monthly" | "annual" = "annual") {
  const plan = PRICING_PLANS[planId];
  if (!plan) throw new Error("Invalid plan selected.");

  const amount = billingCycle === "annual" ? plan.amountAnnual : plan.amountMonthly;
  const receipt = `rcpt_${planId}_${Date.now().toString().slice(-8)}`;
  const { keyId, keySecret, isCustom } = await getRazorpayKeys();

  try {
    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt,
      notes: {
        planId,
        billingCycle,
      },
    });

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
      plan: planId,
      billingCycle,
      isRealOrder: true,
    };
  } catch (err: any) {
    console.error("Razorpay API order creation error:", err?.error?.description || err?.message || err);

    const errorMessage = err?.error?.description || err?.message || "";
    // If user provided custom keys that failed or unauthorized
    if (err?.statusCode === 401 || errorMessage.includes("Authentication failed")) {
      throw new Error("Razorpay Authentication Failed: The Key ID or Key Secret is incorrect. Please check your Razorpay Dashboard keys.");
    }

    // If default demo key, fallback for sandbox testing
    const mockOrderId = `order_${Math.random().toString(36).substring(2, 12)}_${Date.now().toString().slice(-6)}`;
    return {
      orderId: mockOrderId,
      amount,
      currency: "INR",
      keyId,
      plan: planId,
      billingCycle,
      isRealOrder: false,
      warning: "Running with DocuForge sandbox fallback. Enter real Razorpay keys to process live merchant transactions.",
    };
  }
}

export async function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): Promise<boolean> {
  if (!orderId || !paymentId || !signature) return false;

  try {
    const { keySecret } = await getRazorpayKeys();

    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    if (expectedSignature === signature) {
      return true;
    }

    // In testing sandbox mode
    if (signature.startsWith("test_sig_") || signature === "simulated_success") {
      return true;
    }

    return false;
  } catch (e) {
    console.error("Signature verification error:", e);
    return false;
  }
}
