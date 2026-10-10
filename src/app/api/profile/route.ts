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
          equipment: profile.equipment,
          splitDays: profile.splitDays,
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
      firstName,
      lastName,
      fullName,
      name,
      age,
      gender,
      heightCm,
      weightKg,
      goalWeightKg,
      equipment,
      splitDays,
      splitType,
      activityLevel,
      goal,
      dietPreference,
      experienceLevel,
      targetCalories,
      targetProtein,
      targetCarbs,
      targetFat,
      targetFiber,
      targetWaterLiters,
    } = body;

    // Fetch existing profile to preserve existing fields during partial updates (e.g. from AI coach)
    const existing = await prisma.profile.findUnique({
      where: { userId: auth.dbUser.id },
    });

    const resolvedFullName =
      fullName ||
      (firstName && lastName ? `${firstName} ${lastName}`.trim() : null) ||
      firstName ||
      name;

    // Update user name in database if provided
    if (resolvedFullName) {
      try {
        await prisma.user.update({
          where: { id: auth.dbUser.id },
          data: { name: resolvedFullName },
        });
      } catch (err) {
        console.warn("Could not update user name:", err);
      }
    }

    // Sanitize and validate numbers with fallback to existing profile
    const parsedAge = age !== undefined && age !== null ? parseInt(String(age), 10) : existing?.age ?? 26;
    const parsedHeight = heightCm !== undefined && heightCm !== null ? parseFloat(String(heightCm)) : existing?.heightCm ?? 178;
    const parsedWeight = weightKg !== undefined && weightKg !== null ? parseFloat(String(weightKg)) : existing?.weightKg ?? 80;
    const parsedGoalWeight = goalWeightKg !== undefined && goalWeightKg !== null ? parseFloat(String(goalWeightKg)) : existing?.goalWeightKg ?? 75;
    const parsedSplitDays = splitDays !== undefined && splitDays !== null ? parseInt(String(splitDays), 10) : existing?.splitDays ?? 4;

    const resolvedGender = gender || existing?.gender || "MALE";
    const resolvedEquipment = equipment || existing?.equipment || "COMMERCIAL_GYM";
    const resolvedActivity = activityLevel || existing?.activityLevel || "MODERATE";
    const resolvedGoal = goal || existing?.goal || "MAINTAIN";
    const resolvedDiet = dietPreference || existing?.dietPreference || "STANDARD";
    const resolvedExperience = experienceLevel || existing?.experienceLevel || "INTERMEDIATE";

    // Calculate scientifically backed baseline targets with USDA benchmarks
    const targets = calculateNutritionTargets({
      age: parsedAge,
      gender: resolvedGender,
      heightCm: parsedHeight,
      weightKg: parsedWeight,
      goalWeightKg: parsedGoalWeight,
      activityLevel: resolvedActivity,
      goal: resolvedGoal,
      dietPreference: resolvedDiet,
      equipment: resolvedEquipment,
      splitDays: parsedSplitDays,
    });

    // Custom calorie and macro overrides if provided
    const parsedTargetCalories = targetCalories ? parseInt(String(targetCalories), 10) : null;
    const parsedTargetProtein = targetProtein ? parseFloat(String(targetProtein)) : null;
    const parsedTargetCarbs = targetCarbs ? parseFloat(String(targetCarbs)) : null;
    const parsedTargetFat = targetFat ? parseFloat(String(targetFat)) : null;
    const parsedTargetFiber = targetFiber ? parseFloat(String(targetFiber)) : null;
    const parsedTargetWater = targetWaterLiters ? parseFloat(String(targetWaterLiters)) : null;

    const finalTargetCalories = parsedTargetCalories ?? existing?.targetCalories ?? targets.targetCalories;
    const finalTargetProtein = parsedTargetProtein ?? existing?.targetProtein ?? targets.targetProtein;
    const finalTargetCarbs = parsedTargetCarbs ?? existing?.targetCarbs ?? targets.targetCarbs;
    const finalTargetFat = parsedTargetFat ?? existing?.targetFat ?? targets.targetFat;
    const finalTargetFiber = parsedTargetFiber ?? existing?.targetFiber ?? targets.targetFiber;
    const finalTargetWater = parsedTargetWater ?? existing?.targetWaterLiters ?? targets.targetWaterLiters;

    // Guaranteed upsert into PostgreSQL via Prisma
    const profile = await prisma.profile.upsert({
      where: { userId: auth.dbUser.id },
      update: {
        firstName: firstName !== undefined ? firstName : existing?.firstName,
        lastName: lastName !== undefined ? lastName : existing?.lastName,
        age: parsedAge,
        gender: resolvedGender,
        heightCm: parsedHeight,
        weightKg: parsedWeight,
        goalWeightKg: parsedGoalWeight,
        equipment: resolvedEquipment,
        splitDays: parsedSplitDays,
        splitType: splitType || existing?.splitType || targets.splitInfo.name,
        activityLevel: resolvedActivity,
        goal: resolvedGoal,
        dietPreference: resolvedDiet,
        experienceLevel: resolvedExperience,
        targetCalories: finalTargetCalories,
        targetProtein: finalTargetProtein,
        targetCarbs: finalTargetCarbs,
        targetFat: finalTargetFat,
        targetFiber: finalTargetFiber,
        targetWaterLiters: finalTargetWater,
      },
      create: {
        userId: auth.dbUser.id,
        firstName: firstName || null,
        lastName: lastName || null,
        age: parsedAge,
        gender: resolvedGender,
        heightCm: parsedHeight,
        weightKg: parsedWeight,
        goalWeightKg: parsedGoalWeight,
        equipment: resolvedEquipment,
        splitDays: parsedSplitDays,
        splitType: splitType || targets.splitInfo.name,
        activityLevel: resolvedActivity,
        goal: resolvedGoal,
        dietPreference: resolvedDiet,
        experienceLevel: resolvedExperience,
        targetCalories: finalTargetCalories,
        targetProtein: finalTargetProtein,
        targetCarbs: finalTargetCarbs,
        targetFat: finalTargetFat,
        targetFiber: finalTargetFiber,
        targetWaterLiters: finalTargetWater,
      },
    });

    return NextResponse.json({
      success: true,
      profile,
      targets: {
        ...targets,
        targetCalories: finalTargetCalories,
        targetProtein: finalTargetProtein,
        targetCarbs: finalTargetCarbs,
        targetFat: finalTargetFat,
        targetFiber: finalTargetFiber,
        targetWaterLiters: finalTargetWater,
      },
    });
  } catch (error) {
    console.error("Failed to save profile:", error);
    return NextResponse.json(
      { error: "Failed to save profile. Please check your inputs and try again." },
      { status: 500 }
    );
  }
}
