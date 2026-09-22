import { NextRequest, NextResponse } from "next/server";
import { getUsersCollection } from "@/lib/db/mongodb";
import { comparePassword, signToken, setSessionCookie } from "@/lib/auth/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const users = await getUsersCollection();
    const user = await users.findOne({ email: cleanEmail });

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const userProfile = {
      id: user._id?.toString(),
      email: user.email,
      name: user.name,
      plan: user.plan || "free",
      dailyQuota: user.dailyQuota || 50,
    };

    const token = signToken({
      userId: userProfile.id!,
      email: userProfile.email,
      name: userProfile.name,
      plan: userProfile.plan,
    });

    const response = NextResponse.json({
      success: true,
      user: userProfile,
      token,
    });

    setSessionCookie(response, token);
    return response;
  } catch (err: any) {
    console.error("Login API error:", err);
    return NextResponse.json({ error: err.message || "Failed to sign in." }, { status: 500 });
  }
}
