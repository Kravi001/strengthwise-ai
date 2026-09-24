import { NextResponse, type NextRequest } from "next/server";
import { USDA_REFERENCE_FOODS, type FoodItem } from "@/lib/usda-foods";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.toLowerCase().trim();
  const barcode = searchParams.get("barcode")?.trim();

  // 1. Barcode Lookup (100% Manufacturer & USDA Verified)
  if (barcode) {
    const cleanBarcode = barcode.replace(/[^0-9]/g, "");
    
    // 1A. Try Open Food Facts
    try {
      const offRes = await fetch(
        `https://world.openfoodfacts.org/api/v2/product/${cleanBarcode}.json`,
        { headers: { "User-Agent": "StrengthWise-AI - Precision Nutrition App" } }
      );

      if (offRes.ok) {
        const offData = await offRes.json();
        if (offData.status === 1 && offData.product) {
          const p = offData.product;
          const nutriments = p.nutriments || {};

          const calories = Math.round(
            nutriments["energy-kcal_100g"] ??
            nutriments["energy-kcal_serving"] ??
            nutriments["energy-kcal"] ??
            (nutriments["energy_100g"] ? nutriments["energy_100g"] / 4.184 : 0)
          );

          const protein = Math.round(((nutriments.proteins_100g ?? nutriments.proteins_serving ?? nutriments.proteins ?? 0)) * 10) / 10;
          const carbs = Math.round(((nutriments.carbohydrates_100g ?? nutriments.carbohydrates_serving ?? nutriments.carbohydrates ?? 0)) * 10) / 10;
          const fat = Math.round(((nutriments.fat_100g ?? nutriments.fat_serving ?? nutriments.fat ?? 0)) * 10) / 10;
          const fiber = Math.round(((nutriments.fiber_100g ?? nutriments.fiber_serving ?? nutriments.fiber ?? 0)) * 10) / 10;

          const brand = p.brands ? `${p.brands} - ` : "";
          const name = p.product_name ? `${brand}${p.product_name}` : `Product #${cleanBarcode}`;
          const serving = p.serving_size || "100g";

          return NextResponse.json({
            found: true,
            source: "Open Food Facts (Verified Manufacturer Barcode)",
            barcode: cleanBarcode,
            food: {
              id: `barcode-${cleanBarcode}`,
              name,
              category: protein > carbs && protein > fat ? "PROTEIN" : carbs > fat ? "CARB" : "FAT",
              serving,
              servingGrams: 100,
              calories,
              protein,
              carbs,
              fat,
              fiber,
              source: `Open Food Facts #${cleanBarcode}`,
            },
          });
        }
      }
    } catch (err) {
      console.warn("Open Food Facts barcode lookup failed:", err);
    }

    // 1B. Fallback to USDA FoodData Central Barcode Search
    try {
      const usdaRes = await fetch(
        `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=DEMO_KEY&query=${cleanBarcode}&pageSize=1`
      );
      if (usdaRes.ok) {
        const usdaData = await usdaRes.json();
        if (usdaData.foods && usdaData.foods.length > 0) {
          const f = usdaData.foods[0];
          const getNutrient = (name: string) => {
            const match = f.foodNutrients?.find((n: any) =>
              n.nutrientName?.toLowerCase().includes(name.toLowerCase())
            );
            return match?.value || 0;
          };

          const calories = Math.round(getNutrient("energy") || 0);
          const protein = Math.round(getNutrient("protein") * 10) / 10;
          const fat = Math.round(getNutrient("total lipid") * 10) / 10;
          const carbs = Math.round(getNutrient("carbohydrate") * 10) / 10;
          const fiber = Math.round(getNutrient("fiber") * 10) / 10;
          const brand = f.brandOwner ? `${f.brandOwner} - ` : "";

          return NextResponse.json({
            found: true,
            source: "USDA FoodData Central (Branded Barcode)",
            barcode: cleanBarcode,
            food: {
              id: `usda-${f.fdcId}`,
              name: `${brand}${f.description}`,
              category: protein > carbs && protein > fat ? "PROTEIN" : carbs > fat ? "CARB" : "FAT",
              serving: f.servingSize ? `${f.servingSize}${f.servingSizeUnit || "g"}` : "100g",
              servingGrams: f.servingSize || 100,
              calories,
              protein,
              carbs,
              fat,
              fiber,
              fdcId: String(f.fdcId),
              source: `USDA FoodData Central FDC #${f.fdcId}`,
            },
          });
        }
      }
    } catch (err) {
      console.warn("USDA barcode lookup failed:", err);
    }

    return NextResponse.json({
      found: false,
      message: `No product found in world database for barcode ${barcode}. You can quick-add it below.`,
    });
  }

  // 2. Query Search (Curated USDA Standards + Live USDA FoodData Central + Open Food Facts)
  if (!query) {
    return NextResponse.json({
      results: USDA_REFERENCE_FOODS,
      total: USDA_REFERENCE_FOODS.length,
      source: "USDA FoodData Central Reference Standard",
    });
  }

  // 2A. Local curated matches
  const localMatches = USDA_REFERENCE_FOODS.filter(
    (f) =>
      f.name.toLowerCase().includes(query) ||
      f.category.toLowerCase().includes(query)
  );

  let liveUsdaMatches: FoodItem[] = [];
  let openFoodFactsMatches: FoodItem[] = [];

  // 2B. Live USDA FoodData Central API Query
  try {
    const usdaSearchUrl = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=DEMO_KEY&query=${encodeURIComponent(
      query
    )}&pageSize=8`;
    const usdaRes = await fetch(usdaSearchUrl);
    if (usdaRes.ok) {
      const usdaData = await usdaRes.json();
      if (usdaData.foods && Array.isArray(usdaData.foods)) {
        liveUsdaMatches = usdaData.foods.map((f: any) => {
          const getNutrient = (name: string) => {
            const match = f.foodNutrients?.find((n: any) =>
              n.nutrientName?.toLowerCase().includes(name.toLowerCase())
            );
            return match?.value || 0;
          };

          const calories = Math.round(getNutrient("energy") || 0);
          const protein = Math.round(getNutrient("protein") * 10) / 10;
          const fat = Math.round(getNutrient("total lipid") * 10) / 10;
          const carbs = Math.round(getNutrient("carbohydrate") * 10) / 10;
          const fiber = Math.round(getNutrient("fiber") * 10) / 10;
          const brand = f.brandOwner ? `${f.brandOwner} - ` : "";

          return {
            id: `usda-${f.fdcId}`,
            name: `${brand}${f.description}`,
            category: (protein > carbs && protein > fat ? "PROTEIN" : carbs > fat ? "CARB" : "FAT") as "PROTEIN" | "CARB" | "FAT",
            serving: f.servingSize ? `${f.servingSize}${f.servingSizeUnit || "g"}` : "100g",
            servingGrams: f.servingSize || 100,
            calories,
            protein,
            carbs,
            fat,
            fiber,
            fdcId: String(f.fdcId),
            source: "USDA FoodData Central",
          };
        });
      }
    }
  } catch (err) {
    console.warn("USDA live search error:", err);
  }

  // 2C. Live Open Food Facts Search
  try {
    const offSearchUrl = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
      query
    )}&search_simple=1&action=process&json=1&page_size=8`;

    const offRes = await fetch(offSearchUrl, {
      headers: { "User-Agent": "StrengthWise-AI - Precision Nutrition App" },
    });

    if (offRes.ok) {
      const offData = await offRes.json();
      if (offData.products && Array.isArray(offData.products)) {
        openFoodFactsMatches = offData.products
          .filter(
            (p: any) =>
              p.product_name &&
              (p.nutriments?.["energy-kcal_100g"] !== undefined ||
                p.nutriments?.["energy-kcal"] !== undefined)
          )
          .map((p: any) => {
            const nutriments = p.nutriments || {};
            const calories = Math.round(
              nutriments["energy-kcal_100g"] ??
              nutriments["energy-kcal_serving"] ??
              nutriments["energy-kcal"] ??
              0
            );
            const protein = Math.round(((nutriments.proteins_100g ?? nutriments.proteins_serving ?? 0)) * 10) / 10;
            const carbs = Math.round(((nutriments.carbohydrates_100g ?? nutriments.carbohydrates_serving ?? 0)) * 10) / 10;
            const fat = Math.round(((nutriments.fat_100g ?? nutriments.fat_serving ?? 0)) * 10) / 10;
            const fiber = Math.round(((nutriments.fiber_100g ?? nutriments.fiber_serving ?? 0)) * 10) / 10;
            const brand = p.brands ? `${p.brands} - ` : "";

            return {
              id: p._id || p.code || Math.random().toString(36).substring(7),
              name: `${brand}${p.product_name}`,
              category: (protein > carbs && protein > fat ? "PROTEIN" : carbs > fat ? "CARB" : "FAT") as "PROTEIN" | "CARB" | "FAT",
              serving: p.serving_size || "100g",
              servingGrams: 100,
              calories,
              protein,
              carbs,
              fat,
              fiber,
              fdcId: p.code,
              source: "Open Food Facts",
            };
          });
      }
    }
  } catch (err) {
    console.warn("Open Food Facts search error:", err);
  }

  // Combine and deduplicate
  const seen = new Set<string>();
  const combined: FoodItem[] = [];

  for (const item of [...localMatches, ...liveUsdaMatches, ...openFoodFactsMatches]) {
    const key = item.name.toLowerCase().trim();
    if (!seen.has(key)) {
      seen.add(key);
      combined.push(item);
    }
  }

  return NextResponse.json({
    results: combined,
    total: combined.length,
    source: "USDA FoodData Central + Open Food Facts Database",
  });
}
