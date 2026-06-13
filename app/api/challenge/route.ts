import { NextRequest, NextResponse } from "next/server";
import { generateDailyChallenge } from "@/lib/gemini";
import { getWeeklyLogs, getUserProfile, saveDailyChallenge } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const [profile, logs] = await Promise.all([
      getUserProfile(userId),
      getWeeklyLogs(userId),
    ]);

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Determine top category from logs
    const categories: Record<string, number> = {};
    logs.forEach((l) => {
      categories[l.category] = (categories[l.category] || 0) + l.co2_kg;
    });
    
    let topCategory = "Travel";
    let maxVal = 0;
    Object.entries(categories).forEach(([cat, val]) => {
      if (val > maxVal) {
        maxVal = val;
        topCategory = cat;
      }
    });

    const logsSummary = logs.map(l => `${l.activity} (${l.co2_kg}kg)`).join(", ");
    
    const result = await generateDailyChallenge(
      topCategory,
      logsSummary || "No activities yet",
      profile.streak || 0
    );

    const challenge = {
      userId,
      date: new Date().toISOString().split("T")[0],
      challenge: result.challenge,
      category: result.category,
      co2Saving: result.co2Saving,
      difficulty: result.difficulty,
      completed: false,
    };

    await saveDailyChallenge(challenge);

    return NextResponse.json(challenge);
  } catch (error) {
    console.error("Challenge API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
  
    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }
  
    // This could also fetch from DB, but for simplicity we'll just handle it in the component 
    // or provide a simple GET here.
    return NextResponse.json({ message: "Use POST to generate" });
}
