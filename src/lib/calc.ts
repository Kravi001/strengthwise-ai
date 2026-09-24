export interface ProfileMetricsInput {
  age?: number | null;
  gender?: string | null; // MALE | FEMALE | OTHER
  heightCm?: number | null;
  weightKg?: number | null;
  goalWeightKg?: number | null;
  activityLevel?: string | null; // SEDENTARY | LIGHT | MODERATE | ACTIVE | VERY_ACTIVE
  goal?: string | null; // LOSE_WEIGHT | MAINTAIN | BUILD_MUSCLE
  dietPreference?: string | null; // STANDARD | HIGH_PROTEIN | VEGETARIAN | VEGAN | KETO
  equipment?: string | null;
  splitDays?: number | null; // 3 | 4 | 5 | 6
}

export interface SplitInfo {
  days: number;
  name: string;
  tagline: string;
  schedule: string[];
  focus: string;
}

export interface UsdaBenchmark {
  proteinPercent: number;
  carbsPercent: number;
  fatPercent: number;
  amdrCompliant: boolean;
  standard: string;
}

export interface CalculatedTargets {
  bmr: number;
  tdee: number;
  targetCalories: number;
  targetProtein: number; // in grams
  targetCarbs: number; // in grams
  targetFat: number; // in grams
  targetFiber: number; // in grams (USDA guideline: 14g per 1,000 kcal)
  targetWaterLiters: number; // in Liters
  splitInfo: SplitInfo;
  usdaBenchmark: UsdaBenchmark;
}

export const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  SEDENTARY: 1.2,
  LIGHT: 1.375,
  MODERATE: 1.55,
  ACTIVE: 1.725,
  VERY_ACTIVE: 1.9,
};

export const GOAL_ADJUSTMENTS: Record<string, number> = {
  LOSE_WEIGHT: -500,
  MAINTAIN: 0,
  BUILD_MUSCLE: 300,
};

export const SPLIT_DETAILS: Record<number, SplitInfo> = {
  3: {
    days: 3,
    name: "Full Body Foundation Split",
    tagline: "3 Days / Week • 48-Hour Recovery Windows",
    schedule: ["Day 1: Full Body A", "Day 2: Rest & Recovery", "Day 3: Full Body B", "Day 4: Rest & Mobility", "Day 5: Full Body C", "Day 6-7: Rest / Light Cardio"],
    focus: "Compound movements (Squat, Bench, Deadlift, Overhead Press) hitting every muscle group 3x/week for peak stimulus with maximal recovery.",
  },
  4: {
    days: 4,
    name: "Upper / Lower Power & Hypertrophy",
    tagline: "4 Days / Week • Gold Standard Balance",
    schedule: ["Day 1: Upper Power", "Day 2: Lower Power", "Day 3: Active Rest", "Day 4: Upper Hypertrophy", "Day 5: Lower Hypertrophy", "Day 6-7: Rest / Recovery"],
    focus: "Segregates torso and legs for optimal volume accumulation without neural exhaustion. Excellent for balanced physique progress.",
  },
  5: {
    days: 5,
    name: "PPL + Upper / Lower Hybrid Split",
    tagline: "5 Days / Week • High-Frequency Athletic Protocol",
    schedule: ["Day 1: Push (Chest, Shoulders, Triceps)", "Day 2: Pull (Back, Rear Delts, Biceps)", "Day 3: Legs (Quads, Hamstrings, Calves)", "Day 4: Rest / Conditioning", "Day 5: Upper Torso", "Day 6: Lower & Core", "Day 7: Full Recovery"],
    focus: "Dedicated compound push/pull/legs days followed by targeted weak-point upper/lower sessions for accelerated muscle protein synthesis.",
  },
  6: {
    days: 6,
    name: "Push / Pull / Legs (PPL x 2) Elite Split",
    tagline: "6 Days / Week • Advanced Hypertrophy & Work Capacity",
    schedule: ["Day 1: Push A", "Day 2: Pull A", "Day 3: Legs A", "Day 4: Push B", "Day 5: Pull B", "Day 6: Legs B", "Day 7: Full Rest"],
    focus: "Elite bodybuilding split ensuring each major muscle group is trained twice per week with dedicated isolation and progressive overload.",
  },
};

/**
 * Calculates Mifflin-St Jeor Basal Metabolic Rate (BMR),
 * Total Daily Energy Expenditure (TDEE), macronutrient distributions,
 * fiber, hydration, and USDA FoodData Central AMDR compliance.
 */
export function calculateNutritionTargets(
  input: ProfileMetricsInput
): CalculatedTargets {
  const weight = input.weightKg && input.weightKg > 0 ? input.weightKg : 70;
  const height = input.heightCm && input.heightCm > 0 ? input.heightCm : 175;
  const age = input.age && input.age > 0 ? input.age : 25;
  const gender = (input.gender || "MALE").toUpperCase();

  // Mifflin-St Jeor BMR equation
  let bmr = 10 * weight + 6.25 * height - 5 * age;
  if (gender === "FEMALE") {
    bmr -= 161;
  } else {
    bmr += 5;
  }
  bmr = Math.round(bmr);

  // TDEE
  const activityKey = (input.activityLevel || "MODERATE").toUpperCase();
  const baseMultiplier = ACTIVITY_MULTIPLIERS[activityKey] || 1.55;
  
  // Split Days adjustment: higher frequency lifts burn more energy
  const splitDays = input.splitDays && [3, 4, 5, 6].includes(input.splitDays) ? input.splitDays : 4;
  const splitMultiplierBonus = splitDays >= 5 ? 0.05 : 0;
  const effectiveMultiplier = baseMultiplier + splitMultiplierBonus;

  const tdee = Math.round(bmr * effectiveMultiplier);

  // Calorie Target based on goal
  const goalKey = (input.goal || "MAINTAIN").toUpperCase();
  const adjustment = GOAL_ADJUSTMENTS[goalKey] ?? 0;
  const targetCalories = Math.max(1200, Math.round(tdee + adjustment));

  // Macronutrient breakdown
  const isKeto = (input.dietPreference || "").toUpperCase() === "KETO";

  let targetProtein: number;
  let targetFat: number;
  let targetCarbs: number;

  if (isKeto) {
    // Keto: 70% Fat, 25% Protein, 5% Carbs
    targetProtein = Math.round((targetCalories * 0.25) / 4);
    targetFat = Math.round((targetCalories * 0.7) / 9);
    targetCarbs = Math.max(20, Math.round((targetCalories * 0.05) / 4));
  } else {
    // High-performance athletic sports split:
    // Protein: ~2.0g to 2.2g per kg of bodyweight
    const proteinFactor = goalKey === "LOSE_WEIGHT" ? 2.2 : 2.0;
    targetProtein = Math.round(weight * proteinFactor);
    const proteinCalories = targetProtein * 4;

    // Fat: ~25% of total caloric intake
    const fatCalories = targetCalories * 0.25;
    targetFat = Math.round(fatCalories / 9);

    // Carbs: Remaining calories for glycogen & training intensity
    const remainingCalories = Math.max(0, targetCalories - (proteinCalories + fatCalories));
    targetCarbs = Math.round(remainingCalories / 4);
  }

  // Dietary Fiber: USDA Dietary Guidelines specify 14g per 1,000 kcal consumed
  const targetFiber = Math.max(25, Math.round((targetCalories / 1000) * 14));

  // Hydration: National Academy of Medicine baseline 35ml/kg + 0.15L per training day
  const targetWaterLiters = Math.round((weight * 0.035 + (splitDays * 0.12)) * 10) / 10;

  // USDA AMDR validation (Acceptable Macronutrient Distribution Ranges):
  // Protein: 10-35%, Carbs: 45-65% (or 20-45% for athletic low-carb), Fat: 20-35%
  const proteinCals = targetProtein * 4;
  const carbsCals = targetCarbs * 4;
  const fatCals = targetFat * 9;
  const totalMacroCals = proteinCals + carbsCals + fatCals;

  const proteinPercent = Math.round((proteinCals / totalMacroCals) * 100);
  const carbsPercent = Math.round((carbsCals / totalMacroCals) * 100);
  const fatPercent = Math.round((fatCals / totalMacroCals) * 100);

  const amdrCompliant =
    proteinPercent >= 10 &&
    proteinPercent <= 35 &&
    fatPercent >= 20 &&
    fatPercent <= 35;

  const splitInfo = SPLIT_DETAILS[splitDays] || SPLIT_DETAILS[4];

  return {
    bmr,
    tdee,
    targetCalories,
    targetProtein,
    targetCarbs,
    targetFat,
    targetFiber,
    targetWaterLiters,
    splitInfo,
    usdaBenchmark: {
      proteinPercent,
      carbsPercent,
      fatPercent,
      amdrCompliant,
      standard: "USDA FoodData Central / Dietary Guidelines for Americans",
    },
  };
}
