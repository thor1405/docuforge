import { NextRequest, NextResponse } from "next/server";
import { getWorkflowsCollection } from "@/lib/db/mongodb";
import { getSessionUser } from "@/lib/auth/auth";
import { ObjectId } from "mongodb";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    const workflows = await getWorkflowsCollection();

    const query = user ? { $or: [{ userId: user._id?.toString() }, { userEmail: user.email }] } : {};
    const list = await workflows.find(query).sort({ updatedAt: -1 }).toArray();

    const formatted = list.map((item) => ({
      id: item._id?.toString(),
      name: item.name,
      description: item.description,
      steps: item.steps || [],
      stepsCount: item.stepsCount || (item.steps ? item.steps.length : 0),
      runsCount: item.runsCount || 0,
      lastRunAt: item.lastRunAt,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    return NextResponse.json({ success: true, workflows: formatted });
  } catch (err: any) {
    console.error("Fetch saved workflows error:", err);
    return NextResponse.json({ success: false, error: err.message, workflows: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    const body = await req.json();
    const { name, description, steps } = body;

    if (!name || !steps || !Array.isArray(steps)) {
      return NextResponse.json({ error: "Name and steps array are required." }, { status: 400 });
    }

    const workflows = await getWorkflowsCollection();
    const now = new Date();

    const result = await workflows.insertOne({
      userId: user?._id?.toString(),
      userEmail: user?.email,
      name: name.trim(),
      description: description || steps.map((s: any) => s.title || s.type).join(" → "),
      steps,
      stepsCount: steps.length,
      runsCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({
      success: true,
      workflowId: result.insertedId.toString(),
      message: "Workflow saved to MongoDB.",
    });
  } catch (err: any) {
    console.error("Save workflow error:", err);
    return NextResponse.json({ error: err.message || "Failed to save workflow." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Workflow ID is required." }, { status: 400 });
    }

    const workflows = await getWorkflowsCollection();
    await workflows.deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({ success: true, message: "Workflow deleted successfully." });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete workflow." }, { status: 500 });
  }
}
