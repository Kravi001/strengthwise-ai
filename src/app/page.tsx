"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Card } from "@/components/tremor";
import {
  ArrowRight,
  Dumbbell,
  Sparkles,
  TrendingUp,
  Utensils,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { calculateNutritionTargets } from "@/lib/calc";
import {
  CustomSplit,
  DEFAULT_CUSTOM_SPLIT,
  loadCustomSplit,
} from "@/lib/custom-split";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";

export default function LandingPage() {
  const supabase = createClient();

  // --- Auth & User State ---
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [hasProfile, setHasProfile] = useState(false);

  // Form / Profile Fields
  const [avatar, setAvatar] = useState<string>("🏋️‍♂️");
  const [fullName, setFullName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [age, setAge] = useState<number | string>(26);
  const [gender, setGender] = useState<"FEMALE" | "MALE">("MALE");
  const [heightFt, setHeightFt] = useState<number | string>(6);
  const [heightIn, setHeightIn] = useState<number | string>(3);
  const [currentWeightLbs, setCurrentWeightLbs] = useState<number | string>(185);
  const [goalWeightLbs, setGoalWeightLbs] = useState<number | string>(175);
  const [goal, setGoal] = useState<"CUT" | "MAINTAIN" | "BULK">("BULK");
  const [activityLevel, setActivityLevel] = useState<string>("MODERATE");

  // Calculations
  const numWeightLbs = Number(currentWeightLbs) || 185;
  const numWeightKg = numWeightLbs / 2.20462;
  const parsedFt = Number(heightFt) > 0 ? Number(heightFt) : 6;
  const parsedIn = !isNaN(Number(heightIn)) && Number(heightIn) >= 0 ? Number(heightIn) : 0;
  const totalInches = parsedFt * 12 + parsedIn;
  const heightCm = totalInches * 2.54;

  const calculated = calculateNutritionTargets({
    age: Number(age) || 26,
    gender: gender,
    heightCm: heightCm,
    weightKg: numWeightKg,
    activityLevel: activityLevel,
    goal: goal === "CUT" ? "LOSE_WEIGHT" : goal === "BULK" ? "BUILD_MUSCLE" : "MAINTAIN",
  });

  // --- Workouts Split State ---
  const [userSplitDays, setUserSplitDays] = useState<number>(4);
  const [userSplitType, setUserSplitType] = useState<string>("Upper / Lower Power & Hypertrophy");
  const [customSplit, setCustomSplit] = useState<CustomSplit>(DEFAULT_CUSTOM_SPLIT);

  const activeSplit = useMemo<"ppl" | "upper_lower" | "full_body" | "hybrid_ppl" | "custom">(() => {
    if (userSplitType.toLowerCase().includes("custom")) return "custom";
    if (userSplitDays === 3 || userSplitType.toLowerCase().includes("full body")) return "full_body";
    if (userSplitDays === 4 || userSplitType.toLowerCase().includes("upper") || userSplitType.toLowerCase().includes("lower")) return "upper_lower";
    if (userSplitDays === 5 || userSplitType.toLowerCase().includes("hybrid")) return "hybrid_ppl";
    if (userSplitDays === 6 || userSplitType.toLowerCase().includes("ppl")) return "ppl";
    return "upper_lower";
  }, [userSplitDays, userSplitType]);

  const splitDetails: Record<
    "ppl" | "upper_lower" | "full_body" | "hybrid_ppl",
    {
      name: string;
      frequency: string;
      badge: string;
      description: string;
      days: { name: string; lifts: string }[];
      targetSets: number;
    }
  > = {
    upper_lower: {
      name: "Upper / Lower Split",
      frequency: "4 Days / Week",
      badge: "Upper / Lower (4-Day)",
      description: "Ideal balance of high mechanical load, heavy compound progression, and optimal systemic neurological recovery.",
      days: [
        { name: "Upper A (Strength)", lifts: "Flat Barbell Bench (4×5 @ RPE 8.5), Weighted Chin-ups (4×6), Seated Cable Row (3×8), Skull Crushers (3×10)" },
        { name: "Lower A (Quad Bias)", lifts: "Back Squat (4×6 @ RPE 8), Leg Press (3×10), Walking Lunges (3×12), Seated Leg Curls (4×12)" },
        { name: "Upper B (Hypertrophy)", lifts: "Incline DB Press (3×10), Chest-Supported T-Bar Row (3×10), DB Lateral Raises (4×15), Hammer Curls (3×12)" },
        { name: "Lower B (Posterior)", lifts: "Romanian Deadlift (4×8 @ RPE 8), Hack Squat (3×10), Lying Leg Curl (4×12), Standing Calf Raise (4×15)" },
      ],
      targetSets: 14,
    },
    ppl: {
      name: "Push / Pull / Legs (PPL)",
      frequency: "6 Days / Week",
      badge: "Push / Pull / Legs (PPL)",
      description: "Gold standard for hypertrophy. Groups muscles by movement pattern, providing 48-72h recovery per muscle group.",
      days: [
        { name: "Push Day", lifts: "Incline DB Press (4×8 @ RPE 8), Overhead Press (3×10), Cable Lateral Raises (4×15), Tricep Pressdowns (3×12)" },
        { name: "Pull Day", lifts: "Barbell Row (4×6-8 @ RPE 8.5), Neutral Lat Pulldown (3×10), Face Pulls (4×15), Incline Dumbbell Curls (3×12)" },
        { name: "Legs Day", lifts: "Barbell Squat (4×6-8 @ RPE 8), Romanian Deadlift (3×8-10), Bulgarian Split Squat (3×10/leg), Standing Calf Raises (4×15)" },
      ],
      targetSets: 16,
    },
    hybrid_ppl: {
      name: "PPL + Upper / Lower Hybrid Split",
      frequency: "5 Days / Week",
      badge: "Hybrid PPL (5-Day)",
      description: "High-frequency protocol combining dedicated push/pull/legs sessions with targeted upper/lower volume.",
      days: [
        { name: "Push Day", lifts: "Incline Barbell Bench (4×6-8), DB Shoulder Press (3×10), Lateral Raises (4×15), Tricep Dips (3×10)" },
        { name: "Pull Day", lifts: "Barbell Deadlift (3×5), Chest-Supported Row (4×8), Lat Pulldown (3×10), Incline DB Curls (3×12)" },
        { name: "Legs Day", lifts: "Back Squat (4×6-8), Romanian Deadlift (3×8), Bulgarian Split Squats (3×10/leg), Calf Raises (4×15)" },
        { name: "Upper Focus", lifts: "Overhead Press (4×6), Weighted Pull-ups (3×6), Cable Flyes (3×12), Hammer Curls (3×12)" },
        { name: "Lower & Core", lifts: "Front Squat (3×8), Lying Hamstring Curl (4×10), Hanging Leg Raises (4×12), Ab Wheel (3×15)" },
      ],
      targetSets: 15,
    },
    full_body: {
      name: "Full Body Frequency",
      frequency: "3 Days / Week",
      badge: "Full Body Frequency (3-Day)",
      description: "High-efficiency periodization that stimulates muscle protein synthesis across the entire kinetic chain every 48 hours.",
      days: [
        { name: "Session A", lifts: "Front Squat (3×8 @ RPE 8), Flat DB Bench (3×8), Chest-Supported Row (3×10), DB Lateral Raises (3×15)" },
        { name: "Session B", lifts: "Trap Bar Deadlift (3×6 @ RPE 8), Overhead Press (3×8), Lat Pulldown (3×10), Lying Leg Curl (3×12)" },
        { name: "Session C", lifts: "Bulgarian Split Squat (3×10/leg), Incline DB Bench (3×10), Cable Rows (3×12), DB Bicep / Tricep Superset (3×12)" },
      ],
      targetSets: 12,
    },
  };

  const currentSplit = useMemo(() => {
    if (activeSplit === "custom") {
      return {
        name: customSplit.name || "Custom Split",
        frequency: `${customSplit.daysCount || customSplit.days.length} Days / Week`,
        badge: `Custom Split (${customSplit.daysCount || customSplit.days.length}-Day)`,
        description:
          customSplit.description ||
          "Personalized split tailored to specific weak-points and weekly schedule.",
        days: customSplit.days.map((d) => ({ name: d.name, lifts: d.lifts })),
        targetSets: customSplit.targetSets || 14,
      };
    }
    return splitDetails[activeSplit] || splitDetails.upper_lower;
  }, [activeSplit, customSplit, splitDetails]);

  // Helper to load profile for an authenticated user
  const loadProfileForUser = async (user: User) => {
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        if (data.profile) {
          setHasProfile(true);
          if (data.profile.avatar) setAvatar(data.profile.avatar);
          if (data.user?.name) {
            setFullName(data.user.name);
          } else if (data.profile.name) {
            setFullName(data.profile.name);
          } else if (data.profile.firstName) {
            setFullName(`${data.profile.firstName} ${data.profile.lastName || ""}`.trim());
          }
          if (data.profile.age) setAge(data.profile.age);
          if (data.profile.gender) setGender(data.profile.gender);
          if (data.profile.heightCm) {
            const totalIn = Math.round(data.profile.heightCm / 2.54);
            setHeightFt(Math.floor(totalIn / 12));
            setHeightIn(totalIn % 12);
          }
          if (data.profile.weightKg) setCurrentWeightLbs(Math.round(data.profile.weightKg * 2.20462));
          if (data.profile.goalWeightKg) setGoalWeightLbs(Math.round(data.profile.goalWeightKg * 2.20462));
          if (data.profile.goal) setGoal(data.profile.goal === "LOSE_WEIGHT" ? "CUT" : data.profile.goal === "BUILD_MUSCLE" ? "BULK" : "MAINTAIN");
          if (data.profile.activityLevel) setActivityLevel(data.profile.activityLevel);
          if (data.profile.splitDays) setUserSplitDays(data.profile.splitDays);
          if (data.profile.splitType) setUserSplitType(data.profile.splitType);

          if (typeof window !== "undefined") {
            try {
              const currentStored = localStorage.getItem("sw_athlete_profile");
              const parsedExisting = currentStored ? JSON.parse(currentStored) : {};
              const totalIn = data.profile.heightCm ? Math.round(data.profile.heightCm / 2.54) : 75;
              const hFt = data.profile.heightCm ? Math.floor(totalIn / 12) : (parsedExisting.heightFt || 6);
              const hIn = data.profile.heightCm ? (totalIn % 12) : (parsedExisting.heightIn ?? 3);
              const localPayload = {
                ...parsedExisting,
                isCompleted: true,
                fullName: data.user?.name || (data.profile.firstName ? `${data.profile.firstName} ${data.profile.lastName || ""}`.trim() : parsedExisting.fullName),
                avatar: parsedExisting.avatar || avatar,
                age: data.profile.age || parsedExisting.age,
                gender: data.profile.gender || parsedExisting.gender,
                heightFt: hFt,
                heightIn: hIn,
                heightCm: data.profile.heightCm || (hFt * 12 + hIn) * 2.54,
                weightLbs: data.profile.weightKg ? Math.round(data.profile.weightKg * 2.20462) : parsedExisting.weightLbs,
                goalWeightLbs: data.profile.goalWeightKg ? Math.round(data.profile.goalWeightKg * 2.20462) : parsedExisting.goalWeightLbs,
                goal: data.profile.goal === "LOSE_WEIGHT" ? "CUT" : data.profile.goal === "BUILD_MUSCLE" ? "BULK" : "MAINTAIN",
                activityLevel: data.profile.activityLevel || parsedExisting.activityLevel,
                splitDays: data.profile.splitDays || parsedExisting.splitDays || 4,
                splitType: data.profile.splitType || parsedExisting.splitType || "Upper / Lower Power & Hypertrophy",
              };
              localStorage.setItem("sw_athlete_profile", JSON.stringify(localPayload));
              document.cookie = `sw_athlete_profile=true; path=/; max-age=31536000; SameSite=Lax`;
            } catch {}
          }
          return true;
        }
      }
      return false;
    } catch (err) {
      console.warn("Failed to load profile for user:", err);
      return false;
    }
  };

  // --- Initial Session & Auth Sync ---
  useEffect(() => {
    async function initSessionAndProfile() {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        setAuthUser(currentUser);
        if (currentUser) {
          if (currentUser.email) setEmail(currentUser.email);
          if (currentUser.user_metadata?.full_name) setFullName(currentUser.user_metadata.full_name);
          await loadProfileForUser(currentUser);

          if (typeof window !== "undefined") {
            const loadedCustom = loadCustomSplit();
            setCustomSplit(loadedCustom);
          }
        } else {
          // Unauthenticated: redirect to /profile
          setHasProfile(false);
          if (typeof window !== "undefined") {
            localStorage.removeItem("sw_athlete_profile");
            document.cookie = "sw_athlete_profile=; path=/; max-age=0";
            window.dispatchEvent(new Event("sw_profile_updated"));
            window.location.replace("/profile");
          }
        }
      } catch (err) {
        console.warn("Init session error:", err);
      }
    }

    initSessionAndProfile();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event: AuthChangeEvent, session: Session | null) => {
      if (session?.user) {
        setAuthUser(session.user);
        if (session.user.email) setEmail(session.user.email);
        if (session.user.user_metadata?.full_name) setFullName(session.user.user_metadata.full_name);
        await loadProfileForUser(session.user);
      } else {
        setAuthUser(null);
        setHasProfile(false);
        if (typeof window !== "undefined") {
          localStorage.removeItem("sw_athlete_profile");
          document.cookie = "sw_athlete_profile=; path=/; max-age=0";
          window.dispatchEvent(new Event("sw_profile_updated"));
          window.location.replace("/profile");
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Real-time synchronization when profile is updated from /profile or another tab
  useEffect(() => {
    const handleProfileUpdate = () => {
      if (authUser) {
        loadProfileForUser(authUser);
      }
    };

    window.addEventListener("sw_profile_updated", handleProfileUpdate);
    window.addEventListener("storage", handleProfileUpdate);
    return () => {
      window.removeEventListener("sw_profile_updated", handleProfileUpdate);
      window.removeEventListener("storage", handleProfileUpdate);
    };
  }, [authUser]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-12">
      {/* ========================================================================= */}
      {/* CORE MODULES COMMAND HUB (DIRECT ACCESS TO DEDICATED PAGES)               */}
      {/* ========================================================================= */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Dedicated App Modules</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Your Coaching Command Center
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400">
            Access dedicated, focused spaces for precision macro nutrition, autoregulated workout splits, telemetry analytics, and 24/7 AI consultation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card 1: Meals & Nutrition */}
          <Card className="bg-neutral-900/80 border-neutral-800 p-6 flex flex-col justify-between hover:border-emerald-500/50 transition duration-300 group shadow-xl">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-105 transition">
                  <Utensils className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-mono font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg">
                  Mifflin-St Jeor Engine
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition">
                  Meals &amp; Nutrition
                </h3>
                <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                  Precision daily caloric expenditure calculations, macro ratios, and USDA verified food &amp; barcode scanning.
                </p>
              </div>

              <div className="rounded-xl bg-neutral-950 p-3.5 border border-neutral-800/80 space-y-2">
                <div className="flex justify-between items-baseline text-xs">
                  <span className="text-neutral-400">Target Intake:</span>
                  <span className="text-base font-bold font-mono text-emerald-400">
                    {calculated.targetCalories} kcal / day
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-neutral-400 font-mono border-t border-neutral-800/80 pt-2">
                  <span>P: <strong className="text-white">{calculated.targetProtein}g</strong></span>
                  <span>C: <strong className="text-white">{calculated.targetCarbs}g</strong></span>
                  <span>F: <strong className="text-white">{calculated.targetFat}g</strong></span>
                </div>
              </div>
            </div>

            <div className="pt-5 border-t border-neutral-800/80 mt-4 flex items-center justify-between">
              <span className="text-xs text-neutral-500">Full tracker &amp; barcode OCR</span>
              <Link
                href="/meals"
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-neutral-950 hover:bg-emerald-400 transition shadow-md shadow-emerald-500/15"
              >
                <span>Open Meals Page</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </Card>

          {/* Card 2: Workouts & Routines */}
          <Card className="bg-neutral-900/80 border-neutral-800 p-6 flex flex-col justify-between hover:border-cyan-500/50 transition duration-300 group shadow-xl">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:scale-105 transition">
                  <Dumbbell className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-mono font-semibold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-lg">
                  Autoregulated Volume
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition">
                  Workouts &amp; Periodization
                </h3>
                <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                  Systematic RPE &amp; RIR autoregulation, customizable split templates, and progressive overload tracking.
                </p>
              </div>

              <div className="rounded-xl bg-neutral-950 p-3.5 border border-neutral-800/80 space-y-2">
                <div className="flex justify-between items-baseline text-xs">
                  <span className="text-neutral-400">Active Program:</span>
                  <span className="text-xs font-bold font-mono text-cyan-400 truncate max-w-[180px]">
                    {currentSplit.name}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-neutral-400 font-mono border-t border-neutral-800/80 pt-2">
                  <span>Frequency: <strong className="text-white">{currentSplit.frequency}</strong></span>
                  <span>Sets: <strong className="text-white">~{currentSplit.targetSets}/wk</strong></span>
                </div>
              </div>
            </div>

            <div className="pt-5 border-t border-neutral-800/80 mt-4 flex items-center justify-between">
              <span className="text-xs text-neutral-500">Split builder &amp; logger</span>
              <Link
                href="/workouts"
                className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-500 px-4 py-2 text-xs font-bold text-neutral-950 hover:bg-cyan-400 transition shadow-md shadow-cyan-500/15"
              >
                <span>Open Workouts Page</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </Card>

          {/* Card 3: Progress & Telemetry */}
          <Card className="bg-neutral-900/80 border-neutral-800 p-6 flex flex-col justify-between hover:border-amber-500/50 transition duration-300 group shadow-xl">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-105 transition">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-mono font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg">
                  Real-Time Analytics
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white group-hover:text-amber-400 transition">
                  Progress &amp; Strength Telemetry
                </h3>
                <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                  Estimated 1-Rep Max curves, body weight trajectory tracking, and weekly volume compliance.
                </p>
              </div>

              <div className="rounded-xl bg-neutral-950 p-3.5 border border-neutral-800/80 space-y-2">
                <div className="flex justify-between items-baseline text-xs">
                  <span className="text-neutral-400">Scale Weight Target:</span>
                  <span className="text-xs font-bold font-mono text-amber-400">
                    {currentWeightLbs} lbs → {goalWeightLbs} lbs
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-neutral-400 font-mono border-t border-neutral-800/80 pt-2">
                  <span>Stimulus: <strong className="text-emerald-400">94.2%</strong></span>
                  <span>1RM Gain: <strong className="text-white">+8.4%</strong></span>
                </div>
              </div>
            </div>

            <div className="pt-5 border-t border-neutral-800/80 mt-4 flex items-center justify-between">
              <span className="text-xs text-neutral-500">1RM curves &amp; body comp</span>
              <Link
                href="/progress"
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-neutral-950 hover:bg-amber-400 transition shadow-md shadow-amber-500/15"
              >
                <span>Open Progress Page</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </Card>

          {/* Card 4: AI Coach */}
          <Card className="bg-neutral-900/80 border-neutral-800 p-6 flex flex-col justify-between hover:border-emerald-500/50 transition duration-300 group shadow-xl">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 text-neutral-950 shadow-md group-hover:scale-105 transition">
                  <Sparkles className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-mono font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>24/7 AI Ready</span>
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition">
                  AI Strength &amp; Nutrition Coach
                </h3>
                <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                  Interactive sports science AI consultation for exercise substitutions, joint adaptations, and fueling.
                </p>
              </div>

              <div className="rounded-xl bg-neutral-950 p-3.5 border border-neutral-800/80 space-y-2">
                <div className="flex justify-between items-baseline text-xs">
                  <span className="text-neutral-400">Context Calibration:</span>
                  <span className="text-xs font-bold font-mono text-emerald-400">
                    {hasProfile ? "Full Athlete Profile Linked" : "Guest Mode Active"}
                  </span>
                </div>
                <div className="text-[11px] text-neutral-400 truncate border-t border-neutral-800/80 pt-2">
                  <span>Expert in: Biomechanics, Mifflin-St Jeor &amp; Hypertrophy</span>
                </div>
              </div>
            </div>

            <div className="pt-5 border-t border-neutral-800/80 mt-4 flex items-center justify-between">
              <span className="text-xs text-neutral-500">Autonomous chat specialist</span>
              <Link
                href="/coach"
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 px-4 py-2 text-xs font-bold text-neutral-950 hover:from-emerald-400 hover:to-emerald-300 transition shadow-md shadow-emerald-500/15"
              >
                <span>Consult AI Coach</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-800/80 pt-8 pb-12 text-center text-xs text-neutral-500">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Dumbbell className="h-4 w-4 text-emerald-400" />
          <span className="font-bold text-neutral-300">StrengthWise AI Coach</span>
        </div>
        <p>Built with Next.js 15, Tremor UI, Tailwind CSS, Supabase &amp; Prisma.</p>
      </footer>
    </div>
  );
}
