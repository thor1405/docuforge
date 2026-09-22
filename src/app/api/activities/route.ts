import { NextRequest, NextResponse } from "next/server";
import { getActivitiesCollection } from "@/lib/db/mongodb";
import { getSessionUser } from "@/lib/auth/auth";
import { ObjectId } from "mongodb";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    const activities = await getActivitiesCollection();

    const query = user ? { $or: [{ userId: user._id?.toString() }, { userEmail: user.email }] } : {};
    
    // Fetch recent 50 activities sorted by newest first
    const list = await activities
      .find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    const formatted = list.map((item) => ({
      id: item._id?.toString(),
      name: item.documentName,
      toolUsed: item.toolName || item.toolId,
      originalSize: item.originalSize || 0,
      resultSize: item.resultSize || item.originalSize || 0,
      bandwidthSaved: item.bandwidthSaved || 0,
      processingTimeMs: item.processingTimeMs || 300,
      status: item.status || "completed",
      createdAt: item.createdAt,
    }));

    return NextResponse.json({ success: true, activities: formatted });
  } catch (err: any) {
    console.error("Fetch activities error:", err);
    return NextResponse.json({ success: false, error: err.message, activities: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    const body = await req.json();
    const { documentName, toolId, toolName, originalSize, resultSize, bandwidthSaved, processingTimeMs, status } = body;

    if (!documentName || !toolId) {
      return NextResponse.json({ error: "documentName and toolId are required." }, { status: 400 });
    }

    const activities = await getActivitiesCollection();
    const now = new Date();

    const result = await activities.insertOne({
      userId: user?._id?.toString(),
      userEmail: user?.email,
      documentName,
      toolId,
      toolName: toolName || toolId,
      originalSize: Number(originalSize) || 0,
      resultSize: Number(resultSize) || Number(originalSize) || 0,
      bandwidthSaved: Number(bandwidthSaved) || 0,
      processingTimeMs: Number(processingTimeMs) || 250,
      status: status || "completed",
      createdAt: now,
    });

    return NextResponse.json({
      success: true,
      activityId: result.insertedId.toString(),
      message: "Activity logged in MongoDB.",
    });
  } catch (err: any) {
    console.error("Log activity error:", err);
    return NextResponse.json({ error: err.message || "Failed to log activity." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Activity ID is required." }, { status: 400 });
    }

    const activities = await getActivitiesCollection();
    await activities.deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({ success: true, message: "Activity removed from history." });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete activity." }, { status: 500 });
  }
}
