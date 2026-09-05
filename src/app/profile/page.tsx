"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  Activity,
  AlertCircle,
  Calculator,
  CheckCircle2,
  Flame,
  Lock,
  RefreshCw,
  Save,
  Scale,
  Sparkles,
  User,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { calculateNutritionTargets, type CalculatedTargets } from "@/lib/calc";

export default function ProfilePage() {
  const [sessionLoading, setSessionLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Form Fields (internally stored in metric units)
  const [unitSystem, setUnitSystem] = useState<"metric" | "imperial">("imperial");
  const [age, setAge] = useState<number | "">(26);
  const [gender, setGender] = useState<string>("MALE");
  const [heightCm, setHeightCm] = useState<number | "">(178);
  const [weightKg, setWeightKg] = useState<number | "">(77);
  const [goalWeightKg, setGoalWeightKg] = useState<number | "">(75);
  const [activityLevel, setActivityLevel] = useState<string>("MODERATE");
  const [goal, setGoal] = useState<string>("BUILD_MUSCLE");
  const [dietPreference, setDietPreference] = useState<string>("STANDARD");
  const [experienceLevel, setExperienceLevel] = useState<string>("INTERMEDIATE");

  // Display fields for Imperial
  const [heightFt, setHeightFt] = useState<number | "">(5);
  const [heightIn, setHeightIn] = useState<number | "">(10);
  const [weightLbs, setWeightLbs] = useState<number | "">(170);
  const [goalWeightLbs, setGoalWeightLbs] = useState<number | "">(165);

  const [saving, startSaveTransition] = useTransition();
  const [statusMsg, setStatusMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const supabase = createClient();

  // Synchronize Imperial <-> Metric
  const updateWeightFromLbs = (lbs: number) => {
    setWeightLbs(lbs);
    setWeightKg(Math.round(lbs / 2.20462 * 10) / 10);
  };

  const updateGoalWeightFromLbs = (lbs: number) => {
    setGoalWeightLbs(lbs);
    setGoalWeightKg(Math.round(lbs / 2.20462 * 10) / 10);
  };

  const updateHeightFromFtIn = (ft: number, inch: number) => {
    setHeightFt(ft);
    setHeightIn(inch);
    const totalInches = ft * 12 + inch;
    setHeightCm(Math.round(totalInches * 2.54));
  };

  const updateHeightFromCm = (cm: number) => {
    setHeightCm(cm);
    const totalInches = cm / 2.54;
    setHeightFt(Math.floor(totalInches / 12));
    setHeightIn(Math.round(totalInches % 12));
  };

  const updateWeightFromKg = (kg: number) => {
    setWeightKg(kg);
    setWeightLbs(Math.round(kg * 2.20462));
  };

  const updateGoalWeightFromKg = (kg: number) => {
    setGoalWeightKg(kg);
    setGoalWeightLbs(Math.round(kg * 2.20462));
  };

  // Live scientific calculations
  const targets: CalculatedTargets = calculateNutritionTargets({
    age: typeof age === "number" ? age : null,
    gender,
    heightCm: typeof heightCm === "number" ? heightCm : null,
    weightKg: typeof weightKg === "number" ? weightKg : null,
    goalWeightKg: typeof goalWeightKg === "number" ? goalWeightKg : null,
    activityLevel,
    goal,
    dietPreference,
  });

  // Load user profile on mount
  useEffect(() => {
    async function loadData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setIsAuthenticated(false);
          setSessionLoading(false);
          return;
        }

        setIsAuthenticated(true);
        setUserEmail(user.email || null);

        // Fetch profile from Prisma API
        const res = await fetch("/api/profile");
        if (res.ok) {
          const data = await res.json();
          if (data.profile) {
            const p = data.profile;
            if (p.age) setAge(p.age);
            if (p.gender) setGender(p.gender);
            if (p.heightCm) updateHeightFromCm(p.heightCm);
            if (p.weightKg) updateWeightFromKg(p.weightKg);
            if (p.goalWeightKg) updateGoalWeightFromKg(p.goalWeightKg);
            if (p.activityLevel) setActivityLevel(p.activityLevel);
            if (p.goal) setGoal(p.goal);
            if (p.dietPreference) setDietPreference(p.dietPreference);
            if (p.experienceLevel) setExperienceLevel(p.experienceLevel);
          }
        }
      } catch (err) {
        console.error("Error loading profile:", err);
      } finally {
        setSessionLoading(false);
      }
    }

    loadData();
  }, [supabase]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    startSaveTransition(async () => {
      try {
        const res = await fetch("/api/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            age: typeof age === "number" ? age : null,
            gender,
            heightCm: typeof heightCm === "number" ? heightCm : null,
            weightKg: typeof weightKg === "number" ? weightKg : null,
            goalWeightKg: typeof goalWeightKg === "number" ? goalWeightKg : null,
            activityLevel,
            goal,
            dietPreference,
            experienceLevel,
          }),
        });

        const result = await res.json();
        if (!res.ok) {
          throw new Error(result.error || "Failed to save profile.");
        }

        setStatusMsg({
          type: "success",
          text: "Profile and sports nutrition targets saved successfully!",
        });
      } catch (err: unknown) {
        setStatusMsg({
          type: "error",
          text:
            err instanceof Error ? err.message : "An unexpected error occurred.",
        });
      }
    });
  };

  if (sessionLoading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-neutral-400">
          <RefreshCw className="h-5 w-5 animate-spin text-emerald-400" />
          <span>Loading your StrengthWise athlete profile...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900/60 p-8 text-center backdrop-blur-xl shadow-2xl space-y-5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
            <Lock className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-white">Sign In Required</h2>
          <p className="text-sm text-neutral-400">
            Please create an account or sign in to configure your strength profile and target sports nutrition.
          </p>
          <div className="pt-2">
            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-neutral-950 hover:bg-emerald-400 transition"
            >
              <User className="h-4 w-4" />
              <span>Go to Sign In / Sign Up</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-0.5 text-xs font-medium text-emerald-400 mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Athlete Profile & Nutrition Targets</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Personal Health & Performance
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Logged in as <span className="text-neutral-200 font-mono">{userEmail}</span>
          </p>
        </div>

        {/* Unit Toggle */}
        <div className="flex items-center gap-1 rounded-xl bg-neutral-900 p-1 border border-neutral-800 self-start">
          <button
            type="button"
            onClick={() => setUnitSystem("imperial")}
            className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
              unitSystem === "imperial"
                ? "bg-emerald-500 text-neutral-950 font-semibold"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            Imperial (lbs, ft)
          </button>
          <button
            type="button"
            onClick={() => setUnitSystem("metric")}
            className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
              unitSystem === "metric"
                ? "bg-emerald-500 text-neutral-950 font-semibold"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            Metric (kg, cm)
          </button>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`flex items-center gap-2 rounded-xl border p-4 text-sm ${
            statusMsg.type === "success"
              ? "border-emerald-900/40 bg-emerald-950/30 text-emerald-300"
              : "border-red-900/40 bg-red-950/30 text-red-300"
          }`}
        >
          {statusMsg.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Column */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSave} className="space-y-6">
            {/* Physical Stats Card */}
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 backdrop-blur-xl space-y-4">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Scale className="h-4 w-4 text-emerald-400" />
                Physical Metrics
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Age */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-300">Age</label>
                  <input
                    type="number"
                    min={12}
                    max={120}
                    value={age}
                    onChange={(e) =>
                      setAge(e.target.value ? parseInt(e.target.value, 10) : "")
                    }
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-2 px-3 text-sm text-neutral-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* Gender */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-300">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-2 px-3 text-sm text-neutral-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other / Non-binary</option>
                  </select>
                </div>

                {/* Height */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-300">
                    Height {unitSystem === "imperial" ? "(ft / in)" : "(cm)"}
                  </label>
                  {unitSystem === "imperial" ? (
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="Feet"
                        min={3}
                        max={8}
                        value={heightFt}
                        onChange={(e) => {
                          const val = e.target.value ? parseInt(e.target.value, 10) : 0;
                          updateHeightFromFtIn(val, Number(heightIn) || 0);
                        }}
                        className="rounded-xl border border-neutral-800 bg-neutral-950 py-2 px-3 text-sm text-neutral-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      <input
                        type="number"
                        placeholder="Inches"
                        min={0}
                        max={11}
                        value={heightIn}
                        onChange={(e) => {
                          const val = e.target.value ? parseInt(e.target.value, 10) : 0;
                          updateHeightFromFtIn(Number(heightFt) || 0, val);
                        }}
                        className="rounded-xl border border-neutral-800 bg-neutral-950 py-2 px-3 text-sm text-neutral-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  ) : (
                    <input
                      type="number"
                      min={100}
                      max={250}
                      value={heightCm}
                      onChange={(e) => {
                        const val = e.target.value ? parseFloat(e.target.value) : 0;
                        updateHeightFromCm(val);
                      }}
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-2 px-3 text-sm text-neutral-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  )}
                </div>

                {/* Weight */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-300">
                    Current Weight {unitSystem === "imperial" ? "(lbs)" : "(kg)"}
                  </label>
                  {unitSystem === "imperial" ? (
                    <input
                      type="number"
                      min={50}
                      max={600}
                      value={weightLbs}
                      onChange={(e) => {
                        const val = e.target.value ? parseFloat(e.target.value) : 0;
                        updateWeightFromLbs(val);
                      }}
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-2 px-3 text-sm text-neutral-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  ) : (
                    <input
                      type="number"
                      min={25}
                      max={300}
                      value={weightKg}
                      onChange={(e) => {
                        const val = e.target.value ? parseFloat(e.target.value) : 0;
                        updateWeightFromKg(val);
                      }}
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-2 px-3 text-sm text-neutral-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  )}
                </div>

                {/* Goal Weight */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-medium text-neutral-300">
                    Target Goal Weight {unitSystem === "imperial" ? "(lbs)" : "(kg)"}
                  </label>
                  {unitSystem === "imperial" ? (
                    <input
                      type="number"
                      min={50}
                      max={600}
                      value={goalWeightLbs}
                      onChange={(e) => {
                        const val = e.target.value ? parseFloat(e.target.value) : 0;
                        updateGoalWeightFromLbs(val);
                      }}
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-2 px-3 text-sm text-neutral-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  ) : (
                    <input
                      type="number"
                      min={25}
                      max={300}
                      value={goalWeightKg}
                      onChange={(e) => {
                        const val = e.target.value ? parseFloat(e.target.value) : 0;
                        updateGoalWeightFromKg(val);
                      }}
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-2 px-3 text-sm text-neutral-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Goals & Activity Card */}
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 backdrop-blur-xl space-y-4">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-400" />
                Goals & Lifestyle
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Fitness Goal */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-300">Primary Goal</label>
                  <select
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-2 px-3 text-sm text-neutral-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="LOSE_WEIGHT">Fat Loss (500 kcal Deficit)</option>
                    <option value="MAINTAIN">Maintain / Recomposition</option>
                    <option value="BUILD_MUSCLE">Muscle Gain (300 kcal Surplus)</option>
                  </select>
                </div>

                {/* Activity Level */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-300">Activity Level</label>
                  <select
                    value={activityLevel}
                    onChange={(e) => setActivityLevel(e.target.value)}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-2 px-3 text-sm text-neutral-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="SEDENTARY">Sedentary (Desk job, little exercise)</option>
                    <option value="LIGHT">Lightly Active (1-3 workout days/wk)</option>
                    <option value="MODERATE">Moderately Active (3-5 workout days/wk)</option>
                    <option value="ACTIVE">Very Active (6-7 intense days/wk)</option>
                    <option value="VERY_ACTIVE">Athletic / Heavy Physical Labor</option>
                  </select>
                </div>

                {/* Diet Preference */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-300">Diet Preference</label>
                  <select
                    value={dietPreference}
                    onChange={(e) => setDietPreference(e.target.value)}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-2 px-3 text-sm text-neutral-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="STANDARD">Standard Omnivore</option>
                    <option value="VEGETARIAN">Vegetarian</option>
                    <option value="VEGAN">Vegan</option>
                    <option value="KETO">Ketogenic (High Fat, Low Carb)</option>
                  </select>
                </div>

                {/* Experience */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-300">Lifting Experience</label>
                  <select
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-2 px-3 text-sm text-neutral-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="BEGINNER">Beginner (&lt; 1 year)</option>
                    <option value="INTERMEDIATE">Intermediate (1-3 years)</option>
                    <option value="ADVANCED">Advanced (3+ years)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <button
              type="submit"
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-3 text-sm font-semibold text-neutral-950 shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-emerald-500 transition disabled:opacity-50"
            >
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin text-neutral-950" />
                  <span>Saving Profile to PostgreSQL...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Profile & Targets</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Live Targets Column */}
        <div className="space-y-6">
          <div className="sticky top-24 rounded-2xl border border-neutral-800 bg-neutral-900/80 p-6 backdrop-blur-xl shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Calculator className="h-4 w-4 text-emerald-400" />
                Calculated Targets
              </h2>
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                Real-Time
              </span>
            </div>

            {/* Calories Banner */}
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-center">
              <span className="text-xs uppercase tracking-wider text-neutral-400 font-medium">
                Daily Calorie Target
              </span>
              <div className="text-3xl font-extrabold text-emerald-400 mt-1">
                {targets.targetCalories}{" "}
                <span className="text-sm font-normal text-neutral-300">kcal/day</span>
              </div>
              <div className="flex items-center justify-center gap-4 text-xs text-neutral-400 mt-2 pt-2 border-t border-emerald-500/10">
                <div>
                  BMR: <span className="text-neutral-200 font-medium">{targets.bmr}</span>
                </div>
                <div>
                  TDEE: <span className="text-neutral-200 font-medium">{targets.tdee}</span>
                </div>
              </div>
            </div>

            {/* Macro Splits */}
            <div className="space-y-3">
              <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                Target Macronutrient Split
              </span>

              {/* Protein */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 font-bold text-xs">
                    P
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">Protein</h4>
                    <p className="text-[10px] text-neutral-400">Muscle repair & growth</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-emerald-400">
                    {targets.targetProtein}g
                  </span>
                  <p className="text-[10px] text-neutral-500">
                    {targets.targetProtein * 4} kcal
                  </p>
                </div>
              </div>

              {/* Carbs */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 font-bold text-xs">
                    C
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">Carbohydrates</h4>
                    <p className="text-[10px] text-neutral-400">Energy & glycogen</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-cyan-400">
                    {targets.targetCarbs}g
                  </span>
                  <p className="text-[10px] text-neutral-500">
                    {targets.targetCarbs * 4} kcal
                  </p>
                </div>
              </div>

              {/* Fat */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 font-bold text-xs">
                    F
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">Fats</h4>
                    <p className="text-[10px] text-neutral-400">Hormonal balance</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-amber-400">
                    {targets.targetFat}g
                  </span>
                  <p className="text-[10px] text-neutral-500">
                    {targets.targetFat * 9} kcal
                  </p>
                </div>
              </div>
            </div>

            {/* Sports Science Note */}
            <div className="rounded-xl border border-neutral-800/80 bg-neutral-950/50 p-3.5 text-xs text-neutral-400 space-y-1">
              <div className="flex items-center gap-1.5 font-medium text-neutral-300">
                <Flame className="h-3.5 w-3.5 text-orange-400" />
                <span>Sports Science Formula</span>
              </div>
              <p className="text-[11px] leading-relaxed text-neutral-400">
                Calculated using the Mifflin-St Jeor equation and standard athletic protein allocations (~2.0g/kg).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
