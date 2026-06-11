import { NextRequest, NextResponse } from "next/server";
import { analyzeText } from "@/lib/gemini";
import { saveActivityLog } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { text, category, userId } = await req.json();

    if (!text || text.trim().length < 3) {
      return NextResponse.json(
        { error: "Please describe your activity in more detail" },
        { status: 400 }
      );
    }

    // Call Gemini to analyze
    const result = await analyzeText(text, category);

    // If confident and user is logged in, save to Firestore
    if (userId && !result.needs_confirmation) {
      await saveActivityLog({
        userId,
        activity: result.extracted.activity,
        category: result.category,
        co2_kg: result.co2_kg,
        calculation: result.calculation,
        tip: result.tip,
        comparison: result.comparison,
      });
    }

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error("Analyze error:", error);
    return NextResponse.json(
      { error: "Analysis failed. Please try again." },
      { status: 500 }
    );
  }
}