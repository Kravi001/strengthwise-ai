"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Card,
  Text,
  Title,
  DonutChart,
  ProgressBar,
} from "@/components/tremor";
import {
  ArrowRight,
  Flame,
  Lock,
  Plus,
  Scan,
  Search,
  Sparkles,
  Trash2,
  Utensils,
  Zap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { calculateNutritionTargets } from "@/lib/calc";
import { FoodScannerModal } from "@/components/food-scanner-modal";
import type { User } from "@supabase/supabase-js";

export default function MealsPage() {
  const supabase = createClient();

  const [authUser, setAuthUser] = useState<User | null>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [loading, setLoading] = useState(true);

  // Profile biometrics
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState<number>(26);
  const [gender, setGender] = useState<"MALE" | "FEMALE">("MALE");
  const [heightFt, setHeightFt] = useState<number>(6);
  const [heightIn, setHeightIn] = useState<number>(3);
  const [currentWeightLbs, setCurrentWeightLbs] = useState<number>(185);
  const [goalWeightLbs, setGoalWeightLbs] = useState<number>(175);
  const [goal, setGoal] = useState<"CUT" | "MAINTAIN" | "BULK">("BULK");
  const [activityLevel, setActivityLevel] = useState<string>("MODERATE");
  const [customCalories, setCustomCalories] = useState<number | null>(null);
  const [customProtein, setCustomProtein] = useState<number | null>(null);
  const [customCarbs, setCustomCarbs] = useState<number | null>(null);
  const [customFat, setCustomFat] = useState<number | null>(null);

  // Calculations
  const numWeightLbs = Number(currentWeightLbs) || 185;
  const numWeightKg = numWeightLbs / 2.20462;
  const totalInches = (Number(heightFt) || 6) * 12 + (Number(heightIn) || 0);
  const heightCm = totalInches * 2.54;

  const calculated = useMemo(() => {
    const base = calculateNutritionTargets({
      age: Number(age) || 26,
      gender: gender,
      heightCm: heightCm,
      weightKg: numWeightKg,
      activityLevel: activityLevel,
      goal: goal === "CUT" ? "LOSE_WEIGHT" : goal === "BULK" ? "BUILD_MUSCLE" : "MAINTAIN",
    });

    if (customCalories && customCalories > 500) {
      const diffRatio = customCalories / (base.targetCalories || 2000);
      return {
        ...base,
        targetCalories: customCalories,
        targetProtein: customProtein ? Math.round(customProtein) : base.targetProtein,
        targetCarbs: customCarbs ? Math.round(customCarbs) : Math.max(30, Math.round(base.targetCarbs * diffRatio)),
        targetFat: customFat ? Math.round(customFat) : Math.max(30, Math.round(base.targetFat * diffRatio)),
        isCustom: true,
      };
    }

    return { ...base, isCustom: false };
  }, [age, gender, heightCm, numWeightKg, activityLevel, goal, customCalories, customProtein, customCarbs, customFat]);

  const chartData = [
    { name: "Protein", value: calculated.targetProtein, color: "#10b981" },
    { name: "Carbs", value: calculated.targetCarbs, color: "#06b6d4" },
    { name: "Fats", value: calculated.targetFat, color: "#f59e0b" },
  ];

  // Meal Logging & Food Scanner State
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerInitialMeal, setScannerInitialMeal] = useState<"BREAKFAST" | "LUNCH" | "DINNER" | "SNACK">("LUNCH");
  const [scannerInitialTab, setScannerInitialTab] = useState<"scan" | "search" | "quick">("scan");
  const [loggedMealsData, setLoggedMealsData] = useState<{
    meals: any[];
    grouped: { BREAKFAST: any[]; LUNCH: any[]; DINNER: any[]; SNACK: any[] };
    totals: { calories: number; protein: number; carbs: number; fat: number; fiber: number };
    remaining: { calories: number; protein: number; carbs: number; fat: number; fiber: number };
  }>({
    meals: [],
    grouped: { BREAKFAST: [], LUNCH: [], DINNER: [], SNACK: [] },
    totals: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
    remaining: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
  });

  const fetchLoggedMeals = async () => {
    try {
      const res = await fetch("/api/meals");
      if (res.ok) {
        const data = await res.json();
        setLoggedMealsData(data);
      }
    } catch (err) {
      console.warn("Failed to fetch meals:", err);
    }
  };

  const handleDeleteMeal = async (id: string) => {
    try {
      await fetch(`/api/meals?id=${id}`, { method: "DELETE" });
      await fetchLoggedMeals();
    } catch (err) {
      console.warn("Failed to delete meal:", err);
    }
  };

  useEffect(() => {
    document.title = "Meals & Macro Nutrition — StrengthWise AI";
    async function loadData() {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        setAuthUser(currentUser);

        if (!currentUser) {
          if (typeof window !== "undefined") {
            window.location.replace("/profile");
          }
          return;
        }

        // Fetch DB profile
        if (currentUser) {
          const res = await fetch("/api/profile");
          if (res.ok) {
            const data = await res.json();
            if (data.profile) {
              setHasProfile(true);
              if (data.user?.name) setFullName(data.user.name);
              else if (data.profile.name) setFullName(data.profile.name);
              if (data.profile.age) setAge(data.profile.age);
              if (data.profile.gender) setGender(data.profile.gender);
              if (data.profile.heightCm) {
                const totalIn = Math.round(data.profile.heightCm / 2.54);
                setHeightFt(Math.floor(totalIn / 12));
                setHeightIn(totalIn % 12);
              }
              if (data.profile.weightKg) setCurrentWeightLbs(Math.round(data.profile.weightKg * 2.20462));
              if (data.profile.goalWeightKg) setGoalWeightLbs(Math.round(data.profile.goalWeightKg * 2.20462));
              if (data.profile.goal) {
                setGoal(data.profile.goal === "LOSE_WEIGHT" ? "CUT" : data.profile.goal === "BUILD_MUSCLE" ? "BULK" : "MAINTAIN");
              }
              if (data.profile.activityLevel) setActivityLevel(data.profile.activityLevel);
              if (data.profile.targetCalories) setCustomCalories(data.profile.targetCalories);
              if (data.profile.targetProtein) setCustomProtein(data.profile.targetProtein);
              if (data.profile.targetCarbs) setCustomCarbs(data.profile.targetCarbs);
              if (data.profile.targetFat) setCustomFat(data.profile.targetFat);
            }
          }
          await fetchLoggedMeals();
        }

        // Local storage fallback
        if (typeof window !== "undefined") {
          const stored = localStorage.getItem("sw_athlete_profile");
          if (stored) {
            const p = JSON.parse(stored);
            if (p.isCompleted || p.age || p.weightLbs) {
              setHasProfile(true);
              if (p.fullName) setFullName(p.fullName);
              if (p.age) setAge(p.age);
              if (p.gender) setGender(p.gender);
              if (p.heightFt) setHeightFt(p.heightFt);
              if (p.heightIn !== undefined) setHeightIn(p.heightIn);
              if (p.weightLbs) setCurrentWeightLbs(p.weightLbs);
              if (p.goalWeightLbs) setGoalWeightLbs(p.goalWeightLbs);
              if (p.goal) setGoal(p.goal);
              if (p.activityLevel) setActivityLevel(p.activityLevel);
              if (p.targetCalories || p.targets?.targetCalories) {
                setCustomCalories(p.targetCalories || p.targets?.targetCalories);
              }
              if (p.targetProtein || p.targets?.targetProtein) {
                setCustomProtein(p.targetProtein || p.targets?.targetProtein);
              }
              if (p.targetCarbs || p.targets?.targetCarbs) {
                setCustomCarbs(p.targetCarbs || p.targets?.targetCarbs);
              }
              if (p.targetFat || p.targets?.targetFat) {
                setCustomFat(p.targetFat || p.targets?.targetFat);
              }
            }
          }
        }
      } catch (err) {
        console.warn("Error loading meals page data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();

    // Listen for cross-tab or coach chat profile updates to immediately reflect new targets
    const handleProfileUpdate = () => {
      try {
        const stored = localStorage.getItem("sw_athlete_profile");
        if (stored) {
          const p = JSON.parse(stored);
          if (p.targetCalories || p.targets?.targetCalories) {
            setCustomCalories(p.targetCalories || p.targets?.targetCalories);
          }
          if (p.targetProtein || p.targets?.targetProtein) {
            setCustomProtein(p.targetProtein || p.targets?.targetProtein);
          }
          if (p.targetCarbs || p.targets?.targetCarbs) {
            setCustomCarbs(p.targetCarbs || p.targets?.targetCarbs);
          }
          if (p.targetFat || p.targets?.targetFat) {
            setCustomFat(p.targetFat || p.targets?.targetFat);
          }
        }
      } catch {}
      fetchLoggedMeals();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("sw_profile_updated", handleProfileUpdate);
      window.addEventListener("storage", handleProfileUpdate);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("sw_profile_updated", handleProfileUpdate);
        window.removeEventListener("storage", handleProfileUpdate);
      }
    };
  }, [supabase]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-10 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800/80 pb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">
            <Utensils className="h-3.5 w-3.5" />
            <span>Precision Sports Nutrition</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Metabolic Architecture &amp; Macro Distribution
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400">
            Clinical Mifflin-St Jeor metabolic calculations tailored to your exact bodyweight, biological sex, and training phase.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setScannerInitialMeal("LUNCH");
              setScannerInitialTab("scan");
              setIsScannerOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 px-4 py-2 text-xs font-bold text-neutral-950 shadow-md shadow-emerald-500/20 hover:from-emerald-400 hover:to-emerald-300 transition active:scale-[0.98]"
          >
            <Scan className="h-4 w-4" />
            <span>Scan Food / Barcode</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setScannerInitialMeal("LUNCH");
              setScannerInitialTab("search");
              setIsScannerOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-700 bg-neutral-800 px-3.5 py-2 text-xs font-semibold text-neutral-200 hover:bg-neutral-700 hover:text-white transition"
          >
            <Search className="h-3.5 w-3.5 text-cyan-400" />
            <span>Search Foods</span>
          </button>
        </div>
      </div>

      {/* Gated Overlay if Profile Not Configured */}
      {!hasProfile && !loading && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 sm:p-6 backdrop-blur-md shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Default Macro Calibration Loaded</h3>
              <p className="text-xs text-neutral-300 mt-0.5">
                Complete your athlete profile biometrics (weight, height, body goal) to calibrate personal Mifflin-St Jeor metabolic formulas.
              </p>
            </div>
          </div>
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-neutral-950 hover:bg-amber-400 transition shrink-0"
          >
            <span>Configure Athlete Profile</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* Live Interactive Nutrition Calculator Card */}
      <Card className="bg-neutral-900/80 border-neutral-800 p-6 sm:p-8 shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Breakdown details */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              <div className="text-xs uppercase font-mono tracking-wider text-emerald-400 font-bold mb-1">
                Athlete Targets
              </div>
              <Title className="text-white text-base">
                {fullName ? `${fullName}'s Nutritional Blueprint` : "Daily Metabolic Fuel"}
              </Title>
              <Text className="text-neutral-400 text-xs mb-3">
                Calibrated for {numWeightLbs} lbs ({Math.round(numWeightKg)} kg) athlete in {goal === "CUT" ? "Fat Loss (-20%)" : goal === "BULK" ? "Muscle Surplus (+10%)" : "Maintenance"} phase:
              </Text>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setGoal("CUT")}
                  className={`rounded-xl py-2.5 px-3 text-xs font-bold transition border ${
                    goal === "CUT"
                      ? "bg-amber-500/20 border-amber-500 text-amber-400 shadow-sm"
                      : "bg-neutral-800/60 border-neutral-700 text-neutral-400 hover:text-white"
                  }`}
                >
                  Fat Loss (-20%)
                </button>
                <button
                  type="button"
                  onClick={() => setGoal("MAINTAIN")}
                  className={`rounded-xl py-2.5 px-3 text-xs font-bold transition border ${
                    goal === "MAINTAIN"
                      ? "bg-cyan-500/20 border-cyan-500 text-cyan-400 shadow-sm"
                      : "bg-neutral-800/60 border-neutral-700 text-neutral-400 hover:text-white"
                  }`}
                >
                  Maintenance
                </button>
                <button
                  type="button"
                  onClick={() => setGoal("BULK")}
                  className={`rounded-xl py-2.5 px-3 text-xs font-bold transition border ${
                    goal === "BULK"
                      ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-sm"
                      : "bg-neutral-800/60 border-neutral-700 text-neutral-400 hover:text-white"
                  }`}
                >
                  Muscle Surplus (+10%)
                </button>
              </div>
            </div>

            {/* Summary Breakdown */}
            <div className="rounded-xl bg-neutral-950 p-4 border border-neutral-800 space-y-2 text-xs">
              <div className="flex justify-between text-neutral-400">
                <span>Computed Basal Metabolic Rate (BMR):</span>
                <span className="text-neutral-200 font-mono">{calculated.bmr} kcal</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Active Expenditure (TDEE × 1.55):</span>
                <span className="text-neutral-200 font-mono">{calculated.tdee} kcal</span>
              </div>
              <div className="flex justify-between font-bold border-t border-neutral-800/80 pt-2 text-white items-center">
                <span>Target Daily Intake:</span>
                <div className="flex items-center gap-2">
                  {calculated.isCustom && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
                      Coach Target
                    </span>
                  )}
                  <span className="text-emerald-400 font-mono text-sm">{calculated.targetCalories} kcal / day</span>
                </div>
              </div>
            </div>
          </div>

          {/* Live Chart Visual */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center p-6 rounded-2xl bg-neutral-950/70 border border-neutral-800/80 space-y-4">
            <div className="text-center">
              <Text className="text-neutral-400 text-xs uppercase tracking-wider font-semibold">
                Prescribed Daily Fuel
              </Text>
              <div className="text-3xl font-extrabold text-white font-mono mt-1">
                {calculated.targetCalories} <span className="text-xs text-neutral-500 font-sans">KCAL</span>
              </div>
            </div>

            <DonutChart
              data={chartData}
              label="Target Grams"
              valueFormatter={(v) => `${v}g`}
              className="w-full py-1"
            />

            {/* Macros grid */}
            <div className="grid grid-cols-3 gap-3 w-full text-center">
              <div className="rounded-xl bg-neutral-900 p-2.5 border border-emerald-500/20">
                <div className="text-[10px] uppercase font-bold text-emerald-400">Protein</div>
                <div className="text-base font-extrabold text-white font-mono">{calculated.targetProtein}g</div>
                <div className="text-[10px] text-neutral-400">2.0g / kg</div>
              </div>
              <div className="rounded-xl bg-neutral-900 p-2.5 border border-cyan-500/20">
                <div className="text-[10px] uppercase font-bold text-cyan-400">Carbs</div>
                <div className="text-base font-extrabold text-white font-mono">{calculated.targetCarbs}g</div>
                <div className="text-[10px] text-neutral-400">Glycogen fuel</div>
              </div>
              <div className="rounded-xl bg-neutral-900 p-2.5 border border-amber-500/20">
                <div className="text-[10px] uppercase font-bold text-amber-400">Fats</div>
                <div className="text-base font-extrabold text-white font-mono">{calculated.targetFat}g</div>
                <div className="text-[10px] text-neutral-400">Hormone health</div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* LIVE DAILY FOOD & MACRO TRACKER STUDIO */}
      <Card className="bg-neutral-900/90 border-neutral-800 p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h3 className="text-base font-bold text-white">Daily Food &amp; Macro Intake Log</h3>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                USDA Verified
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Log meals via precision barcode scanner, Nutrition Facts OCR, or 3M+ food database search
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setScannerInitialMeal("LUNCH");
                setScannerInitialTab("scan");
                setIsScannerOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 px-4 py-2 text-xs font-bold text-neutral-950 shadow-md shadow-emerald-500/20 hover:from-emerald-400 hover:to-emerald-300 transition active:scale-[0.98]"
            >
              <Scan className="h-4 w-4" />
              <span>Scan Food / Barcode</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setScannerInitialMeal("LUNCH");
                setScannerInitialTab("search");
                setIsScannerOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-700 bg-neutral-800 px-3.5 py-2 text-xs font-semibold text-neutral-200 hover:bg-neutral-700 hover:text-white transition"
            >
              <Search className="h-3.5 w-3.5 text-cyan-400" />
              <span>Search Database</span>
            </button>
          </div>
        </div>

        {/* Daily Progress Bars vs Mifflin-St Jeor Targets */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 rounded-2xl bg-neutral-950/80 border border-neutral-800">
          {/* Calories Progress */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-neutral-300 font-semibold flex items-center gap-1">
                <Flame className="h-3.5 w-3.5 text-emerald-400" />
                <span>Calories</span>
              </span>
              <span className="font-mono text-emerald-400 font-bold">
                {loggedMealsData.totals.calories} / {calculated.targetCalories} kcal
              </span>
            </div>
            <ProgressBar
              value={Math.min(100, Math.round((loggedMealsData.totals.calories / (calculated.targetCalories || 2000)) * 100))}
              color="emerald"
              className="h-2 rounded-full"
            />
            <div className="text-[10px] text-neutral-500 font-mono">
              {Math.max(0, calculated.targetCalories - loggedMealsData.totals.calories)} kcal remaining
            </div>
          </div>

          {/* Protein Progress */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-neutral-300 font-semibold">Protein</span>
              <span className="font-mono text-emerald-400 font-bold">
                {loggedMealsData.totals.protein}g / {calculated.targetProtein}g
              </span>
            </div>
            <ProgressBar
              value={Math.min(100, Math.round((loggedMealsData.totals.protein / (calculated.targetProtein || 150)) * 100))}
              color="emerald"
              className="h-2 rounded-full"
            />
            <div className="text-[10px] text-neutral-500 font-mono">
              {Math.max(0, Math.round((calculated.targetProtein - loggedMealsData.totals.protein) * 10) / 10)}g remaining
            </div>
          </div>

          {/* Carbs Progress */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-neutral-300 font-semibold">Carbs</span>
              <span className="font-mono text-cyan-400 font-bold">
                {loggedMealsData.totals.carbs}g / {calculated.targetCarbs}g
              </span>
            </div>
            <ProgressBar
              value={Math.min(100, Math.round((loggedMealsData.totals.carbs / (calculated.targetCarbs || 200)) * 100))}
              color="cyan"
              className="h-2 rounded-full"
            />
            <div className="text-[10px] text-neutral-500 font-mono">
              {Math.max(0, Math.round((calculated.targetCarbs - loggedMealsData.totals.carbs) * 10) / 10)}g remaining
            </div>
          </div>

          {/* Fats Progress */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-neutral-300 font-semibold">Fats</span>
              <span className="font-mono text-amber-400 font-bold">
                {loggedMealsData.totals.fat}g / {calculated.targetFat}g
              </span>
            </div>
            <ProgressBar
              value={Math.min(100, Math.round((loggedMealsData.totals.fat / (calculated.targetFat || 60)) * 100))}
              color="amber"
              className="h-2 rounded-full"
            />
            <div className="text-[10px] text-neutral-500 font-mono">
              {Math.max(0, Math.round((calculated.targetFat - loggedMealsData.totals.fat) * 10) / 10)}g remaining
            </div>
          </div>
        </div>

        {/* Meal Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(
            [
              { type: "BREAKFAST" as const, label: "Breakfast", icon: "🍳", color: "text-amber-400" },
              { type: "LUNCH" as const, label: "Lunch", icon: "🥗", color: "text-emerald-400" },
              { type: "DINNER" as const, label: "Dinner", icon: "🥩", color: "text-cyan-400" },
              { type: "SNACK" as const, label: "Snacks", icon: "🍎", color: "text-purple-400" },
            ]
          ).map((cat) => {
            const items = loggedMealsData.grouped[cat.type] || [];
            const catCalories = items.reduce((sum, i) => sum + (i.calories || 0), 0);
            const catProtein = Math.round(items.reduce((sum, i) => sum + (i.protein || 0), 0) * 10) / 10;

            return (
              <div
                key={cat.type}
                className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-4 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{cat.icon}</span>
                      <h4 className="text-xs font-bold text-white">{cat.label}</h4>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono font-bold text-white">{catCalories} kcal</div>
                      <div className="text-[9px] text-neutral-500 font-mono">{catProtein}g protein</div>
                    </div>
                  </div>

                  {/* Food Items List */}
                  <div className="space-y-1.5 min-h-[90px]">
                    {items.length === 0 ? (
                      <div className="py-6 text-center text-[11px] text-neutral-600 italic">
                        No foods logged yet.
                      </div>
                    ) : (
                      items.map((item) => (
                        <div
                          key={item.id}
                          className="group flex items-center justify-between p-2 rounded-xl bg-neutral-900/80 border border-neutral-800/80 hover:border-neutral-700 transition"
                        >
                          <div className="overflow-hidden pr-1">
                            <div className="text-[11px] font-semibold text-neutral-200 truncate">
                              {item.name}
                            </div>
                            <div className="text-[9px] text-neutral-500 font-mono">
                              {item.calories} kcal • P: {item.protein}g • C: {item.carbs}g • F: {item.fat}g
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteMeal(item.id)}
                            title="Delete food entry"
                            className="text-neutral-600 hover:text-red-400 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition shrink-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Add Button */}
                <button
                  type="button"
                  onClick={() => {
                    setScannerInitialMeal(cat.type);
                    setIsScannerOpen(true);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-neutral-800 bg-neutral-900 hover:border-emerald-500/30 hover:bg-neutral-800 text-[11px] font-semibold text-neutral-300 hover:text-white transition"
                >
                  <Plus className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Log to {cat.label}</span>
                </button>
              </div>
            );
          })}
        </div>
      </Card>

      {/* 100% Accurate Food & Macro Scanner Modal */}
      <FoodScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onMealLogged={fetchLoggedMeals}
        initialMealType={scannerInitialMeal}
        initialTab={scannerInitialTab}
      />
    </div>
  );
}
