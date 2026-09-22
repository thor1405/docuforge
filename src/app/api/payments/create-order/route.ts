import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/auth";
import { createOrder, PRICING_PLANS } from "@/lib/payments/razorpay";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    const body = await req.json().catch(() => ({}));
    const { planId = "pro", billingCycle = "annual" } = body;

    if (!["pro", "business"].includes(planId)) {
      return NextResponse.json({ error: "Invalid plan selected. Choose 'pro' or 'business'." }, { status: 400 });
    }

    const orderData = await createOrder(planId, billingCycle);

    return NextResponse.json({
      success: true,
      ...orderData,
      customer: {
        name: user?.name || "DocuForge Customer",
        email: user?.email || "user@example.com",
      },
    });
  } catch (err: any) {
    console.error("Create Razorpay order error:", err);
    return NextResponse.json({ error: err.message || "Failed to initiate checkout." }, { status: 500 });
  }
}
