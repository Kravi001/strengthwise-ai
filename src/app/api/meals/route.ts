import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/user";

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date"); // YYYY-MM-DD

    // Define day window
    const targetDate = dateParam ? new Date(dateParam) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Fetch meals for this day
    const meals = await prisma.mealLog.findMany({
      where: {
        userId: auth.dbUser.id,
        loggedAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: {
        loggedAt: "asc",
      },
    });

    // Fetch athlete profile for target comparisons
    const profile = await prisma.profile.findUnique({
      where: { userId: auth.dbUser.id },
    });

    const targetCalories = profile?.targetCalories ?? 2200;
    const targetProtein = profile?.targetProtein ?? 175;
    const targetCarbs = profile?.targetCarbs ?? 225;
    const targetFat = profile?.targetFat ?? 65;
    const targetFiber = profile?.targetFiber ?? 30;

    // Calculate consumed totals
    const totals = meals.reduce(
      (acc, m) => ({
        calories: acc.calories + m.calories,
        protein: Math.round((acc.protein + (m.protein || 0)) * 10) / 10,
        carbs: Math.round((acc.carbs + (m.carbs || 0)) * 10) / 10,
        fat: Math.round((acc.fat + (m.fat || 0)) * 10) / 10,
        fiber: Math.round((acc.fiber + (m.fiber || 0)) * 10) / 10,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
    );

    const remaining = {
      calories: Math.max(0, targetCalories - totals.calories),
      protein: Math.max(0, Math.round((targetProtein - totals.protein) * 10) / 10),
      carbs: Math.max(0, Math.round((targetCarbs - totals.carbs) * 10) / 10),
      fat: Math.max(0, Math.round((targetFat - totals.fat) * 10) / 10),
      fiber: Math.max(0, Math.round((targetFiber - totals.fiber) * 10) / 10),
    };

    // Group meals by type
    const grouped = {
      BREAKFAST: meals.filter((m) => m.mealType === "BREAKFAST"),
      LUNCH: meals.filter((m) => m.mealType === "LUNCH"),
      DINNER: meals.filter((m) => m.mealType === "DINNER"),
      SNACK: meals.filter((m) => m.mealType === "SNACK"),
    };

    return NextResponse.json({
      date: startOfDay.toISOString().split("T")[0],
      meals,
      grouped,
      totals,
      targets: {
        targetCalories,
        targetProtein,
        targetCarbs,
        targetFat,
        targetFiber,
      },
      remaining,
    });
  } catch (error) {
    console.error("Failed to fetch meals:", error);
    return NextResponse.json(
      { error: "Failed to load meal logs." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, mealType, calories, protein, carbs, fat, fiber, serving } = body;

    if (!name || calories === undefined) {
      return NextResponse.json(
        { error: "Food name and calories are required." },
        { status: 400 }
      );
    }

    const validMealType = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"].includes(mealType)
      ? mealType
      : "SNACK";

    const newMeal = await prisma.mealLog.create({
      data: {
        userId: auth.dbUser.id,
        mealType: validMealType,
        name: String(name).trim(),
        calories: Math.round(Number(calories)),
        protein: Math.round(Number(protein || 0) * 10) / 10,
        carbs: Math.round(Number(carbs || 0) * 10) / 10,
        fat: Math.round(Number(fat || 0) * 10) / 10,
        fiber: Math.round(Number(fiber || 0) * 10) / 10,
        serving: serving ? String(serving).trim() : "1 serving",
        loggedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      meal: newMeal,
    });
  } catch (error) {
    console.error("Failed to log meal:", error);
    return NextResponse.json(
      { error: "Failed to log meal. Please try again." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Meal log ID is required." },
        { status: 400 }
      );
    }

    await prisma.mealLog.deleteMany({
      where: {
        id,
        userId: auth.dbUser.id,
      },
    });

    return NextResponse.json({ success: true, message: "Meal log deleted." });
  } catch (error) {
    console.error("Failed to delete meal log:", error);
    return NextResponse.json(
      { error: "Failed to delete meal log." },
      { status: 500 }
    );
  }
}
