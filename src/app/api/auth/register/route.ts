import { NextRequest, NextResponse } from "next/server";
import { getUsersCollection } from "@/lib/db/mongodb";
import { hashPassword, signToken, setSessionCookie } from "@/lib/auth/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Name, email, and password are required." }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long." }, { status: 400 });
    }

    const users = await getUsersCollection();
    const existing = await users.findOne({ email: cleanEmail });

    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists. Please sign in." }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const now = new Date();

    const result = await users.insertOne({
      email: cleanEmail,
      passwordHash,
      name: name.trim(),
      plan: "free",
      dailyQuota: 50,
      createdAt: now,
      updatedAt: now,
    });

    const userProfile = {
      id: result.insertedId.toString(),
      email: cleanEmail,
      name: name.trim(),
      plan: "free",
      dailyQuota: 50,
    };

    const token = signToken({
      userId: userProfile.id,
      email: cleanEmail,
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
    console.error("Register API error:", err);
    return NextResponse.json({ error: err.message || "Failed to create account." }, { status: 500 });
  }
}
