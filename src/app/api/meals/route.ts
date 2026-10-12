import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/user";
import { getLocalDayBounds, parseOffsetMinutes } from "@/lib/date";

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
    const offsetParam = searchParams.get("offset");
    const timezoneParam = searchParams.get("timezone");
    const resetTimeParam = searchParams.get("resetTime");

    // Fetch athlete profile for target comparisons and mealResetTime
    const profile = await prisma.profile.findUnique({
      where: { userId: auth.dbUser.id },
    });

    const resetTime = resetTimeParam || profile?.mealResetTime || "00:00";
    const offsetMinutes = parseOffsetMinutes(offsetParam, timezoneParam);
    const { date: targetDateStr, startOfDay, endOfDay } = getLocalDayBounds(dateParam, offsetMinutes, resetTime);

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

    const todayStr = getLocalDayBounds(null, offsetMinutes, resetTime).date;

    return NextResponse.json({
      date: targetDateStr,
      isToday: targetDateStr === todayStr,
      resetTime,
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
    const { name, mealType, calories, protein, carbs, fat, fiber, serving, date, loggedAt, offset, timezone, resetTime: bodyResetTime } = body;

    if (!name || calories === undefined) {
      return NextResponse.json(
        { error: "Food name and calories are required." },
        { status: 400 }
      );
    }

    const validMealType = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"].includes(mealType)
      ? mealType
      : "SNACK";

    let resetTime = bodyResetTime;
    if (!resetTime) {
      const profile = await prisma.profile.findUnique({
        where: { userId: auth.dbUser.id },
      });
      resetTime = profile?.mealResetTime || "00:00";
    }

    const offsetMinutes = parseOffsetMinutes(offset, timezone);
    let logDateTime = new Date();

    if (loggedAt) {
      const parsed = new Date(loggedAt);
      if (!Number.isNaN(parsed.getTime())) {
        logDateTime = parsed;
      }
    } else if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const todayBounds = getLocalDayBounds(null, offsetMinutes, resetTime);
      if (date !== todayBounds.date) {
        // Logging for a past or future date: default to 12 hours after startOfDay
        const targetBounds = getLocalDayBounds(date, offsetMinutes, resetTime);
        logDateTime = new Date(targetBounds.startOfDay.getTime() + 12 * 3600 * 1000);
      }
    }

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
        loggedAt: logDateTime,
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
    const clearDay = searchParams.get("clearDay");

    if (clearDay === "true") {
      const dateParam = searchParams.get("date");
      const offsetParam = searchParams.get("offset");
      const timezoneParam = searchParams.get("timezone");
      const resetTimeParam = searchParams.get("resetTime");

      const profile = await prisma.profile.findUnique({
        where: { userId: auth.dbUser.id },
      });
      const resetTime = resetTimeParam || profile?.mealResetTime || "00:00";
      const offsetMinutes = parseOffsetMinutes(offsetParam, timezoneParam);
      const { startOfDay, endOfDay } = getLocalDayBounds(dateParam, offsetMinutes, resetTime);

      await prisma.mealLog.deleteMany({
        where: {
          userId: auth.dbUser.id,
          loggedAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

      return NextResponse.json({ success: true, message: "Day cleared." });
    }

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

export async function PATCH(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, name, mealType, calories, protein, carbs, fat, fiber, serving } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Meal log ID is required." },
        { status: 400 }
      );
    }

    const existing = await prisma.mealLog.findFirst({
      where: {
        id,
        userId: auth.dbUser.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Meal log entry not found." },
        { status: 404 }
      );
    }

    const validMealType =
      mealType && ["BREAKFAST", "LUNCH", "DINNER", "SNACK"].includes(mealType)
        ? mealType
        : existing.mealType;

    const updatedMeal = await prisma.mealLog.update({
      where: { id },
      data: {
        name: name !== undefined ? String(name).trim() : existing.name,
        mealType: validMealType,
        calories: calories !== undefined ? Math.round(Number(calories)) : existing.calories,
        protein: protein !== undefined ? Math.round(Number(protein || 0) * 10) / 10 : existing.protein,
        carbs: carbs !== undefined ? Math.round(Number(carbs || 0) * 10) / 10 : existing.carbs,
        fat: fat !== undefined ? Math.round(Number(fat || 0) * 10) / 10 : existing.fat,
        fiber: fiber !== undefined ? Math.round(Number(fiber || 0) * 10) / 10 : existing.fiber,
        serving: serving !== undefined ? String(serving).trim() : existing.serving,
      },
    });

    return NextResponse.json({
      success: true,
      meal: updatedMeal,
    });
  } catch (error) {
    console.error("Failed to update meal log:", error);
    return NextResponse.json(
      { error: "Failed to update meal log." },
      { status: 500 }
    );
  }
}

export const PUT = PATCH;

