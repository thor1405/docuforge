import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ user: null, authenticated: false });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user._id?.toString(),
        email: user.email,
        name: user.name,
        plan: user.plan || "free",
        dailyQuota: user.dailyQuota || 50,
        createdAt: user.createdAt,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ user: null, authenticated: false, error: err.message });
  }
}
