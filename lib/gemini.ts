const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

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
  reason: string;
}

function parseGeminiJSON(text: string): any {
  let clean = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  try { return JSON.parse(clean); } catch {}
  const jsonMatch = clean.match(/\{[\s\S]*\}/);
  if (jsonMatch) { try { return JSON.parse(jsonMatch[0]); } catch {} }
  try {
    const fixed = clean.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]").replace(/'/g, '"');
    return JSON.parse(fixed);
  } catch {}
  return null;
}

function fallbackResult(input: string): AnalysisResult {
  return {
    extracted: { activity: input.slice(0, 100), quantity: 1, unit: "activity", confidence: "low" },
    co2_kg: 2.5,
    calculation: "Estimated average activity",
    category: "Travel",
    tip: "Be more specific about distance or quantity for accurate CO2 calculation.",
    comparison: "= approximately 30 phone charges",
    needs_confirmation: true,
  };
}

export async function analyzeText(userInput: string, category?: string): Promise<AnalysisResult> {
  const prompt = `You are a carbon footprint analyzer for Indian users.
User said: "${userInput}"
${category ? `Category hint: ${category}` : ""}

EMISSION FACTORS:
- Petrol car: 0.21 kg CO2 per km
- Diesel car: 0.27 kg CO2 per km
- Bus: 0.089 kg CO2 per km
- Train/Metro: 0.041 kg CO2 per km
- Flight domestic India: 0.133 kg CO2 per km
- Electricity India: 0.82 kg CO2 per kWh
- Beef/mutton: 27 kg CO2 per kg
- Chicken: 6.9 kg CO2 per kg
- Rice: 2.7 kg CO2 per kg
- Petrol fuel: 2.31 kg CO2 per litre
- LPG cylinder 14kg: 29.4 kg CO2
- New cotton clothing: 10 kg CO2 per item

Return ONLY this JSON object with no other text:
{"extracted":{"activity":"drove petrol car 50km","quantity":50,"unit":"km","confidence":"high"},"co2_kg":10.5,"calculation":"50 km x 0.21 kg/km","category":"Travel","tip":"Try carpooling to save fuel and reduce emissions","comparison":"= leaving a 60W bulb on for 175 hours","needs_confirmation":false}`;

  try {
    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 600 },
      }),
    });
    if (!response.ok) { console.error("Gemini error:", response.status); return fallbackResult(userInput); }
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    console.log("Gemini response:", text);
    const parsed = parseGeminiJSON(text);
    if (parsed && parsed.co2_kg !== undefined) return parsed as AnalysisResult;
    console.error("Parse failed for:", text);
    return fallbackResult(userInput);
  } catch (error) {
    console.error("analyzeText error:", error);
    return fallbackResult(userInput);
  }
}

export async function analyzeImage(base64Image: string, mimeType: string): Promise<AnalysisResult> {
  const prompt = `Analyze this bill/receipt. Return ONLY this JSON with no other text:
{"extracted":{"activity":"electricity usage","quantity":234,"unit":"kWh","confidence":"high"},"co2_kg":191.9,"calculation":"234 kWh x 0.82","category":"Energy","tip":"Switch to LED bulbs","comparison":"= 133 days of a 60W bulb","needs_confirmation":false}`;

  try {
    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: mimeType, data: base64Image } }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 600 },
      }),
    });
    if (!response.ok) return fallbackResult("image scan");
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const parsed = parseGeminiJSON(text);
    if (parsed && parsed.co2_kg !== undefined) return parsed as AnalysisResult;
    return { ...fallbackResult("image"), needs_confirmation: true };
  } catch (error) {
    console.error("analyzeImage error:", error);
    return fallbackResult("image scan");
  }
}

export async function generateDailyChallenge(topCategory: string, weeklyLogs: string, streak: number): Promise<ChallengeResult> {
  const prompt = `Carbon coach for Indian users. Top category: ${topCategory}. Streak: ${streak} days.
Return ONLY this JSON: {"challenge":"Walk for trips under 2km today","category":"Travel","co2Saving":0.4,"reason":"Short trips are perfect for walking"}`;

  try {
    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 200 },
      }),
    });
    if (!response.ok) throw new Error("API error");
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const parsed = parseGeminiJSON(text);
    if (parsed && parsed.challenge) return parsed as ChallengeResult;
    throw new Error("Parse failed");
  } catch {
    return { challenge: "Avoid AC for 2 hours today, use a fan instead", category: "Energy", co2Saving: 0.3, reason: "Small energy changes add up daily." };
  }
}