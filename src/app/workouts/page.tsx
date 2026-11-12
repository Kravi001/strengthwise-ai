"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Card,
  Title,
  Text,
} from "@/components/tremor";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Dumbbell,
  Layers,
  Pause,
  Play,
  Plus,
  RotateCcw,
  ShieldCheck,
  Shuffle,
  Sparkles,
  Timer,
  Trash2,
  Zap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { WorkoutModal } from "@/components/workout-modal";
import { CustomSplitModal } from "@/components/custom-split-modal";
import { GuestAuthModal } from "@/components/guest-auth-modal";
import {
  CustomSplit,
  DEFAULT_CUSTOM_SPLIT,
  loadCustomSplit,
} from "@/lib/custom-split";
import type { User } from "@supabase/supabase-js";
import { PageHeader } from "@/components/page-header";
import { SampleDataBanner } from "@/components/sample-data-banner";

export default function WorkoutsPage() {
  const supabase = createClient();

  const [authUser, setAuthUser] = useState<User | null>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [loading, setLoading] = useState(true);

  // Athlete Profile State
  const [numWeightKg, setNumWeightKg] = useState<number>(83.9);
  const [userSplitDays, setUserSplitDays] = useState<number>(4);
  const [userSplitType, setUserSplitType] = useState<string>("Upper / Lower Power & Hypertrophy");

  // Splits State
  const [activeSplit, setActiveSplit] = useState<"full_body" | "upper_lower" | "hybrid_ppl" | "ppl" | "custom">("upper_lower");
  const [customSplit, setCustomSplit] = useState<CustomSplit>(DEFAULT_CUSTOM_SPLIT);
  const [isCustomSplitModalOpen, setIsCustomSplitModalOpen] = useState(false);

  // Workout Modal State
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
  const [workoutModalPresetName, setWorkoutModalPresetName] = useState<string>("");
  const [workoutModalPresetNotes, setWorkoutModalPresetNotes] = useState<string>("");
  const [workoutModalInitialMode, setWorkoutModalInitialMode] = useState<"routine" | "random" | "freeform">("routine");

  // Guest Auth Intercept Modal State
  const [isGuestAuthModalOpen, setIsGuestAuthModalOpen] = useState(false);
  const [guestModalTitle, setGuestModalTitle] = useState("Create an athlete profile to save your workouts");
  const [guestModalDescription, setGuestModalDescription] = useState(
    "StrengthWise AI synchronizes your exercise volume, RPE, and 1RM trajectory to your personal athlete profile."
  );

  // Live Rest Timer State for Telemetry Preview
  const [restTimerSeconds, setRestTimerSeconds] = useState(135); // 02:15 default
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Interactive Demo Sets Completion State
  const [demoSetsCompleted, setDemoSetsCompleted] = useState<Record<string, boolean>>({
    "bench-1": true,
    "bench-2": true,
    "bench-3": true,
    "bench-4": false,
    "chin-1": true,
    "chin-2": true,
    "chin-3": false,
    "db-1": true,
    "db-2": false,
    "db-3": false,
  });

  // Workouts History State
  const [loggedWorkoutsData, setLoggedWorkoutsData] = useState<{
    workouts: any[];
    summary: {
      totalWorkouts: number;
      thisWeekCount: number;
      totalMinutes: number;
      totalCalories: number;
      weeklyMinutes: number;
      weeklyCalories: number;
    };
  }>({
    workouts: [],
    summary: {
      totalWorkouts: 0,
      thisWeekCount: 0,
      totalMinutes: 0,
      totalCalories: 0,
      weeklyMinutes: 0,
      weeklyCalories: 0,
    },
  });

  // Rest Timer Interval
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && restTimerSeconds > 0) {
      interval = setInterval(() => {
        setRestTimerSeconds((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, restTimerSeconds]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleProtectedAction = (title?: string, description?: string) => {
    if (!authUser) {
      if (title) setGuestModalTitle(title);
      if (description) setGuestModalDescription(description);
      setIsGuestAuthModalOpen(true);
      return false;
    }
    return true;
  };

  const toggleDemoSet = (setId: string) => {
    if (!authUser && !demoSetsCompleted[setId]) {
      // Trigger guest prompt on logging the active set
      handleProtectedAction(
        "Create an athlete profile to save your workouts",
        "Sign in to synchronize your logged sets, weights, and estimated 1RM calculations to PostgreSQL."
      );
      return;
    }
    setDemoSetsCompleted((prev) => ({
      ...prev,
      [setId]: !prev[setId],
    }));
  };

  const splitDetails = useMemo(() => ({
    upper_lower: {
      name: "Upper / Lower Power & Hypertrophy",
      frequency: "4 Days / Week",
      badge: "Upper / Lower (4-Day)",
      description: "Optimal balance of training frequency, joint recovery, and progressive overload for intermediate lifters.",
      days: [
        { name: "Upper A (Heavy Power)", lifts: "Barbell Bench Press (4×5 @ RPE 8), Barbell Bent-Over Row (4×6), Overhead Press (3×8), Incline DB Curl (3×10), Tricep Skullcrushers (3×10)" },
        { name: "Lower A (Quad / Knee Dominant)", lifts: "Barbell Back Squat (4×6 @ RPE 8), Romanian Deadlift (3×8), Bulgarian Split Squat (3×10/leg), Standing Calf Raise (4×15), Hanging Leg Raise (3×12)" },
        { name: "Upper B (Hypertrophy)", lifts: "Incline DB Press (4×8-10), Neutral Grip Lat Pulldown (4×10), Cable Lateral Raise (4×15), Chest-Supported DB Row (3×12), Preacher Curls (3×12)" },
        { name: "Lower B (Posterior Chain)", lifts: "Conventional / Trap Bar Deadlift (3×5 @ RPE 8), Front Squats (3×8), Seated Hamstring Curl (4×12), Walking Lunges (3×12/leg), Cable Crunch (4×15)" },
      ],
      targetSets: 16,
    },
    ppl: {
      name: "Push / Pull / Legs (PPL x 2) Elite Split",
      frequency: "6 Days / Week",
      badge: "PPL Elite (6-Day)",
      description: "Advanced high-volume hypertrophy protocol targeting each muscle group twice weekly with dedicated movement planes.",
      days: [
        { name: "Push A", lifts: "Barbell Bench Press (4×6 @ RPE 8), Overhead Press (3×8), Incline DB Flye (3×12), Cable Lateral Raise (4×15), Tricep Rope Pushdown (4×12)" },
        { name: "Pull A", lifts: "Barbell Deadlift (3×5 @ RPE 8), Chest-Supported Row (4×8), Lat Pulldown (3×10), Face Pulls (4×15), Barbell Bicep Curl (4×10)" },
        { name: "Legs A", lifts: "Barbell Back Squat (4×6 @ RPE 8), Romanian Deadlift (3×8), Leg Press (3×12), Lying Leg Curl (4×12), Standing Calf Raise (4×15)" },
        { name: "Push B", lifts: "Incline Barbell Bench (4×8), DB Shoulder Press (3×10), Cable Crossover (3×15), DB Lateral Raise (4×15), Overhead Cable Tricep Extension (4×12)" },
        { name: "Pull B", lifts: "Weighted Pull-Up (4×6), Neutral Cable Row (4×10), Straight-Arm Pulldown (3×12), Rear Delt Flye (4×15), Incline Hammer Curl (4×12)" },
        { name: "Legs B", lifts: "Front Squat (4×8), Barbell Hip Thrust (4×10), Bulgarian Split Squat (3×10/leg), Seated Hamstring Curl (4×12), Seated Calf Raise (4×20)" },
      ],
      targetSets: 18,
    },
    hybrid_ppl: {
      name: "PPL + Upper / Lower Hybrid Split",
      frequency: "5 Days / Week",
      badge: "Hybrid PPL (5-Day)",
      description: "Combines Push/Pull/Legs focused isolation days with heavy compound Upper and Lower sessions for elite volume distribution.",
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
  }), []);

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

  const fetchLoggedWorkouts = async () => {
    try {
      const res = await fetch("/api/workouts");
      if (res.ok) {
        const data = await res.json();
        setLoggedWorkoutsData(data);
      }
    } catch (err) {
      console.warn("Failed to fetch workouts:", err);
    }
  };

  const handleDeleteWorkout = async (id: string) => {
    try {
      await fetch(`/api/workouts?id=${id}`, { method: "DELETE" });
      await fetchLoggedWorkouts();
    } catch (err) {
      console.warn("Failed to delete workout:", err);
    }
  };

  const handleSelectSplit = (splitKey: "full_body" | "upper_lower" | "hybrid_ppl" | "ppl" | "custom") => {
    setActiveSplit(splitKey);
    if (splitKey === "custom") {
      setUserSplitType("CUSTOM");
      const d = customSplit.daysCount || customSplit.days.length || 4;
      setUserSplitDays(d);
      try {
        const stored = localStorage.getItem("sw_athlete_profile");
        if (stored) {
          const p = JSON.parse(stored);
          p.splitType = "CUSTOM";
          p.splitDays = d;
          localStorage.setItem("sw_athlete_profile", JSON.stringify(p));
        }
      } catch {}
    } else {
      const daysMap = { full_body: 3, upper_lower: 4, hybrid_ppl: 5, ppl: 6 };
      const nameMap = {
        full_body: "Full Body Foundation Split",
        upper_lower: "Upper / Lower Power & Hypertrophy",
        hybrid_ppl: "PPL + Upper / Lower Hybrid Split",
        ppl: "Push / Pull / Legs (PPL x 2) Elite Split",
      };
      setUserSplitType(nameMap[splitKey]);
      setUserSplitDays(daysMap[splitKey]);
      try {
        const stored = localStorage.getItem("sw_athlete_profile");
        if (stored) {
          const p = JSON.parse(stored);
          p.splitType = nameMap[splitKey];
          p.splitDays = daysMap[splitKey];
          localStorage.setItem("sw_athlete_profile", JSON.stringify(p));
        }
      } catch {}
    }
  };

  useEffect(() => {
    document.title = "Workouts — StrengthWise";
    async function loadData() {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        setAuthUser(currentUser);

        // Do NOT redirect unauthenticated guests; allow exploration of demo telemetry
        if (!currentUser) {
          setHasProfile(false);
          // Populate sample demo workouts for guest exploration
          setLoggedWorkoutsData({
            workouts: [
              {
                id: "demo-w1",
                name: "Upper Body Strength (Session A)",
                durationMinutes: 65,
                caloriesBurned: 420,
                loggedAt: new Date().toISOString(),
                notes: "Barbell Bench Press: 225 lbs × 5, 5, 5, 5 @ RPE 8.5\nWeighted Chin-ups: +25 lbs × 6, 6, 5\nIncline DB Press: 85 lbs × 8, 8, 7",
              },
              {
                id: "demo-w2",
                name: "Lower Body Quad Focus (Session B)",
                durationMinutes: 58,
                caloriesBurned: 480,
                loggedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
                notes: "Barbell Back Squat: 315 lbs × 6, 6, 6 @ RPE 8.0\nRomanian Deadlift: 275 lbs × 8, 8\nBulgarian Split Squats: 50 lbs × 10/leg",
              },
            ],
            summary: {
              totalWorkouts: 14,
              thisWeekCount: 2,
              totalMinutes: 840,
              totalCalories: 6100,
              weeklyMinutes: 123,
              weeklyCalories: 900,
            },
          });
          setLoading(false);
          return;
        }

        if (currentUser) {
          const res = await fetch("/api/profile");
          if (res.ok) {
            const data = await res.json();
            if (data.profile) {
              setHasProfile(true);
              if (data.profile.weightKg) setNumWeightKg(data.profile.weightKg);
              if (data.profile.splitDays) setUserSplitDays(data.profile.splitDays);
              if (data.profile.splitType) {
                setUserSplitType(data.profile.splitType);
                const st = data.profile.splitType.toLowerCase();
                if (st.includes("custom")) setActiveSplit("custom");
                else if (st.includes("full body")) setActiveSplit("full_body");
                else if (st.includes("ppl +") || st.includes("hybrid")) setActiveSplit("hybrid_ppl");
                else if (st.includes("ppl") || st.includes("push / pull")) setActiveSplit("ppl");
                else setActiveSplit("upper_lower");
              }
            }
          }
          await fetchLoggedWorkouts();
        }

        // Local storage fallback
        if (typeof window !== "undefined") {
          const loadedCustom = loadCustomSplit();
          setCustomSplit(loadedCustom);

          const stored = localStorage.getItem("sw_athlete_profile");
          if (stored) {
            const p = JSON.parse(stored);
            if (p.isCompleted || p.age || p.weightLbs) {
              setHasProfile(true);
              if (p.weightLbs) setNumWeightKg(p.weightLbs / 2.20462);
              if (p.splitDays) setUserSplitDays(p.splitDays);
              if (p.splitType) {
                setUserSplitType(p.splitType);
                const st = p.splitType.toLowerCase();
                if (st.includes("custom")) setActiveSplit("custom");
                else if (st.includes("full body")) setActiveSplit("full_body");
                else if (st.includes("hybrid")) setActiveSplit("hybrid_ppl");
                else if (st.includes("ppl")) setActiveSplit("ppl");
                else setActiveSplit("upper_lower");
              }
            }
          }
        }
      } catch (err) {
        console.warn("Error loading workouts page data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [supabase]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 space-y-6 sm:space-y-8 animate-in fade-in duration-150 ease-out">
      {/* Page Header */}
      <PageHeader
        title="Workouts"
        description="Follow your training split, log your sets, and use the rest timer between sets."
        actions={
          <>
          <button
            type="button"
            onClick={() => {
              if (handleProtectedAction("Track Routine Split Session", "Sign in or create an athlete profile to log and save routine sets.")) {
                setWorkoutModalPresetName(currentSplit.days[0]?.name || "Workout Session");
                setWorkoutModalPresetNotes(currentSplit.days[0]?.lifts || "");
                setWorkoutModalInitialMode("routine");
                setIsWorkoutModalOpen(true);
              }
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-xs font-semibold text-neutral-950 transition-colors duration-150 ease-out shadow-sm"
          >
            <Plus className="h-3.5 w-3.5 stroke-[3]" />
            <span>Log Workout</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (handleProtectedAction("Roll Random Workout", "Sign in or create an athlete profile to roll and save randomized training sessions.")) {
                setWorkoutModalInitialMode("random");
                setIsWorkoutModalOpen(true);
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-700 bg-neutral-800 px-3 py-2 text-xs font-medium text-neutral-200 hover:text-white hover:bg-neutral-700 transition-colors duration-150 ease-out shadow-sm"
          >
            <Shuffle className="h-3.5 w-3.5 text-neutral-400" />
            <span>Random Workout</span>
          </button>
          </>
        }
      />

      {!authUser && !loading && (
        <SampleDataBanner
          message="This is an example workout. Sign in to log your own sets and keep your history."
          onAction={() => setIsGuestAuthModalOpen(true)}
          actionLabel="Sign in or create profile"
        />
      )}

      {/* ========================================================================= */}
      {/* 1. RICH LIVE DEMO VIEW: UPPER BODY STRENGTH (SESSION A)                    */}
      {/* ========================================================================= */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4 sm:p-6 space-y-5 shadow-sm">
        {/* Session Header Strip */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold tracking-wider uppercase text-zinc-400 font-mono">
                Today's Session
              </span>
              <span className="rounded bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-mono font-semibold text-emerald-400">
                RPE 8.0 - 9.0
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white">
              Upper Body Strength (Session A)
            </h2>
            <p className="text-xs text-neutral-400">
              Primary horizontal push compound progression paired with vertical pulling density.
            </p>
          </div>

          {/* Telemetry Strip Numbers */}
          <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto pb-1 sm:pb-0">
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-center min-w-[80px]">
              <span className="text-[10px] font-semibold tracking-wider uppercase text-zinc-400 font-mono block">
                TARGET VOLUME
              </span>
              <span className="text-sm font-bold text-white font-mono tabular-nums">
                10 TOTAL SETS
              </span>
            </div>

            <div className="rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-center min-w-[80px]">
              <span className="text-[10px] font-semibold tracking-wider uppercase text-zinc-400 font-mono block">
                EST. DURATION
              </span>
              <span className="text-sm font-bold text-white font-mono tabular-nums">
                65 MINS
              </span>
            </div>

            <div className="rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-center min-w-[80px]">
              <span className="text-[10px] font-semibold tracking-wider uppercase text-zinc-400 font-mono block">
                EST. ENERGY
              </span>
              <span className="text-sm font-bold text-white font-mono tabular-nums">
                420 KCAL
              </span>
            </div>

            <div className="rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-center min-w-[80px]">
              <span className="text-[10px] font-semibold tracking-wider uppercase text-zinc-400 font-mono block">
                REST TARGET
              </span>
              <span className="text-sm font-bold text-emerald-400 font-mono tabular-nums">
                3:00 / 2:30
              </span>
            </div>
          </div>
        </div>

        {/* Live Rest Interval Timer Preview */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-900 border border-neutral-800 text-emerald-400 shadow-sm">
              <Timer className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[10px] font-semibold tracking-wider uppercase text-zinc-400 font-mono">
                REST TIMER
              </div>
              <div className="text-xs text-neutral-300">
                Counts down your rest between sets
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-emerald-400 tracking-tight">
              {formatTimer(restTimerSeconds)}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsTimerRunning((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors duration-150 ease-out shadow-sm ${
                  isTimerRunning
                    ? "bg-neutral-800 border border-neutral-700 text-white hover:bg-neutral-700"
                    : "bg-emerald-500 hover:bg-emerald-400 text-neutral-950"
                }`}
              >
                {isTimerRunning ? (
                  <>
                    <Pause className="h-3.5 w-3.5" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 fill-current" />
                    <span>Start Rest</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsTimerRunning(false);
                  setRestTimerSeconds(180);
                }}
                className="rounded-lg border border-neutral-800 bg-neutral-900 p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors duration-150 ease-out"
                title="Reset to 3:00"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* 3 Exercises Telemetry Breakdown */}
        <div className="space-y-4">
          {/* Exercise 1: Barbell Bench Press */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-950/70 p-3.5 sm:p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-neutral-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold tracking-wider uppercase text-zinc-400 font-mono">
                    EXERCISE 01
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    Primary Compound
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-white">
                  Barbell Bench Press
                </h3>
              </div>
              <div className="text-[11px] font-mono tabular-nums text-neutral-400">
                Target: <span className="text-white font-semibold">4 sets × 5 reps @ 225 lbs (102.1 kg)</span> • RPE 8.0 • 3:00 Rest
              </div>
            </div>

            {/* Sets Grid */}
            <div className="space-y-1.5">
              <div className="grid grid-cols-6 text-[10px] font-semibold tracking-wider uppercase text-zinc-400 font-mono px-2 py-1">
                <span>SET</span>
                <span>PREV</span>
                <span>WEIGHT</span>
                <span>REPS</span>
                <span>RPE</span>
                <span className="text-right">ACTION</span>
              </div>

              {[
                { set: 1, prev: "220 × 5", weight: "225 lbs", reps: 5, rpe: "8.0", key: "bench-1" },
                { set: 2, prev: "220 × 5", weight: "225 lbs", reps: 5, rpe: "8.0", key: "bench-2" },
                { set: 3, prev: "225 × 5", weight: "225 lbs", reps: 5, rpe: "8.5", key: "bench-3" },
                { set: 4, prev: "225 × 4", weight: "225 lbs", reps: 5, rpe: "9.0", key: "bench-4" },
              ].map((s) => {
                const isCompleted = demoSetsCompleted[s.key];
                return (
                  <div
                    key={s.key}
                    className={`grid grid-cols-6 items-center px-2 py-2 rounded-lg text-xs font-mono tabular-nums transition-colors duration-150 ease-out border ${
                      isCompleted
                        ? "bg-neutral-900 border-neutral-800 text-neutral-300"
                        : "bg-neutral-950 border-neutral-800 text-white"
                    }`}
                  >
                    <span className="font-semibold text-neutral-400">0{s.set}</span>
                    <span className="text-neutral-500 text-[11px]">{s.prev}</span>
                    <span className="font-bold text-white">{s.weight}</span>
                    <span>{s.reps} reps</span>
                    <span className="text-emerald-400">@{s.rpe}</span>
                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => toggleDemoSet(s.key)}
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors duration-150 ease-out ${
                          isCompleted
                            ? "bg-emerald-500/15 border border-emerald-500/40 text-emerald-400"
                            : "bg-emerald-500 hover:bg-emerald-400 text-neutral-950 shadow-sm"
                        }`}
                      >
                        {isCompleted ? (
                          <>
                            <Check className="h-3 w-3 stroke-[3]" />
                            <span>Logged</span>
                          </>
                        ) : (
                          <span>Log Set</span>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Exercise 2: Weighted Chin-ups */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-950/70 p-3.5 sm:p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-neutral-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold tracking-wider uppercase text-zinc-400 font-mono">
                    EXERCISE 02
                  </span>
                  <span className="text-[10px] font-mono text-neutral-300 bg-neutral-800 px-1.5 py-0.5 rounded border border-neutral-700">
                    Vertical Pull
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-white">
                  Weighted Chin-ups
                </h3>
              </div>
              <div className="text-[11px] font-mono tabular-nums text-neutral-400">
                Target: <span className="text-white font-semibold">3 sets × 6 reps @ BW + 25 lbs (11.3 kg)</span> • RPE 8.5 • 2:30 Rest
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="grid grid-cols-6 text-[10px] font-semibold tracking-wider uppercase text-zinc-400 font-mono px-2 py-1">
                <span>SET</span>
                <span>PREV</span>
                <span>WEIGHT</span>
                <span>REPS</span>
                <span>RPE</span>
                <span className="text-right">ACTION</span>
              </div>

              {[
                { set: 1, prev: "+20 × 6", weight: "+25 lbs", reps: 6, rpe: "8.0", key: "chin-1" },
                { set: 2, prev: "+25 × 6", weight: "+25 lbs", reps: 6, rpe: "8.5", key: "chin-2" },
                { set: 3, prev: "+25 × 5", weight: "+25 lbs", reps: 5, rpe: "9.0", key: "chin-3" },
              ].map((s) => {
                const isCompleted = demoSetsCompleted[s.key];
                return (
                  <div
                    key={s.key}
                    className={`grid grid-cols-6 items-center px-2 py-2 rounded-lg text-xs font-mono tabular-nums transition-colors duration-150 ease-out border ${
                      isCompleted
                        ? "bg-neutral-900 border-neutral-800 text-neutral-300"
                        : "bg-neutral-950 border-neutral-800 text-white"
                    }`}
                  >
                    <span className="font-semibold text-neutral-400">0{s.set}</span>
                    <span className="text-neutral-500 text-[11px]">{s.prev}</span>
                    <span className="font-bold text-white">{s.weight}</span>
                    <span>{s.reps} reps</span>
                    <span className="text-emerald-400">@{s.rpe}</span>
                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => toggleDemoSet(s.key)}
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors duration-150 ease-out ${
                          isCompleted
                            ? "bg-emerald-500/15 border border-emerald-500/40 text-emerald-400"
                            : "bg-emerald-500 hover:bg-emerald-400 text-neutral-950 shadow-sm"
                        }`}
                      >
                        {isCompleted ? (
                          <>
                            <Check className="h-3 w-3 stroke-[3]" />
                            <span>Logged</span>
                          </>
                        ) : (
                          <span>Log Set</span>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Exercise 3: Incline Dumbbell Press */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-950/70 p-3.5 sm:p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-neutral-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold tracking-wider uppercase text-zinc-400 font-mono">
                    EXERCISE 03
                  </span>
                  <span className="text-[10px] font-mono text-neutral-300 bg-neutral-800 px-1.5 py-0.5 rounded border border-neutral-700">
                    Accessory Hypertrophy
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-white">
                  Incline Dumbbell Press
                </h3>
              </div>
              <div className="text-[11px] font-mono tabular-nums text-neutral-400">
                Target: <span className="text-white font-semibold">3 sets × 8 reps @ 85 lbs / hand (38.6 kg)</span> • RPE 8.0 • 2:00 Rest
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="grid grid-cols-6 text-[10px] font-semibold tracking-wider uppercase text-zinc-400 font-mono px-2 py-1">
                <span>SET</span>
                <span>PREV</span>
                <span>WEIGHT</span>
                <span>REPS</span>
                <span>RPE</span>
                <span className="text-right">ACTION</span>
              </div>

              {[
                { set: 1, prev: "80 × 8", weight: "85 lbs", reps: 8, rpe: "8.0", key: "db-1" },
                { set: 2, prev: "85 × 8", weight: "85 lbs", reps: 8, rpe: "8.0", key: "db-2" },
                { set: 3, prev: "85 × 7", weight: "85 lbs", reps: 7, rpe: "8.5", key: "db-3" },
              ].map((s) => {
                const isCompleted = demoSetsCompleted[s.key];
                return (
                  <div
                    key={s.key}
                    className={`grid grid-cols-6 items-center px-2 py-2 rounded-lg text-xs font-mono tabular-nums transition-colors duration-150 ease-out border ${
                      isCompleted
                        ? "bg-neutral-900 border-neutral-800 text-neutral-300"
                        : "bg-neutral-950 border-neutral-800 text-white"
                    }`}
                  >
                    <span className="font-semibold text-neutral-400">0{s.set}</span>
                    <span className="text-neutral-500 text-[11px]">{s.prev}</span>
                    <span className="font-bold text-white">{s.weight}</span>
                    <span>{s.reps} reps</span>
                    <span className="text-emerald-400">@{s.rpe}</span>
                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => toggleDemoSet(s.key)}
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors duration-150 ease-out ${
                          isCompleted
                            ? "bg-emerald-500/15 border border-emerald-500/40 text-emerald-400"
                            : "bg-emerald-500 hover:bg-emerald-400 text-neutral-950 shadow-sm"
                        }`}
                      >
                        {isCompleted ? (
                          <>
                            <Check className="h-3 w-3 stroke-[3]" />
                            <span>Logged</span>
                          </>
                        ) : (
                          <span>Log Set</span>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer actions for the Session */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-neutral-800">
          <div className="text-xs text-neutral-400 font-mono">
            {Object.values(demoSetsCompleted).filter(Boolean).length} of 10 sets completed in this session
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setDemoSetsCompleted({
                  "bench-1": true,
                  "bench-2": true,
                  "bench-3": true,
                  "bench-4": false,
                  "chin-1": true,
                  "chin-2": true,
                  "chin-3": false,
                  "db-1": true,
                  "db-2": false,
                  "db-3": false,
                });
              }}
              className="rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-xs font-semibold text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors duration-150 ease-out"
            >
              Reset Demo Sets
            </button>
            <button
              type="button"
              onClick={() => {
                if (handleProtectedAction("Save Workout Routine", "Create an athlete profile to save your completed workout routine to PostgreSQL.")) {
                  setWorkoutModalPresetName("Upper Body Strength (Session A)");
                  setWorkoutModalPresetNotes(
                    "Barbell Bench Press: 225 lbs × 5, 5, 5, 5 @ RPE 8.5\nWeighted Chin-ups: +25 lbs × 6, 6, 5\nIncline DB Press: 85 lbs × 8, 8, 7"
                  );
                  setWorkoutModalInitialMode("routine");
                  setIsWorkoutModalOpen(true);
                }
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-xs font-semibold text-neutral-950 transition-colors duration-150 ease-out shadow-sm"
            >
              <Zap className="h-3.5 w-3.5 fill-current" />
              <span>Save Routine</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. PERIODIZATION SPLIT ARCHITECTURE & ROUTINE EXPLORER                     */}
      {/* ========================================================================= */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4 sm:p-6 space-y-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-4">
          <div>
            <div className="text-xs font-semibold tracking-wider uppercase text-zinc-400 font-mono mb-1">
              PERIODIZATION ARCHITECTURE
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white">
              {currentSplit.name}
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              {currentSplit.description}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                if (handleProtectedAction("Configure Custom Split", "Create an athlete profile to build and store custom training splits.")) {
                  setIsCustomSplitModalOpen(true);
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-neutral-200 hover:text-white hover:bg-neutral-700 transition-colors duration-150 ease-out shadow-sm"
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Custom Split Builder</span>
            </button>
          </div>
        </div>

        {/* Split Switcher Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { key: "upper_lower", label: "Upper / Lower (4D)" },
            { key: "ppl", label: "PPL Elite (6D)" },
            { key: "hybrid_ppl", label: "Hybrid PPL (5D)" },
            { key: "full_body", label: "Full Body (3D)" },
            { key: "custom", label: "Custom Split" },
          ].map(({ key, label }) => {
            const isSelected = activeSplit === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleSelectSplit(key as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors duration-150 ease-out border ${
                  isSelected
                    ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-sm"
                    : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Routine Days Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {currentSplit.days.map((day, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-neutral-800 bg-neutral-950 p-3.5 sm:p-4 space-y-2.5 flex flex-col justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold tracking-wider uppercase text-zinc-400 font-mono">
                    SESSION 0{idx + 1}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Prescribed
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white">{day.name}</h4>
                <p className="text-xs text-neutral-400 font-mono leading-relaxed text-[11px] pt-1">
                  {day.lifts}
                </p>
              </div>

              <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (handleProtectedAction("Log " + day.name, "Sign in or create an athlete profile to log this routine session.")) {
                      setWorkoutModalPresetName(day.name);
                      setWorkoutModalPresetNotes(day.lifts);
                      setWorkoutModalInitialMode("routine");
                      setIsWorkoutModalOpen(true);
                    }
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors duration-150 ease-out"
                >
                  <span>Log This Session</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. LOGGED WORKOUTS & ACTIVITY TELEMETRY CARD                               */}
      {/* ========================================================================= */}
      <Card className="bg-neutral-900 border border-neutral-800 p-4 sm:p-6 space-y-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs uppercase font-mono tracking-wider text-emerald-400 font-semibold mb-1">
              <Dumbbell className="h-3.5 w-3.5" />
              <span>Training Telemetry &amp; Log</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Workout Session History
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Real-time volume accumulation, training duration, and caloric output.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => {
                if (handleProtectedAction("Record Workout Session", "Create an athlete profile to log and save workout sessions.")) {
                  setWorkoutModalPresetName(currentSplit.days[0]?.name || "Workout Session");
                  setWorkoutModalPresetNotes(currentSplit.days[0]?.lifts || "");
                  setWorkoutModalInitialMode("routine");
                  setIsWorkoutModalOpen(true);
                }
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-xs font-semibold text-neutral-950 transition-colors duration-150 ease-out shadow-sm"
            >
              <Plus className="h-3.5 w-3.5 stroke-[3]" />
              <span>Record Session</span>
            </button>
          </div>
        </div>

        {/* Telemetry Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3.5 space-y-1 shadow-sm">
            <div className="text-[10px] font-semibold tracking-wider uppercase text-zinc-400 font-mono">
              SESSIONS THIS WEEK
            </div>
            <div className="text-2xl font-black text-white font-mono tabular-nums flex items-baseline gap-1.5">
              <span>{loggedWorkoutsData.summary.thisWeekCount}</span>
              <span className="text-xs text-neutral-500 font-normal">/ {userSplitDays} target</span>
            </div>
            <div className="text-[10px] text-emerald-400 font-mono">
              {loggedWorkoutsData.summary.thisWeekCount >= userSplitDays
                ? "Weekly Target Reached! 🔥"
                : `${Math.max(0, userSplitDays - loggedWorkoutsData.summary.thisWeekCount)} sessions remaining`}
            </div>
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3.5 space-y-1 shadow-sm">
            <div className="text-[10px] font-semibold tracking-wider uppercase text-zinc-400 font-mono">
              WEEKLY TRAINING TIME
            </div>
            <div className="text-2xl font-black text-white font-mono tabular-nums flex items-baseline gap-1.5">
              <span>{loggedWorkoutsData.summary.weeklyMinutes}</span>
              <span className="text-xs text-neutral-500 font-normal">minutes</span>
            </div>
            <div className="text-[10px] text-neutral-500 font-mono tabular-nums">
              {loggedWorkoutsData.summary.totalMinutes} total minutes recorded
            </div>
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3.5 space-y-1 shadow-sm">
            <div className="text-[10px] font-semibold tracking-wider uppercase text-zinc-400 font-mono">
              ENERGY EXPENDED
            </div>
            <div className="text-2xl font-black text-white font-mono tabular-nums flex items-baseline gap-1.5">
              <span>{loggedWorkoutsData.summary.weeklyCalories}</span>
              <span className="text-xs text-neutral-500 font-normal">kcal</span>
            </div>
            <div className="text-[10px] text-neutral-400 font-mono">
              Resistance expenditure calculated
            </div>
          </div>
        </div>

        {/* Logged Workouts Feed */}
        <div className="space-y-2.5">
          <div className="text-xs font-semibold tracking-wider uppercase text-zinc-400 font-mono">
            RECENT TRAINING SESSIONS
          </div>
          {loggedWorkoutsData.workouts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-neutral-800 bg-neutral-950 p-8 text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-800 border border-neutral-700 text-neutral-300">
                <Dumbbell className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">No workouts recorded yet</h4>
                <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                  Track your first training session to unlock weekly volume monitoring and adherence metrics.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {loggedWorkoutsData.workouts.map((w) => (
                <div
                  key={w.id}
                  className="group rounded-xl border border-neutral-800 bg-neutral-950 p-3.5 space-y-2 hover:border-neutral-700 transition-colors duration-150 ease-out shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        <span>{w.name}</span>
                        {w.caloriesBurned && (
                          <span className="text-[10px] text-neutral-300 font-mono tabular-nums bg-neutral-800 border border-neutral-700 px-1.5 py-0.5 rounded">
                            {w.caloriesBurned} kcal
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-neutral-500 font-mono tabular-nums mt-0.5 flex items-center gap-2">
                        <span>{new Date(w.loggedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
                        {w.durationMinutes && (
                          <>
                            <span>•</span>
                            <span className="text-neutral-300">{w.durationMinutes} mins</span>
                          </>
                        )}
                      </div>
                    </div>
                    {authUser && (
                      <button
                        type="button"
                        onClick={() => handleDeleteWorkout(w.id)}
                        className="rounded-lg p-1.5 text-neutral-600 hover:text-red-400 hover:bg-neutral-800 transition-colors duration-150 ease-out opacity-80 group-hover:opacity-100"
                        title="Delete workout"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {w.notes && (
                    <div className="rounded-lg bg-neutral-900 border border-neutral-800 p-2.5 text-xs text-neutral-300 font-mono tabular-nums leading-relaxed whitespace-pre-line text-[11px]">
                      {w.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Interactive Workout Tracking Modal */}
      <WorkoutModal
        isOpen={isWorkoutModalOpen}
        onClose={() => setIsWorkoutModalOpen(false)}
        onWorkoutLogged={fetchLoggedWorkouts}
        initialWorkoutName={workoutModalPresetName}
        initialNotes={workoutModalPresetNotes}
        presetSessions={currentSplit.days}
        athleteWeightKg={numWeightKg}
        initialMode={workoutModalInitialMode}
      />

      {/* Custom Split Builder Modal */}
      <CustomSplitModal
        isOpen={isCustomSplitModalOpen}
        onClose={() => setIsCustomSplitModalOpen(false)}
        initialSplit={customSplit}
        onSplitSaved={(saved) => {
          setCustomSplit(saved);
          setUserSplitType("CUSTOM");
          setUserSplitDays(saved.daysCount || saved.days.length || 4);
          try {
            const stored = localStorage.getItem("sw_athlete_profile");
            if (stored) {
              const p = JSON.parse(stored);
              p.splitType = "CUSTOM";
              p.splitDays = saved.daysCount || saved.days.length || 4;
              localStorage.setItem("sw_athlete_profile", JSON.stringify(p));
            }
          } catch {}
        }}
      />

      {/* Guest Authentication Intercept Modal */}
      <GuestAuthModal
        isOpen={isGuestAuthModalOpen}
        onClose={() => setIsGuestAuthModalOpen(false)}
        title={guestModalTitle}
        description={guestModalDescription}
        redirectPath="/workouts"
      />
    </div>
  );
}
