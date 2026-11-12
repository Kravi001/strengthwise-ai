"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Card,
  Text,
  DonutChart,
  ProgressBar,
} from "@/components/tremor";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Flame,
  Pencil,
  Plus,
  Scan,
  Search,
  Trash2,
  Zap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { calculateNutritionTargets } from "@/lib/calc";
import { FoodScannerModal } from "@/components/food-scanner-modal";
import { EditMealModal, type LoggedMealItem } from "@/components/edit-meal-modal";
import { MealResetModal } from "@/components/meal-reset-modal";
import { CalorieTargetModal, type CalorieTargetValues } from "@/components/calorie-target-modal";
import { saveCalorieTargets, resetCalorieTargets } from "@/lib/calorie-targets";
import { GuestAuthModal } from "@/components/guest-auth-modal";
import {
  getLocalDateString,
  formatDisplayDate,
  addDaysToDateString,
  formatResetTimeDisplay,
} from "@/lib/date";
import type { User } from "@supabase/supabase-js";
import { PageHeader } from "@/components/page-header";
import { SampleDataBanner } from "@/components/sample-data-banner";

export default function MealsPage() {
  const supabase = createClient();

  const [authUser, setAuthUser] = useState<User | null>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [loading, setLoading] = useState(true);

  // Guest Auth Intercept Modal State
  const [isGuestAuthModalOpen, setIsGuestAuthModalOpen] = useState(false);
  const [guestModalTitle, setGuestModalTitle] = useState("Create an athlete profile to log meals");
  const [guestModalDescription, setGuestModalDescription] = useState(
    "StrengthWise AI calculates your personalized metabolic targets and synchronizes your daily nutrition logs to PostgreSQL."
  );

  const handleProtectedAction = (title?: string, description?: string) => {
    if (!authUser) {
      if (title) setGuestModalTitle(title);
      if (description) setGuestModalDescription(description);
      setIsGuestAuthModalOpen(true);
      return false;
    }
    return true;
  };

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
  const [splitDays, setSplitDays] = useState<number | null>(null);
  const [dietPreference, setDietPreference] = useState<string | null>(null);
  const [customCalories, setCustomCalories] = useState<number | null>(null);
  const [customProtein, setCustomProtein] = useState<number | null>(null);
  const [customCarbs, setCustomCarbs] = useState<number | null>(null);
  const [customFat, setCustomFat] = useState<number | null>(null);

  // Calculations
  const numWeightLbs = Number(currentWeightLbs) || 185;
  const numWeightKg = numWeightLbs / 2.20462;
  const totalInches = (Number(heightFt) || 6) * 12 + (Number(heightIn) || 0);
  const heightCm = totalInches * 2.54;

  // Targets calculated purely from body stats and goal
  const baseTargets = useMemo(
    () =>
      calculateNutritionTargets({
        age: Number(age) || 26,
        gender: gender,
        heightCm: heightCm,
        weightKg: numWeightKg,
        activityLevel: activityLevel,
        goal: goal === "CUT" ? "LOSE_WEIGHT" : goal === "BULK" ? "BUILD_MUSCLE" : "MAINTAIN",
        splitDays,
        dietPreference,
      }),
    [age, gender, heightCm, numWeightKg, activityLevel, goal, splitDays, dietPreference]
  );

  // Targets in effect: a saved manual/coach target wins over the calculated one
  const calculated = useMemo(() => {
    const base = baseTargets;

    if (customCalories && customCalories > 500) {
      const diffRatio = customCalories / (base.targetCalories || 2000);
      const targetProtein = customProtein ? Math.round(customProtein) : base.targetProtein;
      const targetCarbs = customCarbs ? Math.round(customCarbs) : Math.max(30, Math.round(base.targetCarbs * diffRatio));
      const targetFat = customFat ? Math.round(customFat) : Math.max(30, Math.round(base.targetFat * diffRatio));
      return {
        ...base,
        targetCalories: customCalories,
        targetProtein,
        targetCarbs,
        targetFat,
        isCustom:
          customCalories !== base.targetCalories ||
          targetProtein !== base.targetProtein ||
          targetCarbs !== base.targetCarbs ||
          targetFat !== base.targetFat,
      };
    }

    return { ...base, isCustom: false };
  }, [baseTargets, customCalories, customProtein, customCarbs, customFat]);

  // Manual calorie target setting
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);

  const applyTargetsLocally = (t: CalorieTargetValues) => {
    setCustomCalories(t.targetCalories);
    setCustomProtein(t.targetProtein);
    setCustomCarbs(t.targetCarbs);
    setCustomFat(t.targetFat);
  };

  const handleSaveCalorieTarget = async (values: CalorieTargetValues) => {
    applyTargetsLocally(await saveCalorieTargets(values));
    await fetchLoggedMeals(selectedDate, mealResetTime);
  };

  const handleResetCalorieTarget = async () => {
    applyTargetsLocally(await resetCalorieTargets());
    await fetchLoggedMeals(selectedDate, mealResetTime);
  };

  const chartData = [
    { name: "Protein", value: calculated.targetProtein, color: "#06b6d4" },
    { name: "Carbs", value: calculated.targetCarbs, color: "#ec4899" },
    { name: "Fats", value: calculated.targetFat, color: "#f59e0b" },
  ];

  // Meal Logging & Food Scanner State
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerInitialMeal, setScannerInitialMeal] = useState<"BREAKFAST" | "LUNCH" | "DINNER" | "SNACK">("LUNCH");
  const [scannerInitialTab, setScannerInitialTab] = useState<"scan" | "search" | "quick">("scan");
  // Meal Reset Time State
  const [mealResetTime, setMealResetTime] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sw_meal_reset_time") || "00:00";
    }
    return "00:00";
  });
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const savedReset = typeof window !== "undefined" ? (localStorage.getItem("sw_meal_reset_time") || "00:00") : "00:00";
    return getLocalDateString(new Date(), savedReset);
  });
  const [editingMeal, setEditingMeal] = useState<LoggedMealItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleOpenEditMeal = (meal: LoggedMealItem) => {
    setEditingMeal(meal);
    setIsEditModalOpen(true);
  };
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

  const fetchLoggedMeals = async (targetDate: string = selectedDate, currentResetTime: string = mealResetTime) => {
    try {
      const offset = new Date().getTimezoneOffset();
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const res = await fetch(
        `/api/meals?date=${targetDate}&offset=${offset}&timezone=${encodeURIComponent(tz)}&resetTime=${encodeURIComponent(currentResetTime)}`
      );
      if (res.ok) {
        const data = await res.json();
        setLoggedMealsData(data);
        if (data.resetTime && data.resetTime !== currentResetTime) {
          setMealResetTime(data.resetTime);
          if (typeof window !== "undefined") {
            localStorage.setItem("sw_meal_reset_time", data.resetTime);
          }
        }
      }
    } catch (err) {
      console.warn("Failed to fetch meals:", err);
    }
  };

  const handleSaveResetTime = async (newResetTime: string) => {
    setMealResetTime(newResetTime);
    if (typeof window !== "undefined") {
      localStorage.setItem("sw_meal_reset_time", newResetTime);
    }

    try {
      await fetch("/api/meals/reset-time", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetTime: newResetTime }),
      });
    } catch (err) {
      console.warn("Failed to sync reset time to server:", err);
    }

    // Recalculate today's date according to new reset time
    const newToday = getLocalDateString(new Date(), newResetTime);
    setSelectedDate(newToday);
    await fetchLoggedMeals(newToday, newResetTime);
  };

  const handleDeleteMeal = async (id: string) => {
    try {
      await fetch(`/api/meals?id=${id}`, { method: "DELETE" });
      await fetchLoggedMeals(selectedDate, mealResetTime);
    } catch (err) {
      console.warn("Failed to delete meal:", err);
    }
  };

  // Automated daily reset watcher with custom resetTime support
  useEffect(() => {
    let lastLocalDate = getLocalDateString(new Date(), mealResetTime);

    const checkMidnightRollover = () => {
      const currentLocalDate = getLocalDateString(new Date(), mealResetTime);
      if (currentLocalDate !== lastLocalDate) {
        // Daily reset reached — reset to new day!
        const wasViewingToday = selectedDate === lastLocalDate;
        lastLocalDate = currentLocalDate;
        if (wasViewingToday) {
          setSelectedDate(currentLocalDate);
          fetchLoggedMeals(currentLocalDate, mealResetTime);
        }
      }
    };

    const intervalId = setInterval(checkMidnightRollover, 10000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        checkMidnightRollover();
      }
    };

    window.addEventListener("focus", checkMidnightRollover);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("focus", checkMidnightRollover);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [selectedDate, mealResetTime]);

  const todayStr = getLocalDateString(new Date(), mealResetTime);
  const isToday = selectedDate === todayStr;

  const handlePrevDay = () => {
    const prev = addDaysToDateString(selectedDate, -1);
    setSelectedDate(prev);
    fetchLoggedMeals(prev, mealResetTime);
  };

  const handleNextDay = () => {
    const next = addDaysToDateString(selectedDate, 1);
    setSelectedDate(next);
    fetchLoggedMeals(next, mealResetTime);
  };

  const handleJumpToToday = () => {
    const today = getLocalDateString(new Date(), mealResetTime);
    setSelectedDate(today);
    fetchLoggedMeals(today, mealResetTime);
  };

  useEffect(() => {
    document.title = "Meals — StrengthWise";
    async function loadData() {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        setAuthUser(currentUser);

        if (!currentUser) {
          setHasProfile(false);
          // Populate rich demo meals for guest exploration
          const demoBreakfast = [
            {
              id: "demo-m1",
              mealType: "BREAKFAST",
              name: "Whey Protein & Rolled Oats with Blueberries",
              calories: 620,
              protein: 48,
              carbs: 72,
              fat: 14,
              fiber: 8,
              serving: "1 bowl",
              loggedAt: new Date().toISOString(),
            },
          ];
          const demoLunch = [
            {
              id: "demo-m2",
              mealType: "LUNCH",
              name: "Grilled Chicken Breast, Jasmine Rice & Avocado",
              calories: 780,
              protein: 62,
              carbs: 85,
              fat: 18,
              fiber: 6,
              serving: "1 plate",
              loggedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
            },
          ];
          const demoDinner = [
            {
              id: "demo-m3",
              mealType: "DINNER",
              name: "Grass-Fed Flank Steak & Roasted Sweet Potatoes",
              calories: 710,
              protein: 58,
              carbs: 64,
              fat: 22,
              fiber: 7,
              serving: "8 oz steak + 250g potatoes",
              loggedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
            },
          ];
          const demoSnack = [
            {
              id: "demo-m4",
              mealType: "SNACK",
              name: "Greek Yogurt with Raw Honey & Banana",
              calories: 340,
              protein: 28,
              carbs: 46,
              fat: 4,
              fiber: 3,
              serving: "1 cup (220g)",
              loggedAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
            },
          ];
          const allDemo = [...demoBreakfast, ...demoLunch, ...demoDinner, ...demoSnack];
          const totals = {
            calories: allDemo.reduce((s, i) => s + i.calories, 0),
            protein: allDemo.reduce((s, i) => s + i.protein, 0),
            carbs: allDemo.reduce((s, i) => s + i.carbs, 0),
            fat: allDemo.reduce((s, i) => s + i.fat, 0),
            fiber: allDemo.reduce((s, i) => s + i.fiber, 0),
          };
          setLoggedMealsData({
            meals: allDemo,
            grouped: {
              BREAKFAST: demoBreakfast,
              LUNCH: demoLunch,
              DINNER: demoDinner,
              SNACK: demoSnack,
            },
            totals,
            remaining: {
              calories: Math.max(0, 2750 - totals.calories),
              protein: Math.max(0, 196 - totals.protein),
              carbs: Math.max(0, 310 - totals.carbs),
              fat: Math.max(0, 75 - totals.fat),
              fiber: Math.max(0, 38 - totals.fiber),
            },
          });
          setLoading(false);
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
              if (data.profile.splitDays) setSplitDays(data.profile.splitDays);
              if (data.profile.dietPreference) setDietPreference(data.profile.dietPreference);
              if (data.profile.targetCalories) setCustomCalories(data.profile.targetCalories);
              if (data.profile.targetProtein) setCustomProtein(data.profile.targetProtein);
              if (data.profile.targetCarbs) setCustomCarbs(data.profile.targetCarbs);
              if (data.profile.targetFat) setCustomFat(data.profile.targetFat);
              if (data.profile.mealResetTime) {
                setMealResetTime(data.profile.mealResetTime);
                if (typeof window !== "undefined") {
                  localStorage.setItem("sw_meal_reset_time", data.profile.mealResetTime);
                }
              }
            }
          }
          await fetchLoggedMeals(selectedDate, mealResetTime);
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
      fetchLoggedMeals(selectedDate);
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
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-10 animate-in fade-in duration-150 ease-out">
      {/* Page Header */}
      <PageHeader
        title="Meals"
        description="Your daily calorie and macro targets, and everything you've eaten today."
        actions={
          <>
          <button
            type="button"
            onClick={() => {
              if (!handleProtectedAction("Create an athlete profile to log meals", "Sign in or create an athlete profile to scan barcodes, log food, and sync your macros.")) return;
              setScannerInitialMeal("LUNCH");
              setScannerInitialTab("scan");
              setIsScannerOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-xs font-semibold text-neutral-950 shadow-sm transition-colors duration-150 ease-out"
          >
            <Scan className="h-4 w-4" />
            <span>Scan Food</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (!handleProtectedAction("Create an athlete profile to search foods", "Sign in or create an athlete profile to search our 3M+ food database and track macros.")) return;
              setScannerInitialMeal("LUNCH");
              setScannerInitialTab("search");
              setIsScannerOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-700 bg-neutral-800 px-3.5 py-2 text-xs font-medium text-neutral-200 hover:bg-neutral-700 hover:text-white transition-colors duration-150 ease-out"
          >
            <Search className="h-3.5 w-3.5 text-neutral-400" />
            <span>Search Foods</span>
          </button>
          </>
        }
      />

      {!hasProfile && !loading && (
        <SampleDataBanner
          message="Create a profile to get calorie and macro targets based on your body and goal."
          redirectPath="/meals"
        />
      )}

      {/* Prescribed Daily Fuel Target Card */}
      <Card className="relative overflow-hidden bg-neutral-900 border border-neutral-800 p-4 sm:p-6 shadow-sm flex flex-col items-center justify-center space-y-6">
        <div className="text-center relative">
          <Text className="text-neutral-400 text-xs uppercase tracking-wider font-semibold font-mono">
            Daily Calorie Target
          </Text>
          <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono tabular-nums mt-1">
            {calculated.targetCalories} <span className="text-xs text-neutral-500 font-sans">KCAL</span>
          </div>
          <div className="mt-1 text-xs font-mono font-medium">
            {calculated.isCustom ? (
              <span className="text-emerald-400">Custom target</span>
            ) : (
              <span className="text-neutral-500">Calculated from your profile</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              if (!handleProtectedAction("Create an athlete profile to set your calorie target", "Sign in or create an athlete profile to choose your own daily calorie target.")) return;
              setIsTargetModalOpen(true);
            }}
            className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs font-medium text-neutral-200 hover:bg-neutral-700 hover:text-white transition-colors duration-150 ease-out"
          >
            <Pencil className="h-3.5 w-3.5 text-neutral-400" />
            <span>Change target</span>
          </button>
        </div>

        <DonutChart
          data={chartData}
          label="Target Grams"
          valueFormatter={(v) => `${v}g`}
          className="w-full py-1"
        />

        {/* Macros grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full max-w-xl text-center">
          <div className="rounded-xl bg-neutral-950 p-3.5 border border-neutral-800 shadow-sm">
            <div className="text-[10px] uppercase font-mono font-bold text-neutral-400 tracking-wider">Protein</div>
            <div className="text-lg font-black text-white font-mono tabular-nums mt-0.5">{calculated.targetProtein}g</div>
            <div className="text-[10px] text-neutral-500 font-mono">2.0g / kg</div>
          </div>
          <div className="rounded-xl bg-neutral-950 p-3.5 border border-neutral-800 shadow-sm">
            <div className="text-[10px] uppercase font-mono font-bold text-neutral-400 tracking-wider">Carbs</div>
            <div className="text-lg font-black text-white font-mono tabular-nums mt-0.5">{calculated.targetCarbs}g</div>
            <div className="text-[10px] text-neutral-500 font-mono">Glycogen fuel</div>
          </div>
          <div className="rounded-xl bg-neutral-950 p-3.5 border border-neutral-800 shadow-sm">
            <div className="text-[10px] uppercase font-mono font-bold text-neutral-400 tracking-wider">Fats</div>
            <div className="text-lg font-black text-white font-mono tabular-nums mt-0.5">{calculated.targetFat}g</div>
            <div className="text-[10px] text-neutral-500 font-mono">Hormone health</div>
          </div>
        </div>
      </Card>

      {/* LIVE DAILY FOOD & MACRO TRACKER STUDIO */}
      <Card className="bg-neutral-900 border border-neutral-800 p-4 sm:p-6 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">Daily Food &amp; Macro Intake Log</h3>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Log meals via precision barcode scanner, Nutrition Facts OCR, or 3M+ food database search
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (!handleProtectedAction("Create an athlete profile to log meals", "Sign in or create an athlete profile to scan barcodes, log food, and sync your macros.")) return;
                setScannerInitialMeal("LUNCH");
                setScannerInitialTab("scan");
                setIsScannerOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-xs font-semibold text-neutral-950 shadow-sm transition-colors duration-150 ease-out"
            >
              <Scan className="h-4 w-4" />
              <span>Scan Food / Barcode</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (!handleProtectedAction("Create an athlete profile to search foods", "Sign in or create an athlete profile to search our 3M+ food database and track macros.")) return;
                setScannerInitialMeal("LUNCH");
                setScannerInitialTab("search");
                setIsScannerOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-700 bg-neutral-800 px-3.5 py-2 text-xs font-medium text-neutral-200 hover:bg-neutral-700 hover:text-white transition-colors duration-150 ease-out"
            >
              <Search className="h-3.5 w-3.5 text-neutral-400" />
              <span>Search Database</span>
            </button>
          </div>
        </div>

        {/* Date Selector & Daily 12:00 AM Reset Indicator */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center rounded-xl border border-neutral-800 bg-neutral-900 p-1">
              <button
                type="button"
                onClick={handlePrevDay}
                title="Previous Day"
                className="rounded-lg p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors duration-150 ease-out"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="px-3 py-1 text-xs font-bold text-white min-w-[170px] text-center font-mono">
                {formatDisplayDate(selectedDate, todayStr)}
              </div>

              <button
                type="button"
                onClick={handleNextDay}
                title="Next Day"
                className="rounded-lg p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors duration-150 ease-out"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {!isToday && (
              <button
                type="button"
                onClick={handleJumpToToday}
                className="rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors duration-150 ease-out"
              >
                Today
              </button>
            )}
          </div>

          {/* Daily Reset Time Badge / Interactive Button */}
          <button
            type="button"
            onClick={() => setIsResetModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs font-medium transition-colors duration-150 ease-out group shadow-sm"
            title="Configure daily reset time"
          >
            <Clock className="h-3.5 w-3.5 text-emerald-400" />
            <span>
              Resets daily at <strong className="text-emerald-400 font-mono">{formatResetTimeDisplay(mealResetTime)}</strong>
            </span>
            <span className="text-[10px] text-neutral-400 ml-1 border border-neutral-700 rounded px-1.5 py-0.5 group-hover:border-neutral-600 transition-colors duration-150 ease-out">
              Change
            </span>
          </button>
        </div>

        {/* Daily Progress Bars vs Mifflin-St Jeor Targets */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 rounded-xl bg-neutral-950 border border-neutral-800 shadow-sm">
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
              <span className="text-neutral-300 font-medium">Protein</span>
              <span className="font-mono text-neutral-200 font-bold">
                {loggedMealsData.totals.protein}g / {calculated.targetProtein}g
              </span>
            </div>
            <ProgressBar
              value={Math.min(100, Math.round((loggedMealsData.totals.protein / (calculated.targetProtein || 150)) * 100))}
              color="cyan"
              className="h-2 rounded-full"
            />
            <div className="text-[10px] text-neutral-500 font-mono">
              {Math.max(0, Math.round((calculated.targetProtein - loggedMealsData.totals.protein) * 10) / 10)}g remaining
            </div>
          </div>

          {/* Carbs Progress */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-neutral-300 font-medium">Carbs</span>
              <span className="font-mono text-neutral-200 font-bold">
                {loggedMealsData.totals.carbs}g / {calculated.targetCarbs}g
              </span>
            </div>
            <ProgressBar
              value={Math.min(100, Math.round((loggedMealsData.totals.carbs / (calculated.targetCarbs || 200)) * 100))}
              color="pink"
              className="h-2 rounded-full"
            />
            <div className="text-[10px] text-neutral-500 font-mono">
              {Math.max(0, Math.round((calculated.targetCarbs - loggedMealsData.totals.carbs) * 10) / 10)}g remaining
            </div>
          </div>

          {/* Fats Progress */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-neutral-300 font-medium">Fats</span>
              <span className="font-mono text-neutral-200 font-bold">
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
              { type: "BREAKFAST" as const, label: "Breakfast", icon: "🍳" },
              { type: "LUNCH" as const, label: "Lunch", icon: "🥗" },
              { type: "DINNER" as const, label: "Dinner", icon: "🥩" },
              { type: "SNACK" as const, label: "Snacks", icon: "🍎" },
            ]
          ).map((cat) => {
            const items = loggedMealsData.grouped[cat.type] || [];
            const catCalories = items.reduce((sum, i) => sum + (i.calories || 0), 0);
            const catProtein = Math.round(items.reduce((sum, i) => sum + (i.protein || 0), 0) * 10) / 10;

            return (
              <div
                key={cat.type}
                className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4 space-y-3 flex flex-col justify-between shadow-sm"
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
                          className="group flex items-center justify-between p-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-colors duration-150 ease-out"
                        >
                          <div className="overflow-hidden pr-2 flex-1">
                            <div className="text-[11px] font-semibold text-neutral-200 truncate flex items-center gap-1.5">
                              <span className="truncate">{item.name}</span>
                              {item.serving && (
                                <span className="text-[9px] font-mono text-neutral-500 font-normal shrink-0">
                                  ({item.serving})
                                </span>
                              )}
                            </div>
                            <div className="text-[9px] text-neutral-400 font-mono mt-0.5">
                              <span className="text-emerald-400 font-semibold">{item.calories} kcal</span>
                              <span className="text-neutral-600"> • </span>
                              <span className="text-neutral-300">P: {item.protein}g</span>
                              <span className="text-neutral-600"> • </span>
                              <span className="text-neutral-300">C: {item.carbs}g</span>
                              <span className="text-neutral-600"> • </span>
                              <span className="text-neutral-300">F: {item.fat}g</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-0.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                if (!handleProtectedAction("Create an athlete profile to edit meals", "Sign in or create an athlete profile to modify your logged meals.")) return;
                                handleOpenEditMeal(item);
                              }}
                              title="Edit food entry"
                              className="text-neutral-500 hover:text-white p-1 rounded-lg opacity-80 sm:opacity-0 group-hover:opacity-100 hover:bg-neutral-800 transition-colors duration-150 ease-out"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (!handleProtectedAction("Create an athlete profile to delete meals", "Sign in or create an athlete profile to modify your logged meals.")) return;
                                handleDeleteMeal(item.id);
                              }}
                              title="Delete food entry"
                              className="text-neutral-500 hover:text-red-400 p-1 rounded-lg opacity-80 sm:opacity-0 group-hover:opacity-100 hover:bg-neutral-800 transition-colors duration-150 ease-out"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Add Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (!handleProtectedAction(`Create an athlete profile to log to ${cat.label}`, "Sign in or create an athlete profile to log custom meals, scan food, and calculate macros.")) return;
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
        onMealLogged={() => fetchLoggedMeals(selectedDate, mealResetTime)}
        initialMealType={scannerInitialMeal}
        initialTab={scannerInitialTab}
        targetDate={selectedDate}
      />

      {/* Edit Logged Meal Modal */}
      <EditMealModal
        meal={editingMeal}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingMeal(null);
        }}
        onMealUpdated={() => fetchLoggedMeals(selectedDate, mealResetTime)}
        onMealDeleted={() => fetchLoggedMeals(selectedDate, mealResetTime)}
      />

      {/* Configure Daily Meal Log Reset Time Modal */}
      <MealResetModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        currentResetTime={mealResetTime}
        onSave={handleSaveResetTime}
      />

      {/* Manual Daily Calorie Target Modal */}
      <CalorieTargetModal
        isOpen={isTargetModalOpen}
        onClose={() => setIsTargetModalOpen(false)}
        current={{
          targetCalories: calculated.targetCalories,
          targetProtein: calculated.targetProtein,
          targetCarbs: calculated.targetCarbs,
          targetFat: calculated.targetFat,
        }}
        calculated={{
          targetCalories: baseTargets.targetCalories,
          targetProtein: baseTargets.targetProtein,
          targetCarbs: baseTargets.targetCarbs,
          targetFat: baseTargets.targetFat,
        }}
        isCustom={calculated.isCustom}
        onSave={handleSaveCalorieTarget}
        onResetToCalculated={handleResetCalorieTarget}
      />

      {/* Guest Athlete Profile Intercept Modal */}
      <GuestAuthModal
        isOpen={isGuestAuthModalOpen}
        onClose={() => setIsGuestAuthModalOpen(false)}
        title={guestModalTitle}
        description={guestModalDescription}
        redirectPath="/meals"
      />
    </div>
  );
}
