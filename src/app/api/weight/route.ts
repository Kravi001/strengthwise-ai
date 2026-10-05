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
    const range = searchParams.get("range") || "ALL"; // 7D | 30D | 90D | ALL

    // Fetch user profile for biometrics and goals
    const profile = await prisma.profile.findUnique({
      where: { userId: auth.dbUser.id },
      select: {
        weightKg: true,
        goalWeightKg: true,
        goal: true,
        createdAt: true,
      },
    });

    const profileCurrentLbs = profile?.weightKg
      ? Math.round(profile.weightKg * 2.20462 * 10) / 10
      : 185;
    const profileGoalLbs = profile?.goalWeightKg
      ? Math.round(profile.goalWeightKg * 2.20462 * 10) / 10
      : 175;
    const goalType = profile?.goal || "LOSE_WEIGHT";

    // Date filtering if requested
    let dateFilter: Date | undefined;
    const now = new Date();
    if (range === "7D") {
      dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (range === "30D") {
      dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (range === "90D") {
      dateFilter = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    }

    const logs = await prisma.weightLog.findMany({
      where: {
        userId: auth.dbUser.id,
        ...(dateFilter ? { loggedAt: { gte: dateFilter } } : {}),
      },
      orderBy: {
        loggedAt: "asc",
      },
    });

    // If no logs exist yet, synthesize baseline log from user profile so chart is never empty
    type WeightPoint = {
      id?: string;
      date: string;
      rawDate: string;
      weight: number;
      goal: number;
      note?: string | null;
      isSynthetic?: boolean;
    };

    let chartData: WeightPoint[] = [];

    if (logs.length === 0) {
      // Create starting baseline point from profile registration
      const baseDate = profile?.createdAt ? new Date(profile.createdAt) : new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      chartData = [
        {
          date: baseDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          rawDate: baseDate.toISOString(),
          weight: profileCurrentLbs,
          goal: profileGoalLbs,
          note: "Baseline Profile Check-in",
          isSynthetic: true,
        },
        {
          date: now.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          rawDate: now.toISOString(),
          weight: profileCurrentLbs,
          goal: profileGoalLbs,
          note: "Current Profile Weight",
          isSynthetic: true,
        },
      ];
    } else {
      chartData = logs.map((log) => {
        const d = new Date(log.loggedAt);
        return {
          id: log.id,
          date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          rawDate: d.toISOString(),
          weight: Math.round(log.weightLbs * 10) / 10,
          goal: profileGoalLbs,
          note: log.note,
        };
      });
    }

    // Compute progress velocity & convergence
    const startingWeight = chartData.length > 0 ? chartData[0].weight : profileCurrentLbs;
    const currentWeight = chartData.length > 0 ? chartData[chartData.length - 1].weight : profileCurrentLbs;
    const totalChange = Math.round((currentWeight - startingWeight) * 10) / 10;
    const remainingToGoal = Math.round(Math.abs(currentWeight - profileGoalLbs) * 10) / 10;

    // Calculate weekly rate
    let weeklyRate = 0;
    if (chartData.length >= 2) {
      const firstDate = new Date(chartData[0].rawDate).getTime();
      const lastDate = new Date(chartData[chartData.length - 1].rawDate).getTime();
      const diffDays = Math.max(1, (lastDate - firstDate) / (1000 * 60 * 60 * 24));
      weeklyRate = Math.round(((currentWeight - startingWeight) / diffDays) * 7 * 10) / 10;
    }

    // Projected weeks
    let projectedWeeks: number | null = null;
    if (goalType === "LOSE_WEIGHT" && weeklyRate < -0.05) {
      projectedWeeks = Math.max(1, Math.round((currentWeight - profileGoalLbs) / Math.abs(weeklyRate)));
    } else if (goalType === "BUILD_MUSCLE" && weeklyRate > 0.05) {
      projectedWeeks = Math.max(1, Math.round((profileGoalLbs - currentWeight) / weeklyRate));
    }

    // Goal convergence percentage
    const initialDistance = Math.abs(startingWeight - profileGoalLbs);
    let convergencePercent = 100;
    if (initialDistance > 0) {
      const progressDistance = initialDistance - remainingToGoal;
      convergencePercent = Math.min(100, Math.max(0, Math.round((progressDistance / initialDistance) * 100)));
    } else if (remainingToGoal === 0) {
      convergencePercent = 100;
    }

    return NextResponse.json({
      logs: logs.map((l) => ({
        ...l,
        weightLbs: Math.round(l.weightLbs * 10) / 10,
        weightKg: Math.round(l.weightKg * 10) / 10,
      })),
      chartData,
      summary: {
        startingWeightLbs: startingWeight,
        currentWeightLbs: currentWeight,
        goalWeightLbs: profileGoalLbs,
        goalType,
        totalChangeLbs: totalChange,
        remainingToGoalLbs: remainingToGoal,
        weeklyRateLbs: weeklyRate,
        projectedWeeks,
        convergencePercent,
        hasLogs: logs.length > 0,
      },
    });
  } catch (error) {
    console.error("Failed to fetch weight logs:", error);
    return NextResponse.json(
      { error: "Failed to load weight tracking data." },
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
    const { weightLbs, weightKg, note, loggedAt } = body;

    let finalLbs = weightLbs ? parseFloat(String(weightLbs)) : null;
    let finalKg = weightKg ? parseFloat(String(weightKg)) : null;

    if (!finalLbs && !finalKg) {
      return NextResponse.json(
        { error: "Weight value is required." },
        { status: 400 }
      );
    }

    if (!finalLbs && finalKg) {
      finalLbs = Math.round(finalKg * 2.20462 * 10) / 10;
    } else if (finalLbs && !finalKg) {
      finalKg = Math.round((finalLbs / 2.20462) * 10) / 10;
    }

    if (!finalLbs || finalLbs < 50 || finalLbs > 700) {
      return NextResponse.json(
        { error: "Please enter a realistic weight value (50 - 700 lbs)." },
        { status: 400 }
      );
    }

    const logDate = loggedAt ? new Date(loggedAt) : new Date();

    const newLog = await prisma.weightLog.create({
      data: {
        userId: auth.dbUser.id,
        weightLbs: finalLbs,
        weightKg: finalKg!,
        note: note ? String(note).trim() : null,
        loggedAt: isNaN(logDate.getTime()) ? new Date() : logDate,
      },
    });

    // Keep profile current weight in sync with the latest weigh-in
    try {
      await prisma.profile.updateMany({
        where: { userId: auth.dbUser.id },
        data: { weightKg: finalKg },
      });
    } catch (profileErr) {
      console.warn("Could not sync profile weightKg:", profileErr);
    }

    return NextResponse.json({
      success: true,
      log: newLog,
    });
  } catch (error) {
    console.error("Failed to save weight log:", error);
    return NextResponse.json(
      { error: "Failed to record weight entry." },
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
        { error: "Weight log ID is required." },
        { status: 400 }
      );
    }

    await prisma.weightLog.deleteMany({
      where: {
        id,
        userId: auth.dbUser.id,
      },
    });

    // Resync latest remaining weigh-in with profile if available
    const latestLog = await prisma.weightLog.findFirst({
      where: { userId: auth.dbUser.id },
      orderBy: { loggedAt: "desc" },
    });

    if (latestLog) {
      await prisma.profile.updateMany({
        where: { userId: auth.dbUser.id },
        data: { weightKg: latestLog.weightKg },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete weight log:", error);
    return NextResponse.json(
      { error: "Failed to delete weight log." },
      { status: 500 }
    );
  }
}
