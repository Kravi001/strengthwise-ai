"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Card,
  Title,
  Text,
} from "@/components/tremor";
import {
  ArrowRight,
  Dumbbell,
  Lock,
  Plus,
  Shuffle,
  Trash2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { WorkoutModal } from "@/components/workout-modal";
import { CustomSplitModal } from "@/components/custom-split-modal";
import {
  CustomSplit,
  DEFAULT_CUSTOM_SPLIT,
  loadCustomSplit,
} from "@/lib/custom-split";
import type { User } from "@supabase/supabase-js";

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
    document.title = "Workouts & Periodization — StrengthWise AI";
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
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-10 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="border-b border-neutral-800/80 pb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-400">
            <Dumbbell className="h-3.5 w-3.5" />
            <span>Resistance Training &amp; Periodization</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Adaptive Workouts &amp; Progressive Overload
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400">
            Systematic volume autoregulation based on RPE (Rating of Perceived Exertion) and RIR (Reps in Reserve).
          </p>
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
              <h3 className="text-sm font-bold text-white">Default Training Split Loaded</h3>
              <p className="text-xs text-neutral-300 mt-0.5">
                Complete your athlete profile to automatically calibrate training splits to your exact schedule and equipment availability.
              </p>
            </div>
          </div>
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-neutral-950 hover:bg-amber-400 transition shrink-0"
          >
            <span>Configure Training Settings</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}



      {/* Logged Workouts & Activity Telemetry Card */}
      <Card className="bg-neutral-900/70 border-neutral-800 p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800/80 pb-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs uppercase font-mono tracking-wider text-cyan-400 font-bold mb-1">
              <Dumbbell className="h-3.5 w-3.5" />
              <span>Training Telemetry &amp; Log</span>
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              Logged Workouts
            </h3>
            <p className="text-xs text-neutral-400 mt-1">
              Real-time volume accumulation, training duration, and caloric output logged to your account.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => {
                setWorkoutModalPresetName(currentSplit.days[0]?.name || "Workout Session");
                setWorkoutModalPresetNotes(currentSplit.days[0]?.lifts || "");
                setWorkoutModalInitialMode("routine");
                setIsWorkoutModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 text-xs font-bold text-neutral-950 hover:bg-cyan-400 transition shadow-lg shadow-cyan-500/20"
            >
              <Plus className="h-3.5 w-3.5 stroke-[3]" />
              <span>Track Routine</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setWorkoutModalInitialMode("random");
                setIsWorkoutModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-700 bg-neutral-900/90 px-3 py-2 text-xs font-bold text-neutral-200 hover:text-white hover:border-cyan-500/50 hover:bg-neutral-800 transition shadow-sm"
            >
              <Shuffle className="h-3.5 w-3.5 text-cyan-400" />
              <span>Random / Freeform</span>
            </button>
          </div>
        </div>

        {/* Telemetry Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-4 space-y-1">
            <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
              Sessions This Week
            </div>
            <div className="text-2xl font-black text-white font-mono flex items-baseline gap-1.5">
              <span>{loggedWorkoutsData.summary.thisWeekCount}</span>
              <span className="text-xs text-neutral-500 font-normal">/ {userSplitDays} target</span>
            </div>
            <div className="text-[10px] text-cyan-400 font-mono">
              {loggedWorkoutsData.summary.thisWeekCount >= userSplitDays
                ? "Weekly Target Reached! 🔥"
                : `${Math.max(0, userSplitDays - loggedWorkoutsData.summary.thisWeekCount)} sessions remaining`}
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-4 space-y-1">
            <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
              Weekly Training Time
            </div>
            <div className="text-2xl font-black text-white font-mono flex items-baseline gap-1.5">
              <span>{loggedWorkoutsData.summary.weeklyMinutes}</span>
              <span className="text-xs text-neutral-500 font-normal">minutes</span>
            </div>
            <div className="text-[10px] text-neutral-500 font-mono">
              {loggedWorkoutsData.summary.totalMinutes} total minutes recorded
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-4 space-y-1">
            <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
              Energy Expended
            </div>
            <div className="text-2xl font-black text-white font-mono flex items-baseline gap-1.5">
              <span>{loggedWorkoutsData.summary.weeklyCalories}</span>
              <span className="text-xs text-neutral-500 font-normal">kcal</span>
            </div>
            <div className="text-[10px] text-amber-400 font-mono">
              Resistance expenditure calculated
            </div>
          </div>
        </div>

        {/* Logged Workouts Feed */}
        <div className="space-y-2.5">
          <div className="text-xs font-bold text-neutral-300 uppercase tracking-wider font-mono">
            Recent Training Sessions
          </div>
          {loggedWorkoutsData.workouts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-neutral-800 bg-neutral-950/40 p-8 text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <Dumbbell className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">No workouts recorded yet</h4>
                <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                  Track your first training session to unlock weekly volume monitoring and adherence metrics.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setWorkoutModalPresetName(currentSplit.days[0]?.name || "Workout Session");
                    setWorkoutModalPresetNotes(currentSplit.days[0]?.lifts || "");
                    setWorkoutModalInitialMode("routine");
                    setIsWorkoutModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 px-4 py-2 text-xs font-bold text-cyan-300 hover:bg-cyan-500/25 transition"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Track Split Session</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setWorkoutModalInitialMode("random");
                    setIsWorkoutModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-neutral-800/80 border border-neutral-700 px-4 py-2 text-xs font-bold text-neutral-300 hover:text-white hover:border-neutral-600 transition"
                >
                  <Shuffle className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Roll Random Workout</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {loggedWorkoutsData.workouts.map((w) => (
                <div
                  key={w.id}
                  className="group rounded-2xl border border-neutral-800 bg-neutral-950/80 p-4 space-y-2.5 hover:border-neutral-700 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        <span>{w.name}</span>
                        {w.caloriesBurned && (
                          <span className="text-[10px] text-amber-400 font-mono bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                            {w.caloriesBurned} kcal
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-neutral-500 font-mono mt-0.5 flex items-center gap-2">
                        <span>{new Date(w.loggedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
                        {w.durationMinutes && (
                          <>
                            <span>•</span>
                            <span className="text-cyan-400">{w.durationMinutes} mins</span>
                          </>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteWorkout(w.id)}
                      className="rounded-lg p-1.5 text-neutral-600 hover:text-red-400 hover:bg-neutral-800/80 transition opacity-80 group-hover:opacity-100"
                      title="Delete workout"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {w.notes && (
                    <div className="rounded-xl bg-neutral-900/90 border border-neutral-800/80 p-2.5 text-xs text-neutral-300 font-mono leading-relaxed whitespace-pre-line text-[11px]">
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
    </div>
  );
}
