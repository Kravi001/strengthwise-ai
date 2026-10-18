"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BrainCircuit,
  ChevronRight,
  Dumbbell,
  TrendingUp,
  Utensils,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { calculateNutritionTargets } from "@/lib/calc";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";

export default function LandingPage() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);

  // Interactive Preview State
  const [activePreviewTab, setActivePreviewTab] = useState<"workouts" | "nutrition" | "progress" | "coach">("workouts");
  const [previewGoal, setPreviewGoal] = useState<"CUT" | "MAINTAIN" | "BULK">("BULK");

  // Auth sync
  useEffect(() => {
    async function checkSession() {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();
        setUser(currentUser);
      } catch {
        setUser(null);
      }
    }
    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Dynamic preview nutrition calculation based on goal toggle
  const previewNutrition = useMemo(() => {
    return calculateNutritionTargets({
      age: 26,
      gender: "MALE",
      heightCm: 183,
      weightKg: 84, // ~185 lbs
      activityLevel: "MODERATE",
      goal: previewGoal === "CUT" ? "LOSE_WEIGHT" : previewGoal === "BULK" ? "BUILD_MUSCLE" : "MAINTAIN",
    });
  }, [previewGoal]);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* ========================================================================= */}
      {/* 1. HERO SECTION                                                           */}
      {/* ========================================================================= */}
      <section className="relative border-b border-neutral-800/80 px-4 pt-16 pb-20 sm:px-6 lg:px-8 lg:pt-24 lg:pb-28">
        <div className="mx-auto max-w-5xl text-center space-y-8">
          {/* Eyebrow Label */}
          <div className="flex items-center justify-center">
            <span className="text-xs font-mono font-medium tracking-widest text-emerald-400 uppercase">
              Strength &amp; Nutrition Intelligence
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-[1.12]">
            The intelligent strength and nutrition system built to adapt to you.
          </h1>

          {/* Subheading */}
          <p className="text-base sm:text-xl text-neutral-400 max-w-2xl mx-auto leading-relaxed">
            StrengthWise connects your workouts, daily nutrition targets, and progressive overload into one unified platform. No disconnected spreadsheets, separate calorie trackers, or generic advice.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {user ? (
              <>
                <Link
                  href="/workouts"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold px-6 py-3 text-sm transition-colors duration-150 ease-out shadow-sm"
                >
                  <Dumbbell className="h-4 w-4" />
                  <span>Open Workouts</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/meals"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 px-6 py-3 text-sm font-semibold text-white transition-colors duration-150 ease-out"
                >
                  <Utensils className="h-4 w-4 text-emerald-400" />
                  <span>View Nutrition</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/profile"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold px-6 py-3 text-sm transition-colors duration-150 ease-out shadow-sm"
                >
                  <span>Get Started</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="#how-it-works"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 px-6 py-3 text-sm font-semibold text-neutral-300 hover:text-white transition-colors duration-150 ease-out"
                >
                  <span>How It Works</span>
                  <ChevronRight className="h-4 w-4 text-neutral-500" />
                </Link>
              </>
            )}
          </div>

          {/* Quick Metrics Strip */}
          <div className="pt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto border-t border-neutral-900 mt-12 text-left">
            <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 shadow-sm">
              <div className="text-xs font-mono text-neutral-400 uppercase">Training Splits</div>
              <div className="text-sm font-bold text-white mt-1">PPL, Upper/Lower, Custom</div>
            </div>
            <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 shadow-sm">
              <div className="text-xs font-mono text-neutral-400 uppercase">Metabolic Targets</div>
              <div className="text-sm font-bold text-white mt-1">Calibrated to your phase</div>
            </div>
            <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 shadow-sm">
              <div className="text-xs font-mono text-neutral-400 uppercase">Intake Logging</div>
              <div className="text-sm font-bold text-white mt-1">Barcode &amp; Nutrition OCR</div>
            </div>
            <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 shadow-sm">
              <div className="text-xs font-mono text-neutral-400 uppercase">AI Coaching</div>
              <div className="text-sm font-bold text-white mt-1">Direct context on your data</div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. THE FRAGMENTATION PROBLEM VS STRENGTHWISE SOLUTION                      */}
      {/* ========================================================================= */}
      <section id="how-it-works" className="border-b border-neutral-800 py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Why strength athletes need a unified system
            </h2>
            <p className="text-sm sm:text-base text-neutral-400">
              Progressive overload requires coordination between lifting volume and energy availability. When your tools are disconnected, progress stalls.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* The Disconnected Approach */}
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 sm:p-8 space-y-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-400 flex items-center justify-center font-bold text-sm">
                  ✕
                </div>
                <h3 className="text-base font-bold text-white">The Disconnected Approach</h3>
              </div>
              <ul className="space-y-3.5 text-xs sm:text-sm text-neutral-400">
                <li className="flex items-start gap-2.5">
                  <span className="text-neutral-500 font-bold mt-0.5">•</span>
                  <span><strong>Scattered logs:</strong> Lifts written in a phone notes app while calories are tracked in a separate counter.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-neutral-500 font-bold mt-0.5">•</span>
                  <span><strong>Blind targets:</strong> Nutrition calculators that do not adapt when your weekly training volume increases.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-neutral-500 font-bold mt-0.5">•</span>
                  <span><strong>Isolated questions:</strong> Asking general chatbots for advice without the model knowing your current weight, split, or past injuries.</span>
                </li>
              </ul>
            </div>

            {/* The StrengthWise Approach */}
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 sm:p-8 space-y-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-sm">
                  ✓
                </div>
                <h3 className="text-base font-bold text-white">The StrengthWise System</h3>
              </div>
              <ul className="space-y-3.5 text-xs sm:text-sm text-neutral-300">
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-bold mt-0.5">•</span>
                  <span><strong>Connected architecture:</strong> Your workouts, target calories, and body composition sync together in one profile.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-bold mt-0.5">•</span>
                  <span><strong>Objective progressive overload:</strong> Structured workout splits with target sets, rep ranges, and auto-calculated volume.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-bold mt-0.5">•</span>
                  <span><strong>Context-rich AI coaching:</strong> The AI coach analyzes your logged meals, current split, and body metrics before prescribing answers.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. FOUR CORE MODULES EXPLAINED                                            */}
      {/* ========================================================================= */}
      <section className="border-b border-neutral-800 py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Built on four core pillars
            </h2>
            <p className="text-sm sm:text-base text-neutral-400">
              Everything you need to plan, fuel, analyze, and optimize your strength training.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Workouts */}
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 sm:p-6 space-y-4 flex flex-col justify-between shadow-sm">
              <div className="space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-800 text-neutral-200 border border-neutral-700">
                  <Dumbbell className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-white">Adaptive Workouts &amp; Periodization</h3>
                <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                  Choose from tested periodization templates like 4-Day Upper/Lower, 6-Day Push/Pull/Legs, and 3-Day Full Body, or construct your own custom split. Track weight, sets, reps, and RPE to guarantee progressive overload week over week.
                </p>
              </div>
              <div className="pt-4 border-t border-neutral-800 flex items-center justify-between">
                <span className="text-xs text-neutral-400 font-mono uppercase tracking-wider text-[11px] font-semibold">Custom Split Engine</span>
                <Link
                  href="/workouts"
                  className="text-xs font-semibold text-neutral-200 hover:text-white inline-flex items-center gap-1 transition-colors duration-150 ease-out"
                >
                  <span>Explore Workouts</span>
                  <ArrowRight className="h-3.5 w-3.5 text-emerald-400" />
                </Link>
              </div>
            </div>

            {/* 2. Nutrition */}
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 sm:p-6 space-y-4 flex flex-col justify-between shadow-sm">
              <div className="space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-800 text-neutral-200 border border-neutral-700">
                  <Utensils className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-white">Precision Nutrition &amp; Macro Distribution</h3>
                <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                  Calibrate your daily calories, protein, carbohydrates, and fats to match your body metrics and training phase. Log foods quickly via barcode scanning, camera Nutrition Facts OCR, or the verified database.
                </p>
              </div>
              <div className="pt-4 border-t border-neutral-800 flex items-center justify-between">
                <span className="text-xs text-neutral-400 font-mono uppercase tracking-wider text-[11px] font-semibold">OCR &amp; Barcode Scanner</span>
                <Link
                  href="/meals"
                  className="text-xs font-semibold text-neutral-200 hover:text-white inline-flex items-center gap-1 transition-colors duration-150 ease-out"
                >
                  <span>Explore Nutrition</span>
                  <ArrowRight className="h-3.5 w-3.5 text-emerald-400" />
                </Link>
              </div>
            </div>

            {/* 3. Progress */}
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 sm:p-6 space-y-4 flex flex-col justify-between shadow-sm">
              <div className="space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-800 text-neutral-200 border border-neutral-700">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-white">Strength Telemetry &amp; Progression Curves</h3>
                <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                  Monitor estimated 1-Rep Max curves, total weekly volume load, and bodyweight trends. See exactly which lifts are accelerating and identify plateaus before they stall your training cycle.
                </p>
              </div>
              <div className="pt-4 border-t border-neutral-800 flex items-center justify-between">
                <span className="text-xs text-neutral-400 font-mono uppercase tracking-wider text-[11px] font-semibold">1RM Curves &amp; Volume</span>
                <Link
                  href="/progress"
                  className="text-xs font-semibold text-neutral-200 hover:text-white inline-flex items-center gap-1 transition-colors duration-150 ease-out"
                >
                  <span>Explore Progress</span>
                  <ArrowRight className="h-3.5 w-3.5 text-emerald-400" />
                </Link>
              </div>
            </div>

            {/* 4. AI Coach */}
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 sm:p-6 space-y-4 flex flex-col justify-between shadow-sm">
              <div className="space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-800 text-neutral-200 border border-neutral-700">
                  <BrainCircuit className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-white">Context-Aware Strength Coach</h3>
                <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                  A 24/7 coaching assistant with access to your active split, bodyweight, and logged meals. Ask for exercise substitutions, deload advice, or macro adjustments without having to explain your training history from scratch.
                </p>
              </div>
              <div className="pt-4 border-t border-neutral-800 flex items-center justify-between">
                <span className="text-xs text-neutral-400 font-mono uppercase tracking-wider text-[11px] font-semibold">Athlete Assistance</span>
                <Link
                  href="/coach"
                  className="text-xs font-semibold text-neutral-200 hover:text-white inline-flex items-center gap-1 transition-colors duration-150 ease-out"
                >
                  <span>Consult Coach</span>
                  <ArrowRight className="h-3.5 w-3.5 text-emerald-400" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. INTERACTIVE LIVE PRODUCT PREVIEW                                       */}
      {/* ========================================================================= */}
      <section className="border-b border-neutral-800/80 py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-neutral-950">
        <div className="mx-auto max-w-5xl space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              See the system in action
            </h2>
            <p className="text-sm sm:text-base text-neutral-400">
              Explore how each component of StrengthWise operates in your daily routine.
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center justify-center">
            <div className="inline-flex rounded-xl bg-neutral-900 border border-neutral-800 p-1 gap-1">
              <button
                type="button"
                onClick={() => setActivePreviewTab("workouts")}
                className={`flex items-center gap-2 rounded-lg px-3 sm:px-4 py-2 text-xs font-semibold transition-colors duration-150 ease-out ${
                  activePreviewTab === "workouts"
                    ? "bg-neutral-800 text-white shadow-sm"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                <Dumbbell className={`h-3.5 w-3.5 ${activePreviewTab === "workouts" ? "text-emerald-400" : "text-neutral-400"}`} />
                <span>Workouts</span>
              </button>
              <button
                type="button"
                onClick={() => setActivePreviewTab("nutrition")}
                className={`flex items-center gap-2 rounded-lg px-3 sm:px-4 py-2 text-xs font-semibold transition-colors duration-150 ease-out ${
                  activePreviewTab === "nutrition"
                    ? "bg-neutral-800 text-white shadow-sm"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                <Utensils className={`h-3.5 w-3.5 ${activePreviewTab === "nutrition" ? "text-emerald-400" : "text-neutral-400"}`} />
                <span>Nutrition</span>
              </button>
              <button
                type="button"
                onClick={() => setActivePreviewTab("progress")}
                className={`flex items-center gap-2 rounded-lg px-3 sm:px-4 py-2 text-xs font-semibold transition-colors duration-150 ease-out ${
                  activePreviewTab === "progress"
                    ? "bg-neutral-800 text-white shadow-sm"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                <TrendingUp className={`h-3.5 w-3.5 ${activePreviewTab === "progress" ? "text-emerald-400" : "text-neutral-400"}`} />
                <span>Progress</span>
              </button>
              <button
                type="button"
                onClick={() => setActivePreviewTab("coach")}
                className={`flex items-center gap-2 rounded-lg px-3 sm:px-4 py-2 text-xs font-semibold transition-colors duration-150 ease-out ${
                  activePreviewTab === "coach"
                    ? "bg-neutral-800 text-white shadow-sm"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                <BrainCircuit className={`h-3.5 w-3.5 ${activePreviewTab === "coach" ? "text-emerald-400" : "text-neutral-400"}`} />
                <span>AI Coach</span>
              </button>
            </div>
          </div>

          {/* Tab Content Display */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 sm:p-8 max-w-4xl mx-auto shadow-md">
            {activePreviewTab === "workouts" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-4">
                  <div>
                    <h4 className="text-base font-bold text-white">Upper Body Strength (Session A)</h4>
                    <p className="text-xs text-neutral-400">4-Day Upper / Lower Periodization Split</p>
                  </div>
                  <span className="text-xs font-mono text-neutral-300 bg-neutral-800 border border-neutral-700 px-2.5 py-1 rounded-md self-start sm:self-auto">
                    Target Volume: 14 Working Sets
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="rounded-xl border border-neutral-800/80 bg-neutral-950 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold text-white">Flat Barbell Bench Press</div>
                      <div className="text-xs text-neutral-400 mt-0.5">Primary horizontal press • Rest 2-3 min</div>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-mono">
                      <span className="text-neutral-400">4 sets × 5 reps</span>
                      <span className="text-emerald-400 font-bold">225 lbs</span>
                      <span className="text-neutral-500">RPE 8.5</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-neutral-800/80 bg-neutral-950 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold text-white">Weighted Chin-ups</div>
                      <div className="text-xs text-neutral-400 mt-0.5">Vertical pull • Rest 2 min</div>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-mono">
                      <span className="text-neutral-400">4 sets × 6 reps</span>
                      <span className="text-emerald-400 font-bold">+35 lbs</span>
                      <span className="text-neutral-500">RPE 8.0</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-neutral-800/80 bg-neutral-950 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold text-white">Incline Dumbbell Press</div>
                      <div className="text-xs text-neutral-400 mt-0.5">Upper clavicular hypertrophy • Rest 90s</div>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-mono">
                      <span className="text-neutral-400">3 sets × 10 reps</span>
                      <span className="text-emerald-400 font-bold">80 lbs/hand</span>
                      <span className="text-neutral-500">RPE 8.0</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activePreviewTab === "nutrition" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-4">
                  <div>
                    <h4 className="text-base font-bold text-white">Metabolic Calibration Engine</h4>
                    <p className="text-xs text-neutral-400">Calculated for 185 lbs lifter, 4 training days/week</p>
                  </div>

                  {/* Goal Switcher */}
                  <div className="flex items-center gap-1 rounded-lg bg-neutral-950 p-1 border border-neutral-800">
                    <button
                      type="button"
                      onClick={() => setPreviewGoal("CUT")}
                      className={`px-2.5 py-1 text-xs font-bold rounded transition-colors duration-150 ease-out ${
                        previewGoal === "CUT" ? "bg-emerald-500 text-neutral-950" : "text-neutral-400 hover:text-white"
                      }`}
                    >
                      Cut
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewGoal("MAINTAIN")}
                      className={`px-2.5 py-1 text-xs font-bold rounded transition-colors duration-150 ease-out ${
                        previewGoal === "MAINTAIN" ? "bg-emerald-500 text-neutral-950" : "text-neutral-400 hover:text-white"
                      }`}
                    >
                      Maintain
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewGoal("BULK")}
                      className={`px-2.5 py-1 text-xs font-bold rounded transition-colors duration-150 ease-out ${
                        previewGoal === "BULK" ? "bg-emerald-500 text-neutral-950" : "text-neutral-400 hover:text-white"
                      }`}
                    >
                      Bulk
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 shadow-sm">
                    <div className="text-[11px] font-mono text-neutral-400 uppercase">Target Intake</div>
                    <div className="text-xl sm:text-2xl font-black text-white font-mono mt-1">
                      {previewNutrition.targetCalories} <span className="text-xs text-neutral-500 font-sans">kcal</span>
                    </div>
                  </div>
                  <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 shadow-sm">
                    <div className="text-[11px] font-mono text-neutral-400 uppercase">Protein</div>
                    <div className="text-xl sm:text-2xl font-black text-white font-mono mt-1">
                      {previewNutrition.targetProtein} <span className="text-xs text-neutral-500 font-sans">g</span>
                    </div>
                  </div>
                  <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 shadow-sm">
                    <div className="text-[11px] font-mono text-neutral-400 uppercase">Carbohydrates</div>
                    <div className="text-xl sm:text-2xl font-black text-white font-mono mt-1">
                      {previewNutrition.targetCarbs} <span className="text-xs text-neutral-500 font-sans">g</span>
                    </div>
                  </div>
                  <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 shadow-sm">
                    <div className="text-[11px] font-mono text-neutral-400 uppercase">Fats</div>
                    <div className="text-xl sm:text-2xl font-black text-white font-mono mt-1">
                      {previewNutrition.targetFat} <span className="text-xs text-neutral-500 font-sans">g</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 text-xs text-neutral-400 flex items-center justify-between shadow-sm">
                  <span>Fast meal logging supported via:</span>
                  <div className="flex items-center gap-3 font-mono text-neutral-300">
                    <span>• Barcode Scanner</span>
                    <span>• Camera Label OCR</span>
                    <span>• Verified Search</span>
                  </div>
                </div>
              </div>
            )}

            {activePreviewTab === "progress" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-4">
                  <div>
                    <h4 className="text-base font-bold text-white">Strength Progression Curves</h4>
                    <p className="text-xs text-neutral-400">12-week estimated 1RM trajectory &amp; volume load</p>
                  </div>
                  <span className="text-xs font-mono text-neutral-300 bg-neutral-800 border border-neutral-700 px-2.5 py-1 rounded-md self-start sm:self-auto">
                    Weekly Volume: 38,400 lbs
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 space-y-2">
                    <div className="text-xs text-neutral-400 font-mono">Barbell Bench Press</div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-xl font-bold font-mono text-white">265 lbs</span>
                      <span className="text-xs text-emerald-400 font-mono">+15 lbs / 8 wks</span>
                    </div>
                    <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-400 rounded-full w-[82%]" />
                    </div>
                  </div>

                  <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 space-y-2">
                    <div className="text-xs text-neutral-400 font-mono">Barbell Back Squat</div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-xl font-bold font-mono text-white">355 lbs</span>
                      <span className="text-emerald-400 font-mono text-xs">+25 lbs / 8 wks</span>
                    </div>
                    <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-400 rounded-full w-[88%]" />
                    </div>
                  </div>

                  <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 space-y-2">
                    <div className="text-xs text-neutral-400 font-mono">Conventional Deadlift</div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-xl font-bold font-mono text-white">435 lbs</span>
                      <span className="text-emerald-400 font-mono text-xs">+30 lbs / 8 wks</span>
                    </div>
                    <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-400 rounded-full w-[94%]" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activePreviewTab === "coach" && (
              <div className="space-y-4">
                <div className="border-b border-neutral-800 pb-3 flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-bold text-white">Sample AI Coach Consultation</h4>
                    <p className="text-xs text-neutral-400">Context: 185 lbs athlete • Upper/Lower split • Hypertrophy phase</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* User query */}
                  <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-3.5 max-w-[85%] ml-auto text-xs text-neutral-200">
                    <span className="font-bold text-white block mb-1">You:</span>
                    My left elbow is irritated when doing heavy barbell skull crushers on Upper Day A. What can I substitute that maintains tricep lateral head tension with less joint shearing?
                  </div>

                  {/* Coach response */}
                  <div className="rounded-xl bg-neutral-950 border border-neutral-800 p-3.5 max-w-[90%] mr-auto text-xs text-neutral-300 space-y-2">
                    <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                      <BrainCircuit className="h-3.5 w-3.5" />
                      <span>StrengthWise Coach:</span>
                    </div>
                    <p>
                      Substitute with <strong>Cross-Body Cable Tricep Extensions</strong> or <strong>Dumbbell Tate Presses</strong> with a neutral grip.
                    </p>
                    <p className="text-neutral-400">
                      Cables provide constant tension across the entire excursion curve while eliminating the peak torque spike at 90° elbow flexion that occurs with free barbell skull crushers. Program: 3 sets of 12-15 reps at RPE 8.0.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. THREE-STEP ONBOARDING                                                  */}
      {/* ========================================================================= */}
      <section className="border-b border-neutral-800/80 py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Get started in three steps
            </h2>
            <p className="text-sm sm:text-base text-neutral-400">
              No complex setup. Connect your metrics and begin training.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 space-y-3 shadow-sm">
              <div className="text-xs font-mono font-bold text-emerald-400">STEP 01</div>
              <h3 className="text-base font-bold text-white">Set Your Athlete Profile</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Enter your height, weight, activity frequency, and goal (Cut, Bulk, or Maintain) to calibrate metabolic targets.
              </p>
            </div>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 space-y-3 shadow-sm">
              <div className="text-xs font-mono font-bold text-emerald-400">STEP 02</div>
              <h3 className="text-base font-bold text-white">Choose or Build Your Split</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Select from verified training templates (Upper/Lower, PPL, Full Body) or construct a custom split with your exercises.
              </p>
            </div>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 space-y-3 shadow-sm">
              <div className="text-xs font-mono font-bold text-emerald-400">STEP 03</div>
              <h3 className="text-base font-bold text-white">Train, Log, and Adapt</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Log lifts, scan meals, watch strength progression curves climb, and consult the AI coach whenever adjustments are needed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. CLOSING CTA BANNER                                                     */}
      {/* ========================================================================= */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center rounded-2xl border border-neutral-800 bg-neutral-900 p-8 sm:p-14 space-y-6 shadow-md">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Ready to train with precision?
          </h2>
          <p className="text-sm sm:text-base text-neutral-400 max-w-xl mx-auto">
            Stop guessing your workout volume and daily nutrition. Start tracking with a system built specifically for strength progression.
          </p>
          <div className="pt-2">
            <Link
              href="/workouts"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold px-7 py-3.5 text-sm transition-colors duration-150 ease-out shadow-sm"
            >
              <span>{user ? "Go to Workouts" : "Explore Live Workouts"}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. CLEAN MINIMALIST FOOTER                                                */}
      {/* ========================================================================= */}
      <footer className="border-t border-neutral-800 py-12 px-4 sm:px-6 lg:px-8 text-xs text-neutral-500">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-900 text-emerald-400 border border-neutral-800">
              <Dumbbell className="h-4 w-4" />
            </div>
            <span className="font-bold text-neutral-300">StrengthWise AI</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-neutral-400">
            <Link href="/" className="hover:text-white transition-colors duration-150 ease-out">Home</Link>
            <Link href="/workouts" className="hover:text-white transition-colors duration-150 ease-out">Workouts</Link>
            <Link href="/meals" className="hover:text-white transition-colors duration-150 ease-out">Meals</Link>
            <Link href="/progress" className="hover:text-white transition-colors duration-150 ease-out">Progress</Link>
            <Link href="/coach" className="hover:text-white transition-colors duration-150 ease-out">Coach</Link>
            <Link href="/profile" className="hover:text-white transition-colors duration-150 ease-out">Profile</Link>
          </div>

          <div>
            <span>&copy; {new Date().getFullYear()} StrengthWise. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
