"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Card,
  Text,
  Title,
  DonutChart,
  Divider,
  ProgressBar,
} from "@/components/tremor";
import {
  Activity,
  ArrowRight,
  Bot,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  Code2,
  Database,
  Dumbbell,
  ExternalLink,
  Flame,
  Globe,
  Layers,
  LineChart,
  Lock,
  Mail,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  User as UserIcon,
  Utensils,
  Zap,
} from "lucide-react";

export default function LandingPage() {
  // --- State for Meals Demo Widget ---
  const [demoGoal, setDemoGoal] = useState<"CUT" | "MAINTAIN" | "BULK">("BULK");
  const [demoWeightLbs, setDemoWeightLbs] = useState<number>(175);

  const demoWeightKg = demoWeightLbs / 2.20462;
  const baseTdee = Math.round(10 * demoWeightKg + 6.25 * 178 - 5 * 26 + 5) * 1.55;
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

  // --- State for Workouts Split Selector ---
  const [activeSplit, setActiveSplit] = useState<"ppl" | "upper_lower" | "full_body">("ppl");

  const splitDetails = {
    ppl: {
      name: "Push / Pull / Legs (PPL)",
      frequency: "6 Days / Week",
      description: "Gold standard for hypertrophy. Groups muscles by movement pattern, providing 48-72h recovery per muscle group.",
      days: [
        { name: "Push Day", lifts: "Incline DB Press (4×8 @ RPE 8), Overhead Press (3×10), Cable Lateral Raises (4×15), Tricep Pressdowns (3×12)" },
        { name: "Pull Day", lifts: "Barbell Row (4×6-8 @ RPE 8.5), Neutral Lat Pulldown (3×10), Face Pulls (4×15), Incline Dumbbell Curls (3×12)" },
        { name: "Legs Day", lifts: "Barbell Squat (4×6-8 @ RPE 8), Romanian Deadlift (3×8-10), Bulgarian Split Squat (3×10/leg), Standing Calf Raises (4×15)" },
      ],
      targetSets: 16,
    },
    upper_lower: {
      name: "Upper / Lower Split",
      frequency: "4 Days / Week",
      description: "Ideal balance of high mechanical load, heavy compound progression, and optimal systemic neurological recovery.",
      days: [
        { name: "Upper A (Strength)", lifts: "Flat Barbell Bench (4×5 @ RPE 8.5), Weighted Chin-ups (4×6), Seated Cable Row (3×8), Skull Crushers (3×10)" },
        { name: "Lower A (Quad Bias)", lifts: "Back Squat (4×6 @ RPE 8), Leg Press (3×10), Walking Lunges (3×12), Seated Leg Curls (4×12)" },
        { name: "Upper B (Hypertrophy)", lifts: "Incline DB Press (3×10), Chest-Supported T-Bar Row (3×10), DB Lateral Raises (4×15), Hammer Curls (3×12)" },
        { name: "Lower B (Posterior)", lifts: "Romanian Deadlift (4×8 @ RPE 8), Hack Squat (3×10), Lying Leg Curl (4×12), Standing Calf Raise (4×15)" },
      ],
      targetSets: 14,
    },
    full_body: {
      name: "Full Body Frequency",
      frequency: "3 Days / Week",
      description: "High-efficiency periodization that stimulates muscle protein synthesis across the entire kinetic chain every 48 hours.",
      days: [
        { name: "Session A", lifts: "Front Squat (3×8 @ RPE 8), Flat DB Bench (3×8), Chest-Supported Row (3×10), DB Lateral Raises (3×15)" },
        { name: "Session B", lifts: "Trap Bar Deadlift (3×6 @ RPE 8), Overhead Press (3×8), Lat Pulldown (3×10), Lying Leg Curl (3×12)" },
        { name: "Session C", lifts: "Bulgarian Split Squat (3×10/leg), Incline DB Bench (3×10), Cable Rows (3×12), DB Bicep / Tricep Superset (3×12)" },
      ],
      targetSets: 12,
    },
  };

  // --- State for AI Coach Consultation Demo ---
  const [selectedCoachQuestion, setSelectedCoachQuestion] = useState<number>(0);

  const coachConsultations = [
    {
      question: "Shoulder discomfort during barbell bench press?",
      tag: "Biomechanical Adaptation",
      athleteScenario: "Athlete reports anterior glenohumeral impingement during the bottom 2 inches of the barbell bench descent.",
      recommendation: "Switch immediately to a 30° Incline Dumbbell Press with a semi-neutral grip (palms at 45°). This reduces internal subacromial rotational torque while preserving clavicular and sternal pectoral recruitment. Lower working intensity to RPE 7.5 and perform 2 sets of rotator cuff band external rotations before pressing.",
      metricChange: "Joint stress: -42% | Pec Activation: Equal",
    },
    {
      question: "Plateaued on squat for 3 consecutive weeks?",
      tag: "Progressive Overload",
      athleteScenario: "Athlete has been stuck at 315 lbs × 5 reps on back squats, failing at the sticking point 4 inches above parallel.",
      recommendation: "Implement 2-second Pause Squats at parallel as your first working movement to eliminate the stretch-shortening reflex and develop true concentric rate of force development. Additionally, add 2 working sets of unilateral Bulgarian split squats to correct quad-dominance imbalances.",
      metricChange: "RFD Output: +18% | Hypertrophy Stimulus: Optimal",
    },
    {
      question: "Missed caloric intake on a heavy training day?",
      tag: "Metabolic Nutrition",
      athleteScenario: "Athlete completed high-volume lower body workout but fell 500 kcal short due to schedule constraints.",
      recommendation: "Shift +40g of high-glycemic carbohydrates to your next morning breakfast to replenish liver and muscular glycogen stores without spilling over into de novo lipogenesis. Consume 35g of whey isolate or leucine-rich protein before sleeping to support myofibrillar protein synthesis.",
      metricChange: "Glycogen Restoration: 100% | Nitrogen Balance: Positive",
    },
    {
      question: "How do I know when to take an autoregulated deload?",
      tag: "Fatigue Autoregulation",
      athleteScenario: "Athlete has completed 5 weeks of progressive overload and feels sluggish during warmup sets.",
      recommendation: "If bar velocity decreases by >15% during standard warmup sets for two consecutive sessions, or resting morning heart rate is elevated by >6 bpm, trigger an immediate 1-week deload: Reduce volume by 50% (perform 2 sets instead of 4) while maintaining moderate load at RPE 6-7 to dissipate systemic fatigue.",
      metricChange: "Systemic Fatigue: -60% | CNS Recovery: Restored",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-24">

      {/* ========================================================================= */}
      {/* 1. HOME SECTION                                                           */}
      {/* ========================================================================= */}
      <section
        id="home"
        className="scroll-mt-6 relative overflow-hidden rounded-3xl border border-neutral-800/80 bg-gradient-to-b from-neutral-900/90 via-neutral-950 to-neutral-950 p-6 sm:p-12 text-center shadow-2xl"
      >
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
            <a
              href="#meals"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-neutral-950 shadow-lg shadow-emerald-500/25 hover:bg-emerald-400 hover:scale-[1.02] transition active:scale-[0.98]"
            >
              <Utensils className="h-4 w-4" />
              <span>Explore Meals &amp; Nutrition</span>
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#workouts"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-700 bg-neutral-900/90 px-6 py-3 text-sm font-semibold text-neutral-200 hover:bg-neutral-800 hover:text-white transition"
            >
              <Dumbbell className="h-4 w-4 text-emerald-400" />
              <span>View Workout Splits</span>
            </a>
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

      {/* ========================================================================= */}
      {/* 2. MEALS SECTION (Metabolic Math & Nutrition Architecture)                */}
      {/* ========================================================================= */}
      <section id="meals" className="scroll-mt-6 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">
            <Utensils className="h-3.5 w-3.5" />
            <span>Precision Sports Nutrition</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Metabolic Architecture &amp; Macro Calculator
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400">
            No generic 2,000-calorie guesses. We compute your exact Basal Metabolic Rate (BMR)
            and Total Daily Energy Expenditure (TDEE) using the clinical Mifflin-St Jeor equation.
          </p>
        </div>

        {/* Live Interactive Nutrition Calculator Card */}
        <Card className="bg-neutral-900/80 border-neutral-800 p-6 sm:p-8 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Controls */}
            <div className="lg:col-span-6 space-y-6">
              <div>
                <Title className="text-white text-base">Select Athlete Goal Phase:</Title>
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
                  <span className="text-emerald-400 font-bold font-mono">
                    {demoWeightLbs} lbs ({Math.round(demoWeightKg)} kg)
                  </span>
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

        {/* 3 Nutrition Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card decoration="top" decorationColor="emerald" className="bg-neutral-900/60 border-neutral-800 p-5 space-y-2">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-mono">01</span>
              2.2g Protein / kg Baseline
            </h4>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Provides the critical threshold of branched-chain amino acids (leucine &gt; 3g per meal) to maximize myofibrillar protein synthesis across 24-hour feeding windows.
            </p>
          </Card>
          <Card decoration="top" decorationColor="cyan" className="bg-neutral-900/60 border-neutral-800 p-5 space-y-2">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 text-xs font-mono">02</span>
              Intra &amp; Peri-Workout Glycogen
            </h4>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Carbohydrate periodization delivers fast-absorbing glucose around high-volume resistance training, preserving intramyocellular glycogen and suppressing muscle proteolysis.
            </p>
          </Card>
          <Card decoration="top" decorationColor="amber" className="bg-neutral-900/60 border-neutral-800 p-5 space-y-2">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 text-xs font-mono">03</span>
              Endocrine Lipid Balance
            </h4>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Maintains essential fatty acids at 20-30% of total daily energy to support testosterone production, cell membrane integrity, and fat-soluble vitamin uptake.
            </p>
          </Card>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. WORKOUTS SECTION (Adaptive Resistance Programming)                     */}
      {/* ========================================================================= */}
      <section id="workouts" className="scroll-mt-6 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-400">
            <Dumbbell className="h-3.5 w-3.5" />
            <span>Resistance Training &amp; Periodization</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Adaptive Workouts &amp; Progressive Overload
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400">
            Systematic volume autoregulation based on RPE (Rating of Perceived Exertion) and RIR (Reps in Reserve) to maximize mechanical tension.
          </p>
        </div>

        {/* Split Switcher */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSplit("ppl")}
            className={`rounded-xl px-4 py-2.5 text-xs font-bold transition border ${
              activeSplit === "ppl"
                ? "bg-emerald-500 text-neutral-950 border-emerald-400 shadow-lg shadow-emerald-500/20"
                : "bg-neutral-900/80 border-neutral-800 text-neutral-400 hover:text-white"
            }`}
          >
            Push / Pull / Legs (PPL)
          </button>
          <button
            type="button"
            onClick={() => setActiveSplit("upper_lower")}
            className={`rounded-xl px-4 py-2.5 text-xs font-bold transition border ${
              activeSplit === "upper_lower"
                ? "bg-emerald-500 text-neutral-950 border-emerald-400 shadow-lg shadow-emerald-500/20"
                : "bg-neutral-900/80 border-neutral-800 text-neutral-400 hover:text-white"
            }`}
          >
            Upper / Lower (4-Day)
          </button>
          <button
            type="button"
            onClick={() => setActiveSplit("full_body")}
            className={`rounded-xl px-4 py-2.5 text-xs font-bold transition border ${
              activeSplit === "full_body"
                ? "bg-emerald-500 text-neutral-950 border-emerald-400 shadow-lg shadow-emerald-500/20"
                : "bg-neutral-900/80 border-neutral-800 text-neutral-400 hover:text-white"
            }`}
          >
            Full Body Frequency (3-Day)
          </button>
        </div>

        {/* Split Detail Card */}
        <Card className="bg-neutral-900/70 border-neutral-800 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800/80 pb-4">
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                {splitDetails[activeSplit].name}
              </h3>
              <p className="text-xs text-neutral-400 mt-1">
                {splitDetails[activeSplit].description}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="rounded-lg bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 text-xs font-mono font-semibold text-cyan-400">
                {splitDetails[activeSplit].frequency}
              </span>
              <span className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-mono font-semibold text-emerald-400">
                ~{splitDetails[activeSplit].targetSets} Weekly Sets / Muscle
              </span>
            </div>
          </div>

          {/* Routine Sessions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {splitDetails[activeSplit].days.map((day, idx) => (
              <div key={idx} className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 font-mono">
                    {day.name}
                  </h4>
                  <span className="text-[10px] text-neutral-500 font-mono">RPE 8-9</span>
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  {day.lifts}
                </p>
              </div>
            ))}
          </div>

          {/* Progressive Overload Guidelines */}
          <div className="rounded-xl border border-neutral-800/80 bg-neutral-950 p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-neutral-400 font-medium">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Double Progression: Hit top reps before adding weight</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-cyan-400 shrink-0" />
              <span>RIR 1-2: Leave 1 to 2 reps in reserve on compound lifts</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-amber-400 shrink-0" />
              <span>Deload: Reduce volume by 50% every 6-8 weeks</span>
            </div>
          </div>
        </Card>
      </section>

      {/* ========================================================================= */}
      {/* 4. PROGRESS SECTION (Telemetry & Performance Analytics)                   */}
      {/* ========================================================================= */}
      <section id="progress" className="scroll-mt-6 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-400">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Telemetry &amp; Telemetry Analytics</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Progress Telemetry &amp; Strength Analytics
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400">
            Track your weekly volume adherence, estimated 1-Rep Max curves, and nutritional compliance in real time.
          </p>
        </div>

        {/* 4 KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card decoration="left" decorationColor="emerald" className="bg-neutral-900/60 border-neutral-800 p-5 space-y-2">
            <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
              Hypertrophy Stimulus
            </div>
            <div className="text-2xl font-black text-white font-mono">94.2%</div>
            <ProgressBar value={94.2} color="emerald" className="mt-2" />
            <span className="text-[10px] text-emerald-400 font-mono">Optimal stimulus range</span>
          </Card>

          <Card decoration="left" decorationColor="cyan" className="bg-neutral-900/60 border-neutral-800 p-5 space-y-2">
            <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
              Calorie Adherence
            </div>
            <div className="text-2xl font-black text-white font-mono">98.6%</div>
            <ProgressBar value={98.6} color="cyan" className="mt-2" />
            <span className="text-[10px] text-cyan-400 font-mono">7-day average consistency</span>
          </Card>

          <Card decoration="left" decorationColor="amber" className="bg-neutral-900/60 border-neutral-800 p-5 space-y-2">
            <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
              1RM Strength Trend
            </div>
            <div className="text-2xl font-black text-white font-mono">+8.4%</div>
            <ProgressBar value={84} color="amber" className="mt-2" />
            <span className="text-[10px] text-amber-400 font-mono">6-week linear progression</span>
          </Card>

          <Card decoration="left" decorationColor="purple" className="bg-neutral-900/60 border-neutral-800 p-5 space-y-2">
            <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
              Recovery Score
            </div>
            <div className="text-2xl font-black text-white font-mono">Ready</div>
            <ProgressBar value={90} color="purple" className="mt-2" />
            <span className="text-[10px] text-purple-400 font-mono">CNS ready for high RPE</span>
          </Card>
        </div>

        {/* 6-Week Progressive Overload Visual Table */}
        <Card className="bg-neutral-900/70 border-neutral-800 p-6 sm:p-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <Title className="text-white text-base">Periodized Volume Trajectory (6-Week Microcycle)</Title>
            <span className="text-xs text-neutral-400 font-mono">Direct Sets / Muscle Group</span>
          </div>

          <div className="grid grid-cols-6 gap-2 sm:gap-3 text-center pt-2">
            {[
              { week: "W1", sets: "12 sets", status: "Introductory", color: "text-neutral-300", bg: "bg-neutral-800/40" },
              { week: "W2", sets: "14 sets", status: "Overload", color: "text-neutral-200", bg: "bg-neutral-800/60" },
              { week: "W3", sets: "16 sets", status: "Overload", color: "text-cyan-400", bg: "bg-cyan-950/20 border-cyan-800/40" },
              { week: "W4", sets: "18 sets", status: "Peak Volume", color: "text-emerald-400", bg: "bg-emerald-950/20 border-emerald-800/40" },
              { week: "W5", sets: "8 sets", status: "Deload", color: "text-amber-400", bg: "bg-amber-950/20 border-amber-800/40" },
              { week: "W6", sets: "New Base", status: "Supercomp", color: "text-white font-bold", bg: "bg-emerald-500/20 border-emerald-500/40" },
            ].map((col, idx) => (
              <div key={idx} className={`rounded-xl border border-neutral-800 p-3 space-y-1 ${col.bg}`}>
                <div className="text-[10px] font-mono text-neutral-400">{col.week}</div>
                <div className={`text-xs sm:text-sm font-black font-mono ${col.color}`}>{col.sets}</div>
                <div className="text-[9px] text-neutral-400 hidden sm:block">{col.status}</div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* ========================================================================= */}
      {/* 5. COACH SECTION (AI Strength & Nutrition Specialist)                     */}
      {/* ========================================================================= */}
      <section id="coach" className="scroll-mt-6 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Autonomous Intelligence</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            24/7 AI Strength &amp; Nutrition Specialist
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400">
            Instant, context-aware answers to acute exercise substitutions, joint discomfort adaptations, and intra-workout fueling.
          </p>
        </div>

        {/* Interactive Consultation Card */}
        <Card className="bg-neutral-900/80 border-neutral-800 p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-wider font-bold text-neutral-400">
              Click a Question to Consult AI Coach:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {coachConsultations.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedCoachQuestion(idx)}
                  className={`text-left rounded-xl p-3.5 text-xs font-semibold transition border flex items-center justify-between gap-3 ${
                    selectedCoachQuestion === idx
                      ? "bg-emerald-500/15 border-emerald-500 text-white shadow-md shadow-emerald-500/10"
                      : "bg-neutral-950/80 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700"
                  }`}
                >
                  <span className="truncate">{item.question}</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md shrink-0 ${
                    selectedCoachQuestion === idx
                      ? "bg-emerald-500 text-neutral-950 font-bold"
                      : "bg-neutral-800 text-neutral-400"
                  }`}>
                    {item.tag}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* AI Coach Live Answer Display */}
          <div className="rounded-2xl border border-emerald-500/30 bg-neutral-950/90 p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-neutral-950 font-bold shadow-md shadow-emerald-500/20">
                  <BrainCircuit className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    StrengthWise AI Coach
                    <span className="rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2 text-[9px] font-mono">
                      Sports Science Certified
                    </span>
                  </div>
                  <div className="text-[11px] text-neutral-400">Context: {coachConsultations[selectedCoachQuestion].athleteScenario}</div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider font-mono">
                Prescription &amp; Biomechanical Rationale:
              </div>
              <p className="text-xs sm:text-sm text-neutral-200 leading-relaxed">
                {coachConsultations[selectedCoachQuestion].recommendation}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80 text-xs">
              <span className="text-neutral-400">Impact Analysis:</span>
              <span className="font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                {coachConsultations[selectedCoachQuestion].metricChange}
              </span>
            </div>
          </div>
        </Card>
      </section>

      {/* ========================================================================= */}
      {/* 6. CREATOR PROFILE SPOTLIGHT                                              */}
      {/* ========================================================================= */}
      <section id="creator" className="scroll-mt-6 space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <div className="text-xs uppercase tracking-wider text-emerald-400 font-bold">
            The Mind Behind StrengthWise
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Creator Profile
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400">
            Engineered by Karthik Ravi to merge clinical exercise science with autonomous AI coaching.
          </p>
        </div>

        <Card decoration="top" decorationColor="emerald" className="bg-neutral-900/60 border-neutral-800 p-6 sm:p-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8">
            {/* Creator Avatar with Radiant Accent */}
            <div className="relative group shrink-0">
              <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-3xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 p-1 shadow-xl shadow-emerald-500/15">
                <div className="h-full w-full rounded-[22px] bg-neutral-950 flex flex-col items-center justify-center text-white">
                  <span className="text-3xl sm:text-4xl font-black tracking-tight bg-gradient-to-br from-emerald-400 to-cyan-300 bg-clip-text text-transparent">
                    KR
                  </span>
                  <span className="text-[10px] uppercase font-mono tracking-widest text-neutral-400 mt-1">
                    Creator
                  </span>
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500 text-neutral-950 shadow-md">
                <ShieldCheck className="h-4 w-4" />
              </div>
            </div>

            {/* Bio & Details */}
            <div className="flex-1 text-center md:text-left space-y-4">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    Karthik Ravi
                  </h3>
                  <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                    Lead Developer &amp; Founder
                  </span>
                </div>
                <p className="text-sm font-medium text-cyan-400">
                  Full-Stack AI Engineer &amp; Exercise Science Practitioner
                </p>
              </div>

              <p className="text-sm text-neutral-300 leading-relaxed max-w-2xl">
                Creator of <strong>StrengthWise AI</strong>. Built with the mission to eliminate
                guesswork from strength training and macro nutrition by fusing proven metabolic
                equations (Mifflin-St Jeor, adaptive training volume) with responsive AI assistance
                and real-time data telemetry.
              </p>

              {/* Quick Links / Badges */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
                <a
                  href="https://github.com/Kravi001/strengthwise-ai"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-neutral-700 bg-neutral-800/80 px-3.5 py-2 text-xs font-semibold text-white hover:bg-neutral-700 hover:border-neutral-600 transition"
                >
                  <svg className="h-4 w-4 fill-current text-neutral-300" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  <span>GitHub Repository</span>
                  <ExternalLink className="h-3 w-3 text-neutral-400" />
                </a>

                <a
                  href="mailto:karthik.s.ravi@gmail.com"
                  className="inline-flex items-center gap-2 rounded-xl border border-neutral-700 bg-neutral-800/80 px-3.5 py-2 text-xs font-semibold text-white hover:bg-neutral-700 hover:border-neutral-600 transition"
                >
                  <Mail className="h-4 w-4 text-emerald-400" />
                  <span>karthik.s.ravi@gmail.com</span>
                </a>

                <div className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs font-mono text-neutral-400">
                  <Globe className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Live on Vercel Edge</span>
                </div>
              </div>
            </div>
          </div>

          <Divider className="my-6" />

          {/* Architecture & Tech Stack Highlights */}
          <div>
            <h4 className="text-xs uppercase tracking-wider font-semibold text-neutral-400 mb-3">
              Core Engineering Architecture
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border border-neutral-800/90 bg-neutral-950/60 p-3.5 space-y-1">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Code2 className="h-4 w-4" />
                  <span className="text-xs font-bold text-white">Next.js 15.5</span>
                </div>
                <p className="text-[11px] text-neutral-400">
                  React 19, Turbopack, App Router &amp; Server Actions
                </p>
              </div>

              <div className="rounded-xl border border-neutral-800/90 bg-neutral-950/60 p-3.5 space-y-1">
                <div className="flex items-center gap-2 text-cyan-400">
                  <Database className="h-4 w-4" />
                  <span className="text-xs font-bold text-white">Supabase + Prisma</span>
                </div>
                <p className="text-[11px] text-neutral-400">
                  PostgreSQL pooler, Row Level Security &amp; OAuth
                </p>
              </div>

              <div className="rounded-xl border border-neutral-800/90 bg-neutral-950/60 p-3.5 space-y-1">
                <div className="flex items-center gap-2 text-amber-400">
                  <Layers className="h-4 w-4" />
                  <span className="text-xs font-bold text-white">Tremor UI</span>
                </div>
                <p className="text-[11px] text-neutral-400">
                  Tailwind CSS design system &amp; clean dashboard aesthetics
                </p>
              </div>

              <div className="rounded-xl border border-neutral-800/90 bg-neutral-950/60 p-3.5 space-y-1">
                <div className="flex items-center gap-2 text-purple-400">
                  <BrainCircuit className="h-4 w-4" />
                  <span className="text-xs font-bold text-white">AI Coach Engine</span>
                </div>
                <p className="text-[11px] text-neutral-400">
                  Dynamic RPE autoregulation &amp; sports science formulas
                </p>
              </div>
            </div>
          </div>
        </Card>
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
