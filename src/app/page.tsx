"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Card,
  Text,
  Title,
  DonutChart,
} from "@/components/tremor";
import {
  Activity,
  ArrowRight,
  BrainCircuit,
  ChevronRight,
  Dumbbell,
  LineChart,
  Lock,
  ShieldCheck,
  Sparkles,
  User as UserIcon,
  Utensils,
  Zap,
} from "lucide-react";

export default function AboutPage() {
  // Interactive live demo widget state
  const [demoGoal, setDemoGoal] = useState<"CUT" | "MAINTAIN" | "BULK">("BULK");
  const [demoWeightLbs, setDemoWeightLbs] = useState<number>(175);

  // Quick live math for the demo widget
  const demoWeightKg = demoWeightLbs / 2.20462;
  const baseTdee = Math.round(10 * demoWeightKg + 6.25 * 178 - 5 * 26 + 5) * 1.55; // Moderate male baseline
  const demoCalories =
    demoGoal === "CUT"
      ? Math.round(baseTdee * 0.8)
      : demoGoal === "BULK"
      ? Math.round(baseTdee * 1.1)
      : Math.round(baseTdee);

  const demoProtein = Math.round(demoWeightKg * 2.2);
  const demoFat = Math.round((demoCalories * 0.25) / 9);
  const demoCarbs = Math.max(0, Math.round((demoCalories - demoProtein * 4 - demoFat * 9) / 4));

  const demoChartData = [
    { name: "Protein", value: demoProtein, color: "#10b981" },
    { name: "Carbs", value: demoCarbs, color: "#06b6d4" },
    { name: "Fats", value: demoFat, color: "#f59e0b" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-16">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden rounded-3xl border border-neutral-800/80 bg-gradient-to-b from-neutral-900/90 via-neutral-950 to-neutral-950 p-6 sm:p-12 text-center shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.12),transparent_60%)] pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-400 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Sports Science Meets Artificial Intelligence</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Intelligent Strength &amp; Nutrition Coaching,{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Engineered for Results.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-neutral-300 leading-relaxed">
            StrengthWise AI eliminates the guesswork from your training. We combine clinical
            sports science formulas (Mifflin-St Jeor metabolic equations, adaptive volume
            autoregulation) with responsive AI guidance to deliver personalized macros, progressive
            overload programming, and 24/7 coaching in your pocket.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/profile"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-neutral-950 shadow-lg shadow-emerald-500/25 hover:bg-emerald-400 hover:scale-[1.02] transition active:scale-[0.98]"
            >
              <UserIcon className="h-4 w-4" />
              <span>Go to Profile Setup</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-700 bg-neutral-900/90 px-6 py-3 text-sm font-semibold text-neutral-200 hover:bg-neutral-800 hover:text-white transition"
            >
              <Lock className="h-4 w-4 text-neutral-400" />
              <span>Sign In / Create Account</span>
            </Link>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-6 border-t border-neutral-800/80 text-neutral-400 text-xs font-medium">
            <div className="flex items-center justify-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Mifflin-St Jeor Math</span>
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <Zap className="h-4 w-4 text-cyan-400" />
              <span>Adaptive Volume</span>
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <LineChart className="h-4 w-4 text-amber-400" />
              <span>Tremor Telemetry</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. What We Do — 4 Core Pillars */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="text-xs uppercase tracking-wider text-emerald-400 font-bold">
            What We Do
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Four Pillars of StrengthWise AI
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400">
            Every feature is rooted in exercise physiology and metabolic science, wrapped in a
            minimalist, data-dense interface.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Sports Nutrition */}
          <Card decoration="left" decorationColor="emerald" className="bg-neutral-900/60 border-neutral-800">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Utensils className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <Title className="text-white text-base sm:text-lg">
                  1. Clinical Metabolic Architecture
                </Title>
                <Text className="text-neutral-300 text-xs sm:text-sm leading-relaxed">
                  No generic 2,000-calorie guesses. We compute your exact Basal Metabolic Rate (BMR)
                  and Total Daily Energy Expenditure (TDEE) using the clinical Mifflin-St Jeor
                  equation, adjusting precisely for your age, biological sex, height, weight, and
                  activity multiplier.
                </Text>
                <div className="pt-2 flex flex-wrap gap-2 text-[11px] text-neutral-400 font-mono">
                  <span className="rounded-md bg-neutral-800 px-2 py-0.5 border border-neutral-700">
                    BMR = 10W + 6.25H - 5A + S
                  </span>
                  <span className="rounded-md bg-neutral-800 px-2 py-0.5 border border-neutral-700">
                    2.2g Protein / kg
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Card 2: Adaptive Strength Programming */}
          <Card decoration="left" decorationColor="cyan" className="bg-neutral-900/60 border-neutral-800">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <Dumbbell className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <Title className="text-white text-base sm:text-lg">
                  2. Progressive Overload &amp; Volume
                </Title>
                <Text className="text-neutral-300 text-xs sm:text-sm leading-relaxed">
                  Hypertrophy requires systematically increasing training stimulus over time.
                  StrengthWise prescribes scientifically sound splits (Push/Pull/Legs, Upper/Lower)
                  with RPE targets (Rating of Perceived Exertion) to prevent overtraining while
                  forcing progressive overload.
                </Text>
                <div className="pt-2 flex flex-wrap gap-2 text-[11px] text-neutral-400 font-mono">
                  <span className="rounded-md bg-neutral-800 px-2 py-0.5 border border-neutral-700">
                    RPE 8-9 Intensity
                  </span>
                  <span className="rounded-md bg-neutral-800 px-2 py-0.5 border border-neutral-700">
                    Volume Autoregulation
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Card 3: Tremor Telemetry Dashboard */}
          <Card decoration="left" decorationColor="amber" className="bg-neutral-900/60 border-neutral-800">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Activity className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <Title className="text-white text-base sm:text-lg">
                  3. Zero-Fluff Tremor UI Telemetry
                </Title>
                <Text className="text-neutral-300 text-xs sm:text-sm leading-relaxed">
                  Designed for speed in the gym. High-contrast dark cards, real-time macro donut
                  charts, calorie deficit/surplus delta gauges, and progressive goal trackers
                  provide instant clarity without bloated animations or distractions.
                </Text>
                <div className="pt-2 flex flex-wrap gap-2 text-[11px] text-neutral-400 font-mono">
                  <span className="rounded-md bg-neutral-800 px-2 py-0.5 border border-neutral-700">
                    High Contrast Dark Mode
                  </span>
                  <span className="rounded-md bg-neutral-800 px-2 py-0.5 border border-neutral-700">
                    Real-Time Calculations
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Card 4: AI Strength Coach */}
          <Card decoration="left" decorationColor="emerald" className="bg-neutral-900/60 border-neutral-800">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <BrainCircuit className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <Title className="text-white text-base sm:text-lg">
                  4. 24/7 AI Strength Specialist
                </Title>
                <Text className="text-neutral-300 text-xs sm:text-sm leading-relaxed">
                  Stuck with shoulder pain on bench press? Need an exercise substitute for an
                  occupied squat rack? Your dedicated AI Coach analyzes your current profile and
                  delivers immediate biomechanical cues, fatigue deload strategies, and meal timing
                  advice.
                </Text>
                <div className="pt-2 flex flex-wrap gap-2 text-[11px] text-neutral-400 font-mono">
                  <span className="rounded-md bg-neutral-800 px-2 py-0.5 border border-neutral-700">
                    Context-Aware Answers
                  </span>
                  <span className="rounded-md bg-neutral-800 px-2 py-0.5 border border-neutral-700">
                    Biomechanical Adaptations
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* 3. Interactive Science Demo Widget */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <div className="text-xs uppercase tracking-wider text-cyan-400 font-bold">
            Live Preview
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            See the Science in Action
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400">
            Toggle goals below to see how our sports science formulas instantly calculate calories
            and macros for an athlete.
          </p>
        </div>

        <Card className="bg-neutral-900/80 border-neutral-800 p-6 sm:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Controls */}
            <div className="lg:col-span-6 space-y-6">
              <div>
                <Title className="text-white text-base">Select Athlete Phase:</Title>
                <Text className="text-neutral-400 text-xs mb-3">
                  Caloric intake adapts dynamically depending on muscle building or fat reduction:
                </Text>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setDemoGoal("CUT")}
                    className={`rounded-xl py-2.5 px-3 text-xs font-bold transition border ${
                      demoGoal === "CUT"
                        ? "bg-amber-500/20 border-amber-500 text-amber-400 shadow-sm"
                        : "bg-neutral-800/60 border-neutral-700 text-neutral-400 hover:text-white"
                    }`}
                  >
                    Fat Loss (-20%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDemoGoal("MAINTAIN")}
                    className={`rounded-xl py-2.5 px-3 text-xs font-bold transition border ${
                      demoGoal === "MAINTAIN"
                        ? "bg-cyan-500/20 border-cyan-500 text-cyan-400 shadow-sm"
                        : "bg-neutral-800/60 border-neutral-700 text-neutral-400 hover:text-white"
                    }`}
                  >
                    Maintenance
                  </button>
                  <button
                    type="button"
                    onClick={() => setDemoGoal("BULK")}
                    className={`rounded-xl py-2.5 px-3 text-xs font-bold transition border ${
                      demoGoal === "BULK"
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-sm"
                        : "bg-neutral-800/60 border-neutral-700 text-neutral-400 hover:text-white"
                    }`}
                  >
                    Muscle Surplus (+10%)
                  </button>
                </div>
              </div>

              {/* Weight Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-300 font-medium">Sample Bodyweight:</span>
                  <span className="text-emerald-400 font-bold font-mono">{demoWeightLbs} lbs ({Math.round(demoWeightKg)} kg)</span>
                </div>
                <input
                  type="range"
                  min={120}
                  max={260}
                  step={5}
                  value={demoWeightLbs}
                  onChange={(e) => setDemoWeightLbs(Number(e.target.value))}
                  className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              {/* Summary Breakdown */}
              <div className="rounded-xl bg-neutral-950 p-4 border border-neutral-800 space-y-2 text-xs">
                <div className="flex justify-between text-neutral-400">
                  <span>Computed Basal Metabolic Rate (BMR):</span>
                  <span className="text-neutral-200 font-mono">{Math.round(baseTdee / 1.55)} kcal</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Active Expenditure (TDEE × 1.55):</span>
                  <span className="text-neutral-200 font-mono">{baseTdee} kcal</span>
                </div>
                <div className="flex justify-between font-bold border-t border-neutral-800/80 pt-2 text-white">
                  <span>Target Daily Intake:</span>
                  <span className="text-emerald-400 font-mono text-sm">{demoCalories} kcal / day</span>
                </div>
              </div>

              <div>
                <Link
                  href="/profile"
                  className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition"
                >
                  <span>Ready to calculate your own metrics? Set up your profile</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Live Chart Visual */}
            <div className="lg:col-span-6 flex flex-col items-center justify-center p-6 rounded-2xl bg-neutral-950/70 border border-neutral-800/80 space-y-4">
              <div className="text-center">
                <Text className="text-neutral-400 text-xs uppercase tracking-wider font-semibold">
                  Prescribed Daily Fuel
                </Text>
                <div className="text-3xl font-extrabold text-white font-mono mt-1">
                  {demoCalories} <span className="text-xs text-neutral-500 font-sans">KCAL</span>
                </div>
              </div>

              <DonutChart
                data={demoChartData}
                label="Target Grams"
                valueFormatter={(v) => `${v}g`}
                className="h-44 w-44"
              />

              {/* Macros grid */}
              <div className="grid grid-cols-3 gap-3 w-full text-center">
                <div className="rounded-xl bg-neutral-900 p-2.5 border border-emerald-500/20">
                  <div className="text-[10px] uppercase font-bold text-emerald-400">Protein</div>
                  <div className="text-base font-extrabold text-white font-mono">{demoProtein}g</div>
                  <div className="text-[10px] text-neutral-400">2.2g / kg</div>
                </div>
                <div className="rounded-xl bg-neutral-900 p-2.5 border border-cyan-500/20">
                  <div className="text-[10px] uppercase font-bold text-cyan-400">Carbs</div>
                  <div className="text-base font-extrabold text-white font-mono">{demoCarbs}g</div>
                  <div className="text-[10px] text-neutral-400">Glycogen fuel</div>
                </div>
                <div className="rounded-xl bg-neutral-900 p-2.5 border border-amber-500/20">
                  <div className="text-[10px] uppercase font-bold text-amber-400">Fats</div>
                  <div className="text-base font-extrabold text-white font-mono">{demoFat}g</div>
                  <div className="text-[10px] text-neutral-400">Hormone health</div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* 4. How It Works (3 Simple Steps) */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <div className="text-xs uppercase tracking-wider text-emerald-400 font-bold">
            Workflow
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            How StrengthWise Works
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400">
            From initial onboarding to daily execution in three streamlined steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 space-y-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 font-mono font-bold text-sm border border-emerald-500/20">
              01
            </div>
            <h3 className="text-base font-bold text-white">Create Your Profile</h3>
            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
              Navigate to the <span className="text-emerald-400 font-semibold">Profile</span> tab.
              Input your age, gender, height (ft/in or cm), weight (lbs or kg), and training goals.
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 space-y-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 font-mono font-bold text-sm border border-cyan-500/20">
              02
            </div>
            <h3 className="text-base font-bold text-white">Unlock Live Targets</h3>
            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
              Save your profile to PostgreSQL via Supabase. Once saved, your personalized Athlete
              Command Center activates with custom nutritional targets and tracking.
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 space-y-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 font-mono font-bold text-sm border border-amber-500/20">
              03
            </div>
            <h3 className="text-base font-bold text-white">Train with AI Guidance</h3>
            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
              Consult your AI Coach on form, recovery status, and exercise progressions tailored
              to your specific experience level and goals.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Bottom Call to Action */}
      <section className="rounded-3xl border border-emerald-500/20 bg-gradient-to-r from-emerald-950/40 via-neutral-950 to-neutral-900 p-8 sm:p-12 text-center space-y-6">
        <div className="max-w-2xl mx-auto space-y-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Ready to Build Your Science-Backed Program?
          </h2>
          <p className="text-xs sm:text-sm text-neutral-300">
            Set up your athlete profile now in under 60 seconds. No fluff, no generic workout cards
            before you configure your goals.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/profile"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-7 py-3 text-sm font-bold text-neutral-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition"
          >
            <UserIcon className="h-4 w-4" />
            <span>Open Profile Tab</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-700 bg-neutral-900 px-6 py-3 text-sm font-semibold text-neutral-300 hover:text-white hover:bg-neutral-800 transition"
          >
            <span>Sign In with Google</span>
          </Link>
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
