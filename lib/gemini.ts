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

const BASE_URL = process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com";
const API_VERSION = process.env.GEMINI_API_VERSION || "v1beta";

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
const API_URL = `${BASE_URL}/${API_VERSION}/models/${MODEL}:generateContent`;

function geminiHeaders(apiKey: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    "x-goog-api-key": apiKey,
  };
}

const ANALYSIS_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    extracted: {
      type: "OBJECT",
      properties: {
        activity: { type: "STRING" },
        quantity: { type: "NUMBER" },
        unit: { type: "STRING" },
        confidence: { type: "STRING", enum: ["high", "medium", "low"] },
      },
      required: ["activity", "quantity", "unit", "confidence"],
    },
    co2_kg: { type: "NUMBER" },
    calculation: { type: "STRING" },
    category: { type: "STRING" },
    tip: { type: "STRING" },
    comparison: { type: "STRING" },
    needs_confirmation: { type: "BOOLEAN" },
  },
  required: [
    "extracted",
    "co2_kg",
    "calculation",
    "category",
    "tip",
    "comparison",
    "needs_confirmation",
  ],
};

const CHALLENGE_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    challenge: { type: "STRING" },
    category: { type: "STRING" },
    co2Saving: { type: "NUMBER" },
    difficulty: { type: "STRING", enum: ["Easy", "Medium", "Hard"] },
    reason: { type: "STRING" },
  },
  required: ["challenge", "category", "co2Saving", "difficulty", "reason"],
};

function parseGeminiJSON(text: string): unknown {
  let clean = text.trim();
  clean = clean.replace(/<thinking>[\s\S]*?<\/thinking>/gi, "").trim();

  const codeBlock = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlock) {
    try {
      return JSON.parse(codeBlock[1]);
    } catch {}
  }

  const firstBrace = clean.indexOf("{");
  const lastBrace = clean.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1) {
    const candidate = clean.substring(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch {}
  }

  return null;
}

function extractGeminiText(data: any): string | null {
  try {
    const candidate = data?.candidates?.[0];
    if (!candidate) {
      console.error("Gemini: no candidates", JSON.stringify(data?.promptFeedback ?? data));
      return null;
    }

    const parts = candidate?.content?.parts;
    if (!Array.isArray(parts) || parts.length === 0) return null;

    const text = parts
      .map((part: { text?: string }) => part.text)
      .filter(Boolean)
      .join("");

    return text || null;
  } catch (error) {
    console.error("Error extracting text from Gemini response:", error);
    return null;
  }
}

function assertAnalysisResult(raw: unknown): AnalysisResult {
  if (!raw || typeof raw !== "object") {
    throw new Error("AI response is not a valid object");
  }

  const data = raw as Record<string, unknown>;
  const extracted = data.extracted;

  if (!extracted || typeof extracted !== "object" || Array.isArray(extracted)) {
    throw new Error("AI response must include a single extracted object");
  }

  const item = extracted as Record<string, unknown>;
  const activity = item.activity;
  const quantity = item.quantity;
  const unit = item.unit;
  const confidence = item.confidence;
  const co2_kg = data.co2_kg;
  const calculation = data.calculation;
  const category = data.category;
  const tip = data.tip;
  const comparison = data.comparison;
  const needs_confirmation = data.needs_confirmation;

  if (typeof activity !== "string" || !activity.trim()) {
    throw new Error("AI response missing activity");
  }
  if (typeof quantity !== "number" || !Number.isFinite(quantity)) {
    throw new Error("AI response missing valid quantity");
  }
  if (typeof unit !== "string" || !unit.trim()) {
    throw new Error("AI response missing unit");
  }
  if (confidence !== "high" && confidence !== "medium" && confidence !== "low") {
    throw new Error("AI response missing valid confidence");
  }
  if (typeof co2_kg !== "number" || !Number.isFinite(co2_kg)) {
    throw new Error("AI response missing valid co2_kg");
  }
  if (typeof calculation !== "string" || !calculation.trim()) {
    throw new Error("AI response missing calculation");
  }
  if (typeof category !== "string" || !category.trim()) {
    throw new Error("AI response missing category");
  }
  if (typeof tip !== "string" || !tip.trim()) {
    throw new Error("AI response missing tip");
  }
  if (typeof comparison !== "string" || !comparison.trim()) {
    throw new Error("AI response missing comparison");
  }
  if (typeof needs_confirmation !== "boolean") {
    throw new Error("AI response missing needs_confirmation");
  }

  return {
    extracted: {
      activity: activity.trim(),
      quantity,
      unit: unit.trim(),
      confidence,
    },
    co2_kg,
    calculation: calculation.trim(),
    category: category.trim(),
    tip: tip.trim(),
    comparison: comparison.trim(),
    needs_confirmation,
  };
}

function assertChallengeResult(raw: unknown): ChallengeResult {
  if (!raw || typeof raw !== "object") {
    throw new Error("AI response is not a valid object");
  }

  const data = raw as Record<string, unknown>;
  const { challenge, category, co2Saving, difficulty, reason } = data;

  if (typeof challenge !== "string" || !challenge.trim()) {
    throw new Error("AI response missing challenge");
  }
  if (typeof category !== "string" || !category.trim()) {
    throw new Error("AI response missing category");
  }
  if (typeof co2Saving !== "number" || !Number.isFinite(co2Saving)) {
    throw new Error("AI response missing valid co2Saving");
  }
  if (difficulty !== "Easy" && difficulty !== "Medium" && difficulty !== "Hard") {
    throw new Error("AI response missing valid difficulty");
  }
  if (typeof reason !== "string" || !reason.trim()) {
    throw new Error("AI response missing reason");
  }

  return {
    challenge: challenge.trim(),
    category: category.trim(),
    co2Saving,
    difficulty,
    reason: reason.trim(),
  };
}

function buildAnalysisPrompt(userInput: string, category?: string): string {
  const customFactors = process.env.CO2_FACTORS?.trim();

  return `You are a carbon footprint analyzer for Indian users. 
User input: "${userInput}"
${category ? `Category hint: ${category}` : ""}
${customFactors ? `\nReference emission values (optional):\n${customFactors}` : ""}

Analyze ALL activities mentioned in the input. If there are multiple actions, you MUST:
1. Calculate CO2 for each one separately using standard emission factors.
2. Provide a clear, step-by-step "calculation" string showing the math for EACH activity (e.g., "(10 * 0.2) + (0.5 * 27) = 2 + 13.5 = 15.5").
3. SET "co2_kg" TO THE EXACT SUM of these individual calculations. DO NOT ROUND ARBITRARILY (e.g., if the sum is 32.4, co2_kg must be 32.4, not 30).
4. In "extracted", provide a summary "activity" name and the primary "quantity"/"unit" if possible.
5. "category" should be the most dominant category.

Return JSON matching the required schema exactly. Use high precision for your internal math.`;
}

async function callGemini(
  prompt: string,
  options: {
    responseSchema: Record<string, unknown>;
    temperature?: number;
    maxOutputTokens?: number;
    parts?: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }>;
  }
): Promise<unknown> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: geminiHeaders(apiKey),
      body: JSON.stringify({
        contents: [
          {
            parts: options.parts ?? [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: options.temperature ?? 0.1,
          maxOutputTokens: options.maxOutputTokens ?? 1000,
          responseMimeType: "application/json",
          responseSchema: options.responseSchema,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API error:", response.status, JSON.stringify(data));
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const text = extractGeminiText(data);
    if (!text) {
      console.error("Gemini returned empty response:", JSON.stringify(data));
      throw new Error("Gemini returned an empty response");
    }

    const parsed = parseGeminiJSON(text);
    if (!parsed) {
      console.error("Failed to parse Gemini JSON. Raw text:", text);
      throw new Error("Failed to parse AI response as JSON");
    }

    return parsed;
  } catch (error: any) {
    clearTimeout(timeout);
    if (error.name === "AbortError") {
      throw new Error("Gemini request timed out after 15 seconds");
    }
    throw error;
  }
}

export async function analyzeText(userInput: string, category?: string): Promise<AnalysisResult> {
  const parsed = await callGemini(buildAnalysisPrompt(userInput, category), {
    responseSchema: ANALYSIS_RESPONSE_SCHEMA,
  });

  return assertAnalysisResult(parsed);
}

export async function analyzeImage(base64Image: string, mimeType: string): Promise<AnalysisResult> {
  const prompt = `Analyze this bill or receipt and calculate the carbon footprint for an Indian user.
Return JSON matching the required schema exactly.`;

  const parsed = await callGemini(prompt, {
    responseSchema: ANALYSIS_RESPONSE_SCHEMA,
    parts: [
      { text: prompt },
      { inlineData: { mimeType, data: base64Image } },
    ],
  });

  return assertAnalysisResult(parsed);
}

export async function generateDailyChallenge(
  topCategory: string,
  weeklyLogs: string,
  streak: number
): Promise<ChallengeResult> {
  const prompt = `Create a daily eco-challenge for an Indian user.
Context: Category ${topCategory}, Streak ${streak}, Recent logs: ${weeklyLogs}
Return JSON matching the required schema exactly.`;

  const parsed = await callGemini(prompt, {
    temperature: 0.7,
    responseSchema: CHALLENGE_RESPONSE_SCHEMA,
  });

  return assertChallengeResult(parsed);
}
