import { NextRequest, NextResponse } from "next/server";
import { parseNaturalLanguageToWorkflow } from "@/lib/workflow/nlp-parser";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prompt = body.prompt || "";

    if (!prompt) {
      return NextResponse.json({ error: "Prompt parameter is required." }, { status: 400 });
    }

    const workflow = parseNaturalLanguageToWorkflow(prompt);
    return NextResponse.json({ success: true, workflow });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to parse workflow." }, { status: 500 });
  }
}
