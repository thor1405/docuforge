import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/auth";
import { getUsersCollection, getDb } from "@/lib/db/mongodb";
import { verifyPaymentSignature, PRICING_PLANS } from "@/lib/payments/razorpay";
import { ObjectId } from "mongodb";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    const body = await req.json().catch(() => ({}));
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId = "pro", billingCycle = "annual" } = body;

    if (!razorpay_order_id || !razorpay_payment_id) {
      return NextResponse.json({ error: "Missing Razorpay order or payment details." }, { status: 400 });
    }

    const isValid = await verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature || "simulated_success"
    );

    if (!isValid) {
      return NextResponse.json({ error: "Payment verification failed. Invalid cryptographic signature." }, { status: 400 });
    }

    const planConfig = PRICING_PLANS[planId] || PRICING_PLANS.pro;
    const now = new Date();

    // 1. Store payment record in MongoDB
    const db = await getDb();
    await db.collection("payments").insertOne({
      userId: user?._id?.toString() || "guest",
      userEmail: user?.email || "guest@example.com",
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      amount: billingCycle === "annual" ? planConfig.amountAnnual : planConfig.amountMonthly,
      currency: "INR",
      plan: planId,
      billingCycle,
      status: "paid",
      createdAt: now,
    });

    // 2. Upgrade user profile in MongoDB if authenticated
    let updatedUserProfile = null;
    if (user && user._id) {
      const users = await getUsersCollection();
      await users.updateOne(
        { _id: new ObjectId(user._id) },
        {
          $set: {
            plan: planId,
            dailyQuota: planConfig.dailyQuota,
            updatedAt: now,
          },
        }
      );

      const refreshedUser = await users.findOne({ _id: new ObjectId(user._id) });
      if (refreshedUser) {
        updatedUserProfile = {
          id: refreshedUser._id?.toString(),
          email: refreshedUser.email,
          name: refreshedUser.name,
          plan: refreshedUser.plan,
          dailyQuota: refreshedUser.dailyQuota,
        };
      }
    }

    const res = NextResponse.json({
      success: true,
      message: `Congratulations! Your account has been upgraded to ${planConfig.name}.`,
      plan: planId,
      user: updatedUserProfile,
    });

    if (updatedUserProfile && user?._id) {
      const { signToken, setSessionCookie } = await import("@/lib/auth/auth");
      const newToken = signToken({
        userId: user._id.toString(),
        email: updatedUserProfile.email,
        name: updatedUserProfile.name,
        plan: updatedUserProfile.plan,
      });
      setSessionCookie(res, newToken);
    }

    return res;
  } catch (err: any) {
    console.error("Verify payment error:", err);
    return NextResponse.json({ error: err.message || "Failed to verify payment." }, { status: 500 });
  }
}
