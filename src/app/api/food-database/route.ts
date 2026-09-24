import { NextResponse, type NextRequest } from "next/server";
import { USDA_REFERENCE_FOODS } from "@/lib/usda-foods";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.toLowerCase().trim();
  const category = searchParams.get("category")?.toUpperCase().trim();

  let foods = [...USDA_REFERENCE_FOODS];

  if (category) {
    foods = foods.filter((f) => f.category === category);
  }

  if (query) {
    foods = foods.filter(
      (f) =>
        f.name.toLowerCase().includes(query) ||
        f.category.toLowerCase().includes(query)
    );
  }

  return NextResponse.json({
    database: "USDA FoodData Central & WHO Sports Nutrition Reference",
    standard: "Dietary Guidelines for Americans & AMDR Sports Science",
    count: foods.length,
    foods,
  });
}
