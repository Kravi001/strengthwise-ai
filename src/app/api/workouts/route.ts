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
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 30;

    // Fetch user's workout logs
    const workouts = await prisma.workoutLog.findMany({
      where: {
        userId: auth.dbUser.id,
      },
      orderBy: {
        loggedAt: "desc",
      },
      take: limit,
    });

    // Calculate this week window (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const thisWeekWorkouts = workouts.filter(
      (w) => new Date(w.loggedAt) >= sevenDaysAgo
    );

    const totalMinutes = workouts.reduce(
      (sum, w) => sum + (w.durationMinutes || 0),
      0
    );
    const totalCalories = workouts.reduce(
      (sum, w) => sum + (w.caloriesBurned || 0),
      0
    );

    const weeklyMinutes = thisWeekWorkouts.reduce(
      (sum, w) => sum + (w.durationMinutes || 0),
      0
    );
    const weeklyCalories = thisWeekWorkouts.reduce(
      (sum, w) => sum + (w.caloriesBurned || 0),
      0
    );

    return NextResponse.json({
      workouts,
      summary: {
        totalWorkouts: workouts.length,
        thisWeekCount: thisWeekWorkouts.length,
        totalMinutes,
        totalCalories,
        weeklyMinutes,
        weeklyCalories,
      },
    });
  } catch (error) {
    console.error("Failed to fetch workout logs:", error);
    return NextResponse.json(
      { error: "Failed to load workout logs." },
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
    const { name, durationMinutes, caloriesBurned, notes, loggedAt } = body;

    if (!name || String(name).trim().length === 0) {
      return NextResponse.json(
        { error: "Workout name is required." },
        { status: 400 }
      );
    }

    const parsedDuration =
      durationMinutes !== undefined && durationMinutes !== null
        ? Math.max(1, parseInt(String(durationMinutes), 10))
        : null;

    const parsedCalories =
      caloriesBurned !== undefined && caloriesBurned !== null
        ? Math.max(0, parseInt(String(caloriesBurned), 10))
        : null;

    const parsedDate = loggedAt ? new Date(loggedAt) : new Date();

    const newWorkout = await prisma.workoutLog.create({
      data: {
        userId: auth.dbUser.id,
        name: String(name).trim(),
        durationMinutes: parsedDuration,
        caloriesBurned: parsedCalories,
        notes: notes ? String(notes).trim() : null,
        loggedAt: isNaN(parsedDate.getTime()) ? new Date() : parsedDate,
      },
    });

    return NextResponse.json({
      success: true,
      workout: newWorkout,
    });
  } catch (error) {
    console.error("Failed to log workout:", error);
    return NextResponse.json(
      { error: "Failed to record workout session." },
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
        { error: "Workout ID is required." },
        { status: 400 }
      );
    }

    // Verify ownership and delete
    await prisma.workoutLog.deleteMany({
      where: {
        id,
        userId: auth.dbUser.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete workout log:", error);
    return NextResponse.json(
      { error: "Failed to delete workout." },
      { status: 500 }
    );
  }
}
