const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

// ─── TYPES ────────────────────────────────────────────────
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

// ─── TEXT ANALYSIS ────────────────────────────────────────
export async function analyzeText(
  userInput: string,
  category?: string
): Promise<AnalysisResult> {
  const prompt = `You are a carbon footprint analyzer for Indian users.

User said: "${userInput}"
${category ? `Category hint: ${category}` : ""}

EMISSION FACTORS (use these exactly):
- Petrol car: 0.21 kg CO2 per km
- Diesel car: 0.27 kg CO2 per km  
- Bus: 0.089 kg CO2 per km
- Train/Metro: 0.041 kg CO2 per km
- Flight domestic India: 0.133 kg CO2 per km per passenger
- Electricity India: 0.82 kg CO2 per kWh
- Beef/mutton: 27 kg CO2 per kg
- Chicken: 6.9 kg CO2 per kg
- Rice: 2.7 kg CO2 per kg
- Vegetables: 2 kg CO2 per kg
- Milk: 3.2 kg CO2 per litre
- Petrol fuel: 2.31 kg CO2 per litre
- LPG cylinder 14kg: 29.4 kg CO2
- New cotton clothing: 10 kg CO2 per item
- Online shopping delivery: 0.5 kg CO2 per package

Analyze the activity and return ONLY this JSON (no markdown, no backticks):
{
  "extracted": {
    "activity": "clear description of what was detected",
    "quantity": 50,
    "unit": "km",
    "confidence": "high"
  },
  "co2_kg": 10.5,
  "calculation": "50 km × 0.21 kg/km",
  "category": "Travel",
  "tip": "specific actionable advice for Indian context, mention rupee savings if relevant",
  "comparison": "= leaving a 60W bulb on for X hours OR X phone charges OR X km not driven",
  "needs_confirmation": false
}

Rules:
- If unclear or ambiguous, set needs_confirmation: true and confidence: "low"
- category must be one of: Travel, Energy, Food, Shopping
- co2_kg must be a number, never null
- comparison must be relatable to everyday Indian life
- tip must be specific, not generic`;

  const response = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 500 },
    }),
  });

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

  try {
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    throw new Error("Failed to parse Gemini response");
  }
}

// ─── IMAGE ANALYSIS ───────────────────────────────────────
export async function analyzeImage(
  base64Image: string,
  mimeType: string
): Promise<AnalysisResult> {
  const prompt = `You are a carbon footprint analyzer. Analyze this bill/receipt image.

EMISSION FACTORS:
- Electricity India: 0.82 kg CO2 per kWh
- Petrol fuel: 2.31 kg CO2 per litre
- Diesel fuel: 2.68 kg CO2 per litre
- LPG cylinder 14kg: 29.4 kg CO2
- Petrol car per km: 0.21 kg CO2

Extract the key information and calculate carbon footprint.

Return ONLY this JSON (no markdown, no backticks):
{
  "extracted": {
    "activity": "what you detected from the image",
    "quantity": 234,
    "unit": "kWh",
    "confidence": "high"
  },
  "co2_kg": 191.9,
  "calculation": "234 kWh × 0.82 kg/kWh",
  "category": "Energy",
  "tip": "specific advice based on what was found in the bill",
  "comparison": "= leaving a 60W bulb on for 133 days",
  "needs_confirmation": false
}

If you cannot read the image clearly, set confidence: "low" and needs_confirmation: true.
category must be: Travel, Energy, Food, or Shopping`;

  const response = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Image,
              },
            },
          ],
        },
      ],
      generationConfig: { temperature: 0.1, maxOutputTokens: 500 },
    }),
  });

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

  try {
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    throw new Error("Failed to parse Gemini image response");
  }
}

// ─── DAILY CHALLENGE GENERATOR ────────────────────────────
export async function generateDailyChallenge(
  topCategory: string,
  weeklyLogs: string,
  streak: number
): Promise<ChallengeResult> {
  const prompt = `You are a carbon reduction coach for Indian users.

User's highest emission category this week: ${topCategory}
Recent activities: ${weeklyLogs}
Current streak: ${streak} days

Generate ONE specific, achievable daily challenge that:
1. Targets their highest emission category
2. Is realistic for urban Indian lifestyle
3. Can be done TODAY
4. Saves meaningful CO2

Return ONLY this JSON (no markdown, no backticks):
{
  "challenge": "Walk or cycle for trips under 2km instead of taking a rickshaw today",
  "category": "Travel",
  "co2Saving": 0.4,
  "reason": "Your travel emissions are highest this week. Short trips under 2km are perfect for walking."
}

Make challenge specific and actionable, not generic like "use less energy".`;

  const response = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 200 },
    }),
  });

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

  try {
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return {
      challenge: "Avoid using AC for 2 hours today and use a fan instead",
      category: "Energy",
      co2Saving: 0.3,
      reason: "Small changes in energy use compound over time.",
    };
  }
}