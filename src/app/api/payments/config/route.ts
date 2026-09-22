import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/mongodb";
import { getRazorpayKeys } from "@/lib/payments/razorpay";

export async function GET(req: NextRequest) {
  try {
    const keys = await getRazorpayKeys();
    const isPlaceholder = keys.keyId === "rzp_test_DocuForge2026Key";
    const isTestMode = keys.keyId.startsWith("rzp_test_");
    const isLiveMode = keys.keyId.startsWith("rzp_live_");

    return NextResponse.json({
      success: true,
      keyId: isPlaceholder ? "" : keys.keyId,
      isConfigured: !isPlaceholder,
      isCustom: keys.isCustom,
      mode: isLiveMode ? "live" : isTestMode ? "test" : "placeholder",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { keyId, keySecret } = body;

    if (!keyId || !keySecret) {
      return NextResponse.json(
        { error: "Both Razorpay Key ID (e.g. rzp_test_... or rzp_live_...) and Key Secret are required." },
        { status: 400 }
      );
    }

    const trimmedKeyId = keyId.trim();
    const trimmedSecret = keySecret.trim();

    if (!trimmedKeyId.startsWith("rzp_test_") && !trimmedKeyId.startsWith("rzp_live_")) {
      return NextResponse.json(
        { error: "Invalid Razorpay Key ID format. It should start with 'rzp_test_' or 'rzp_live_'." },
        { status: 400 }
      );
    }

    // Save to MongoDB settings collection
    const db = await getDb();
    await db.collection("settings").updateOne(
      { key: "razorpay_credentials" },
      {
        $set: {
          key: "razorpay_credentials",
          keyId: trimmedKeyId,
          keySecret: trimmedSecret,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: `Razorpay ${trimmedKeyId.startsWith("rzp_live_") ? "Live" : "Test"} keys successfully connected and activated!`,
      keyId: trimmedKeyId,
      mode: trimmedKeyId.startsWith("rzp_live_") ? "live" : "test",
    });
  } catch (err: any) {
    console.error("Save Razorpay config error:", err);
    return NextResponse.json({ error: err.message || "Failed to save Razorpay configuration." }, { status: 500 });
  }
}
