export interface AnalysisResult {
  extracted: {
    activity: string;
    quantity: number;
    unit: string;
    confidence: "high" | "medium" | "low";
  };
  co2_kg: number;
  calculation: string;
  category: string;
  tip: string;
  comparison: string;
  needs_confirmation: boolean;
}

export interface ChallengeResult {
  challenge: string;
  category: string;
  co2Saving: number;
  difficulty: "Easy" | "Medium" | "Hard";
  reason: string;
}

function parseGeminiJSON(text: string): any {
  let clean = text.trim();

  // Strip thinking tags if present
  clean = clean.replace(/<thinking>[\s\S]*?<\/thinking>/gi, "").trim();

  // Try markdown code block
  const codeBlock = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlock) {
    try { return JSON.parse(codeBlock[1]); } catch {}
  }

  // Try bare JSON object
  const firstBrace = clean.indexOf("{");
  const lastBrace = clean.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1) {
    try { return JSON.parse(clean.substring(firstBrace, lastBrace + 1)); } catch {}

    // Try fixing common issues
    try {
      const fixed = clean
        .substring(firstBrace, lastBrace + 1)
        .replace(/,\s*}/g, "}")
        .replace(/,\s*]/g, "]")
        .replace(/'/g, '"');
      return JSON.parse(fixed);
    } catch {}
  }

  return null;
}

const API_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent";

function extractGeminiText(data: any): string | null {
  try {
    const parts = data?.candidates?.[0]?.content?.parts;
    if (!parts) return null;
    const textPart = parts.find((p: any) => p.text !== undefined);
    return textPart?.text || null;
  } catch (e) {
    console.error("Error extracting text from Gemini response:", e);
    return null;
  }
}

export async function analyzeText(userInput: string, category?: string): Promise<AnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY missing");

  const prompt = `You are a carbon footprint analyzer for Indian users.
User input: "${userInput}"
${category ? `Category: ${category}` : ""}

TASK:
1. Extract activities and quantities.
2. Calculate CO2 in kg using these factors:
   - Petrol car: 0.21/km, Diesel: 0.27/km, Bus: 0.089/km, Train: 0.041/km
   - Beef: 27/kg, Chicken: 6.9/kg, Rice: 2.7/kg, Vegetables: 0.4/kg
3. Provide a helpful tip and a fun comparison.

REQUIRED OUTPUT FORMAT (RAW JSON ONLY):
{
  "extracted": {"activity": "string", "quantity": number, "unit": "string", "confidence": "high"|"medium"|"low"},
  "co2_kg": number,
  "calculation": "string showing math",
  "category": "Food"|"Travel"|"Energy"|"Shopping"|"Mixed",
  "tip": "string",
  "comparison": "string",
  "needs_confirmation": boolean
}`;

  try {
    const url = `${API_URL}?key=${apiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 1000,
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("GEMINI API FAILURE:", response.status, JSON.stringify(data, null, 2));
      throw new Error(`AI Analysis failed (Status ${response.status}). Check API key and quota.`);
    }

    const text = extractGeminiText(data);
    console.log("AI RAW RESPONSE:", text);

    if (!text) throw new Error("AI returned an empty response.");

    const parsed = parseGeminiJSON(text);
    if (parsed && parsed.co2_kg !== undefined) {
      return parsed as AnalysisResult;
    }

    throw new Error("AI response was not in the correct format.");
  } catch (error: any) {
    console.error("CRITICAL AI ERROR:", error.message || error);
    throw error; // No more hardcoded fallback
  }
}

export async function analyzeImage(base64Image: string, mimeType: string): Promise<AnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY missing");

  const prompt = `Analyze this bill/receipt and calculate the carbon footprint. 
Return ONLY RAW JSON:
{"extracted":{"activity":"...","quantity":0,"unit":"...","confidence":"high"},"co2_kg":0,"calculation":"...","category":"...","tip":"...","comparison":"...","needs_confirmation":false}`;

  try {
    const url = `${API_URL}?key=${apiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [
          { text: prompt },
          { inlineData: { mimeType, data: base64Image } }
        ] }],
        generationConfig: { temperature: 0.1 }
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(`AI Image Error: ${response.status}`);

    const text = extractGeminiText(data);
    const parsed = text ? parseGeminiJSON(text) : null;
    if (parsed && parsed.co2_kg !== undefined) return parsed as AnalysisResult;
    throw new Error("AI failed to read image correctly.");
  } catch (error: any) {
    console.error("IMAGE AI ERROR:", error.message);
    throw error;
  }
}

export async function generateDailyChallenge(topCategory: string, weeklyLogs: string, streak: number): Promise<ChallengeResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY missing");

  const prompt = `Create a daily eco-challenge for an Indian user.
Context: Category ${topCategory}, Streak ${streak}.
Return ONLY RAW JSON:
{"challenge":"...","category":"...","co2Saving":0,"difficulty":"Easy","reason":"..."}`;

  try {
    const url = `${API_URL}?key=${apiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7 }
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(`AI Challenge Error: ${response.status}`);

    const text = extractGeminiText(data);
    const parsed = text ? parseGeminiJSON(text) : null;
    if (parsed && parsed.challenge) return parsed as ChallengeResult;
    throw new Error("AI failed to generate challenge.");
  } catch (error: any) {
    console.error("CHALLENGE AI ERROR:", error.message);
    throw error;
  }
}