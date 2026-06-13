import { NextRequest, NextResponse } from "next/server";
import { analyzeImage } from "@/lib/gemini";
import { saveActivityLog } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File;
    const userId = formData.get("userId") as string;
    const confirmed = formData.get("confirmed") === "true";

    if (!file) {
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 }
      );
    }

    if (file.size > 4 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image too large. Please use an image under 4MB." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = file.type || "image/jpeg";

    const result = await analyzeImage(base64, mimeType);

    if (userId && confirmed && !result.needs_confirmation) {
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
    console.error("Scan error:", error);
    return NextResponse.json(
      { error: "Image scan failed. Please try a clearer photo." },
      { status: 500 }
    );
  }
}