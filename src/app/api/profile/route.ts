import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/user";
import { calculateNutritionTargets } from "@/lib/calc";

export async function GET() {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: auth.dbUser.id },
    });

    const targets = profile
      ? calculateNutritionTargets({
          age: profile.age,
          gender: profile.gender,
          heightCm: profile.heightCm,
          weightKg: profile.weightKg,
          goalWeightKg: profile.goalWeightKg,
          activityLevel: profile.activityLevel,
          goal: profile.goal,
          dietPreference: profile.dietPreference,
        })
      : calculateNutritionTargets({});

    return NextResponse.json({
      user: {
        id: auth.dbUser.id,
        email: auth.dbUser.email,
        name: auth.dbUser.name,
      },
      profile,
      targets,
    });
  } catch (error) {
    console.error("Failed to fetch profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile data." },
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
    const {
      fullName,
      name,
      avatar,
      age,
      gender,
      heightCm,
      weightKg,
      goalWeightKg,
      activityLevel,
      goal,
      dietPreference,
      experienceLevel,
    } = body;

    // Update user name in database if provided
    if (fullName || name) {
      try {
        await prisma.user.update({
          where: { id: auth.dbUser.id },
          data: { name: fullName || name },
        });
      } catch (err) {
        console.warn("Could not update user name:", err);
      }
    }

    // Sanitize and validate numbers
    const parsedAge = age ? parseInt(String(age), 10) : null;
    const parsedHeight = heightCm ? parseFloat(String(heightCm)) : null;
    const parsedWeight = weightKg ? parseFloat(String(weightKg)) : null;
    const parsedGoalWeight = goalWeightKg ? parseFloat(String(goalWeightKg)) : null;

    // Calculate scientifically backed targets
    const targets = calculateNutritionTargets({
      age: parsedAge,
      gender,
      heightCm: parsedHeight,
      weightKg: parsedWeight,
      goalWeightKg: parsedGoalWeight,
      activityLevel,
      goal,
      dietPreference,
    });

    // Guaranteed upsert into PostgreSQL via Prisma
    const profile = await prisma.profile.upsert({
      where: { userId: auth.dbUser.id },
      update: {
        age: parsedAge,
        gender: gender || "MALE",
        heightCm: parsedHeight,
        weightKg: parsedWeight,
        goalWeightKg: parsedGoalWeight,
        activityLevel: activityLevel || "MODERATE",
        goal: goal || "MAINTAIN",
        dietPreference: dietPreference || "STANDARD",
        experienceLevel: experienceLevel || "INTERMEDIATE",
        targetCalories: targets.targetCalories,
        targetProtein: targets.targetProtein,
        targetCarbs: targets.targetCarbs,
        targetFat: targets.targetFat,
      },
      create: {
        userId: auth.dbUser.id,
        age: parsedAge,
        gender: gender || "MALE",
        heightCm: parsedHeight,
        weightKg: parsedWeight,
        goalWeightKg: parsedGoalWeight,
        activityLevel: activityLevel || "MODERATE",
        goal: goal || "MAINTAIN",
        dietPreference: dietPreference || "STANDARD",
        experienceLevel: experienceLevel || "INTERMEDIATE",
        targetCalories: targets.targetCalories,
        targetProtein: targets.targetProtein,
        targetCarbs: targets.targetCarbs,
        targetFat: targets.targetFat,
      },
    });

    return NextResponse.json({
      success: true,
      profile,
      targets,
    });
  } catch (error) {
    console.error("Failed to save profile:", error);
    return NextResponse.json(
      { error: "Failed to save profile. Please check your inputs and try again." },
      { status: 500 }
    );
  }
}
