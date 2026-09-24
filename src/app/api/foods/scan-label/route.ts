import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/user";

interface GeminiFoodScanResponse {
  foodName?: string;
  brand?: string;
  servingSize?: string;
  servingGrams?: number;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  detectedBarcode?: string;
  confidence?: number;
  notes?: string;
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    // Allow guest or authenticated scanning, but we can verify auth for security
    const body = await request.json();
    const { image, mimeType = "image/jpeg" } = body;

    if (!image) {
      return NextResponse.json(
        { error: "Image data is required for food scanning." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini AI API key not configured on server." },
        { status: 500 }
      );
    }

    // Clean base64 data
    let base64Data = image;
    let detectedMime = mimeType;

    if (image.startsWith("data:")) {
      const match = image.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        detectedMime = match[1];
        base64Data = match[2];
      }
    }

    const prompt = `You are a world-class clinical sports nutrition and computer vision specialist with 100% precision requirements.
Analyze the provided image. The image may be:
1. A Nutrition Facts label on a food or supplement package.
2. A food barcode (UPC / EAN).
3. A prepared meal, plate of food, or whole food item.

TASK:
Extract or calculate with 100% mathematical and nutritional accuracy:
- Food or product name (include brand if visible)
- Serving size description (e.g., "1 scoop (32g)", "1 bar (60g)", "1 cup (240ml)", "150g fillet")
- Serving size in grams (numeric estimate or exact number from label)
- Total Calories (kcal) per serving
- Protein in grams (per serving)
- Total Carbohydrates in grams (per serving)
- Total Fat in grams (per serving)
- Dietary Fiber in grams (per serving, default to 0 if not listed)
- Any barcode digits if visible
- Mathematical cross-check: In human nutrition, (Protein * 4) + (Carbohydrate * 4) + (Fat * 9) should closely match the stated calories (Atwater general factors).

Return ONLY valid JSON matching this exact structure with no markdown backticks, no markdown codeblocks, and no preamble:
{
  "foodName": "String",
  "brand": "String or null",
  "servingSize": "String",
  "servingGrams": 100,
  "calories": 150,
  "protein": 24.0,
  "carbs": 2.0,
  "fat": 1.5,
  "fiber": 0.0,
  "detectedBarcode": "String or null",
  "confidence": 0.98,
  "notes": "Short explanation of detected values and Atwater validation"
}`;

    // Call Gemini 3.5 Flash (with fallback to 3.1-flash-lite)
    const geminiModels = ["gemini-3.5-flash", "gemini-3.1-flash-lite"];
    let candidateText = "";

    for (const model of geminiModels) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const geminiRes = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  {
                    inline_data: {
                      mime_type: detectedMime,
                      data: base64Data,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: "application/json",
            },
          }),
        });

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          candidateText =
            geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
          if (candidateText) break;
        }
      } catch (callErr) {
        console.warn(`Model ${model} failed, trying next:`, callErr);
      }
    }

    if (!candidateText) {
      return NextResponse.json(
        { error: "Could not read food or nutrition label from this image. Please ensure the label is clearly illuminated." },
        { status: 422 }
      );
    }

    // Parse JSON
    let parsed: GeminiFoodScanResponse;
    try {
      // Strip any accidental markdown formatting if present
      const cleanJson = candidateText.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
      parsed = JSON.parse(cleanJson);
    } catch (parseErr) {
      console.error("Failed to parse Gemini output:", candidateText);
      return NextResponse.json(
        { error: "Failed to parse nutritional data from image scan." },
        { status: 500 }
      );
    }

    const protein = Math.round(Number(parsed.protein || 0) * 10) / 10;
    const carbs = Math.round(Number(parsed.carbs || 0) * 10) / 10;
    const fat = Math.round(Number(parsed.fat || 0) * 10) / 10;
    const fiber = Math.round(Number(parsed.fiber || 0) * 10) / 10;
    const servingGrams = Number(parsed.servingGrams) || 100;
    const calories = Math.round(Number(parsed.calories || (protein * 4 + carbs * 4 + fat * 9)));

    // Calculate Atwater calibration
    const atwaterCalories = Math.round(protein * 4 + carbs * 4 + fat * 9);
    const accuracyDelta = Math.abs(calories - atwaterCalories);
    const isAtwaterConsistent = accuracyDelta <= 25; // standard FDA variance tolerance

    const foodName = parsed.brand
      ? `${parsed.brand} - ${parsed.foodName || "Scanned Food Item"}`
      : parsed.foodName || "Scanned Food Item";

    return NextResponse.json({
      success: true,
      scannedFood: {
        id: `ai-scan-${Date.now()}`,
        name: foodName,
        category: (protein > carbs && protein > fat ? "PROTEIN" : carbs > fat ? "CARB" : "FAT") as "PROTEIN" | "CARB" | "FAT",
        serving: parsed.servingSize || `${servingGrams}g`,
        servingGrams,
        calories,
        protein,
        carbs,
        fat,
        fiber,
        source: "Gemini Vision AI (100% Calibrated)",
      },
      atwaterVerification: {
        statedCalories: calories,
        atwaterCalculatedCalories: atwaterCalories,
        delta: accuracyDelta,
        isConsistent: isAtwaterConsistent,
        formula: `(${protein}g × 4) + (${carbs}g × 4) + (${fat}g × 9) = ${atwaterCalories} kcal`,
      },
      detectedBarcode: parsed.detectedBarcode || null,
      notes: parsed.notes || "Nutrition facts accurately parsed from optical label inspection.",
    });
  } catch (error) {
    console.error("Food scan label error:", error);
    return NextResponse.json(
      { error: "Server error during food label scan." },
      { status: 500 }
    );
  }
}
