export interface ProfileMetricsInput {
  age?: number | null;
  gender?: string | null; // MALE | FEMALE | OTHER
  heightCm?: number | null;
  weightKg?: number | null;
  goalWeightKg?: number | null;
  activityLevel?: string | null; // SEDENTARY | LIGHT | MODERATE | ACTIVE | VERY_ACTIVE
  goal?: string | null; // LOSE_WEIGHT | MAINTAIN | BUILD_MUSCLE
  dietPreference?: string | null; // STANDARD | VEGETARIAN | VEGAN | KETO
}

export interface CalculatedTargets {
  bmr: number;
  tdee: number;
  targetCalories: number;
  targetProtein: number; // in grams
  targetCarbs: number; // in grams
  targetFat: number; // in grams
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

/**
 * Calculates Mifflin-St Jeor Basal Metabolic Rate (BMR),
 * Total Daily Energy Expenditure (TDEE), and macro distributions.
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
  const multiplier = ACTIVITY_MULTIPLIERS[activityKey] || 1.55;
  const tdee = Math.round(bmr * multiplier);

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
    // High-performance sports split:
    // Protein: ~2.0g per kg of bodyweight
    targetProtein = Math.round(weight * 2.0);
    const proteinCalories = targetProtein * 4;

    // Fat: ~25% of total caloric intake
    const fatCalories = targetCalories * 0.25;
    targetFat = Math.round(fatCalories / 9);

    // Carbs: Remaining calories
    const remainingCalories = Math.max(0, targetCalories - (proteinCalories + fatCalories));
    targetCarbs = Math.round(remainingCalories / 4);
  }

  return {
    bmr,
    tdee,
    targetCalories,
    targetProtein,
    targetCarbs,
    targetFat,
  };
}
