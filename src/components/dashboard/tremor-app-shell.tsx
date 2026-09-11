"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Card,
  Metric,
  Text,
  Title,
  Subtitle,
  ProgressBar,
  BadgeDelta,
  DonutChart,
  AreaChart,
  Tracker,
} from "@/components/tremor";
import {
  AlertCircle,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  Dumbbell,
  Edit3,
  Info,
  LayoutDashboard,
  LineChart,
  LogOut,
  RefreshCw,
  Save,
  Send,
  Settings,
  Target,
  Utensils,
} from "lucide-react";
import { calculateNutritionTargets, type CalculatedTargets } from "@/lib/calc";
import type { User } from "@supabase/supabase-js";

export interface ProfileData {
  id: string;
  userId: string;
  age: number | null;
  gender: string | null;
  heightCm: number | null;
  weightKg: number | null;
  goalWeightKg: number | null;
  activityLevel: string | null;
  goal: string | null;
  dietPreference: string | null;
  experienceLevel: string | null;
  targetCalories: number | null;
  targetProtein: number | null;
  targetCarbs: number | null;
  targetFat: number | null;
}

interface TremorAppShellProps {
  user: User;
  profile: ProfileData;
  onProfileUpdated: (updated: ProfileData) => void;
  onSignOut: () => void;
}

type TabType = "overview" | "workouts" | "nutrition" | "progress" | "coach" | "settings";

export function TremorAppShell({
  user,
  profile,
  onProfileUpdated,
  onSignOut,
}: TremorAppShellProps) {
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  // Form states for Settings tab
  const [unitSystem, setUnitSystem] = useState<"imperial" | "metric">("imperial");
  const [age, setAge] = useState<number | "">(profile.age || 26);
  const [gender, setGender] = useState<string>(profile.gender || "MALE");
  const [heightCm, setHeightCm] = useState<number | "">(profile.heightCm || 178);
  const [weightKg, setWeightKg] = useState<number | "">(profile.weightKg || 77);
  const [goalWeightKg, setGoalWeightKg] = useState<number | "">(profile.goalWeightKg || 75);
  const [activityLevel, setActivityLevel] = useState<string>(profile.activityLevel || "MODERATE");
  const [goal, setGoal] = useState<string>(profile.goal || "BUILD_MUSCLE");
  const [dietPreference, setDietPreference] = useState<string>(profile.dietPreference || "STANDARD");
  const [experienceLevel, setExperienceLevel] = useState<string>(profile.experienceLevel || "INTERMEDIATE");

  // Imperial display fields
  const [heightFt, setHeightFt] = useState<number | "">(5);
  const [heightIn, setHeightIn] = useState<number | "">(10);
  const [weightLbs, setWeightLbs] = useState<number | "">(
    Math.round((profile.weightKg || 77) * 2.20462)
  );
  const [goalWeightLbs, setGoalWeightLbs] = useState<number | "">(
    Math.round((profile.goalWeightKg || 75) * 2.20462)
  );

  const [saving, startSaveTransition] = useTransition();
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Workout logger state
  const [completedSets, setCompletedSets] = useState<Record<string, boolean>>({
    "bench-1": true,
    "bench-2": true,
    "bench-3": false,
    "bench-4": false,
  });

  // AI Coach interactive chat state
  const [chatMessages, setChatMessages] = useState<
    Array<{ sender: "user" | "coach"; text: string; time: string }>
  >([
    {
      sender: "coach",
      text: `Welcome, Athlete! I'm your StrengthWise AI Coach. I've calibrated your program based on your ${profile.goal?.replace("_", " ")} goal and ${profile.experienceLevel?.toLowerCase()} experience level. How can I assist your training or nutrition today?`,
      time: "Just now",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [aiTyping, setAiTyping] = useState(false);

  // Sync Imperial / Metric
  const updateWeightFromLbs = (lbs: number) => {
    setWeightLbs(lbs);
    setWeightKg(Math.round((lbs / 2.20462) * 10) / 10);
  };

  const updateGoalWeightFromLbs = (lbs: number) => {
    setGoalWeightLbs(lbs);
    setGoalWeightKg(Math.round((lbs / 2.20462) * 10) / 10);
  };

  const updateHeightFromFtIn = (ft: number, inch: number) => {
    setHeightFt(ft);
    setHeightIn(inch);
    const totalInches = ft * 12 + inch;
    setHeightCm(Math.round(totalInches * 2.54));
  };

  // Recalculate live scientific targets
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

  // Macro Donut Data
  const donutData = [
    { name: "Protein", value: targets.targetProtein, color: "#10b981" },
    { name: "Carbs", value: targets.targetCarbs, color: "#06b6d4" },
    { name: "Fats", value: targets.targetFat, color: "#f59e0b" },
  ];

  const totalMacroCalories = targets.targetCalories || 2000;
  const proteinPercent = Math.round(((targets.targetProtein * 4) / totalMacroCalories) * 100);
  const carbsPercent = Math.round(((targets.targetCarbs * 4) / totalMacroCalories) * 100);
  const fatPercent = Math.round(((targets.targetFat * 9) / totalMacroCalories) * 100);

  // 7-day Tremor Tracker mock compliance
  const trackerData = [
    { color: "emerald" as const, tooltip: "Mon: Upper Hypertrophy (Completed)" },
    { color: "emerald" as const, tooltip: "Tue: Lower Strength (Completed)" },
    { color: "neutral" as const, tooltip: "Wed: Rest & Recovery" },
    { color: "emerald" as const, tooltip: "Thu: Push Volume (Completed)" },
    { color: "emerald" as const, tooltip: "Fri: Pull Volume (Completed)" },
    { color: "emerald" as const, tooltip: "Sat: Leg Specialization (Completed)" },
    { color: "neutral" as const, tooltip: "Sun: Active Recovery" },
  ];

  // Tremor AreaChart progression data
  const volumeData = [
    { week: "W1", volumeKg: 9400, target: 9000 },
    { week: "W2", volumeKg: 10200, target: 9500 },
    { week: "W3", volumeKg: 11600, target: 11000 },
    { week: "W4", volumeKg: 8500, target: 8000 }, // Deload
    { week: "W5", volumeKg: 12400, target: 12000 },
    { week: "W6", volumeKg: 13800, target: 13000 },
  ];

  // Handle Save in Settings
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(false);
    setSaveError(null);

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
          throw new Error(result.error || "Failed to update profile.");
        }

        onProfileUpdated(result.profile);
        setSaveSuccess(true);
      } catch (err: unknown) {
        setSaveError(err instanceof Error ? err.message : "Failed to update profile.");
      }
    });
  };

  // Handle AI Coach message send
  const handleSendMessage = (textToSend?: string) => {
    const message = textToSend || chatInput;
    if (!message.trim()) return;

    const userMsg = { sender: "user" as const, text: message, time: "Just now" };
    setChatMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setChatInput("");
    setAiTyping(true);

    setTimeout(() => {
      let reply = "";
      const lower = message.toLowerCase();

      if (lower.includes("squat") || lower.includes("form")) {
        reply = `For barbell back squats with your ${profile.experienceLevel?.toLowerCase()} profile: Focus on maintaining thoracic extension, root your feet with 3 points of contact, brace into your abdominal belt, and track your knees in line with your 2nd toe. Aim for parallel depth with controlled tempo (3-sec eccentric).`;
      } else if (lower.includes("pre-workout") || lower.includes("eat") || lower.includes("meal")) {
        reply = `Given your daily target of ${targets.targetCalories} kcal and ${targets.targetCarbs}g carbs: Consume 40-50g of easily digestible complex carbs (oats or white rice) and 30g lean protein (whey or egg whites) 75-90 minutes prior to lifting. Hydrate with 500ml water + electrolytes.`;
      } else if (lower.includes("shoulder") || lower.includes("pain") || lower.includes("bench")) {
        reply = `Shoulder discomfort during bench press usually stems from excessive internal rotation or flared elbows. Retract and depress your scapulae, tuck your elbows to a 45-degree angle, and consider temporarily swapping to a Swiss/Neutral grip bar or low-incline dumbbell press with slow eccentrics.`;
      } else if (lower.includes("plateau") || lower.includes("weight") || lower.includes("deload")) {
        reply = `Plateau management: If your main lifts haven't progressed for 2-3 consecutive sessions, introduce a dynamic deload: drop volume by 40% for 1 week while maintaining 80% intensity, then return with wave loading (+2.5% load progression weekly).`;
      } else {
        reply = `Based on your athlete profile (${targets.targetCalories} kcal/day, ${targets.targetProtein}g protein target): Keep training intensity dialed at RPE 8-9 on compound movements and prioritize 7-9 hours of sleep. Would you like me to adjust your volume or meal timing?`;
      }

      setChatMessages((prev) => [
        ...prev,
        { sender: "coach", text: reply, time: "Just now" },
      ]);
      setAiTyping(false);
    }, 800);
  };

  // Sidebar navigation items in Tremor UI vertical style
  const navItems: Array<{ id: TabType; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "workouts", label: "Workouts", icon: Dumbbell },
    { id: "nutrition", label: "Nutrition", icon: Utensils },
    { id: "progress", label: "Progress", icon: LineChart },
    { id: "coach", label: "AI Coach", icon: BrainCircuit },
    { id: "settings", label: "Profile & Settings", icon: Settings },
  ];

  return (
    <div className="fixed inset-0 bg-neutral-950 text-neutral-100 flex flex-row z-50 overflow-hidden">

      {/* LEFT VERTICAL SIDEBAR — slim icon-only on mobile, full on md+ */}
      <aside className="sticky top-0 h-screen shrink-0 border-r border-neutral-800/80 bg-neutral-950 flex flex-col justify-between
        w-14 md:w-64 transition-all duration-300 z-40">

        <div className="flex flex-col gap-5 overflow-hidden">
          {/* Brand Header */}
          <div className="flex items-center gap-2.5 px-3 pt-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-neutral-950 shadow-md shadow-emerald-500/20">
              <Dumbbell className="h-5 w-5" />
            </div>
            <div className="hidden md:block">
              <div className="text-base font-extrabold tracking-tight text-white leading-tight whitespace-nowrap">
                Strength<span className="text-emerald-400">Wise</span>
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/90">
                AI Dashboard
              </div>
            </div>
          </div>

          {/* Calibrated Status Badge — hidden on mobile */}
          <div className="hidden md:block mx-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-2.5 space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>Mifflin-St Jeor Engine</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono">
              <span>{targets.targetCalories} kcal</span>
              <span className="text-neutral-300 font-sans capitalize">
                {profile.goal?.replace("_", " ").toLowerCase() || "Muscle"}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-0.5 px-2">
            <div className="hidden md:block px-1 text-[10px] uppercase font-bold tracking-wider text-neutral-500 mb-1">
              Athlete Platform
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  title={item.label}
                  className={`group w-full flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-xs font-semibold transition text-left ${
                    isActive
                      ? "bg-neutral-900 text-emerald-400 border border-neutral-700/80 shadow-sm"
                      : "text-neutral-400 hover:text-white hover:bg-neutral-900/50"
                  }`}
                >
                  <Icon className={`h-4.5 w-4.5 shrink-0 h-[18px] w-[18px] ${
                    isActive ? "text-emerald-400" : "text-neutral-400 group-hover:text-white"
                  }`} />
                  <span className="hidden md:block flex-1 whitespace-nowrap">{item.label}</span>
                  {item.id === "coach" && (
                    <span className="hidden md:block rounded-md bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400">
                      AI
                    </span>
                  )}
                </button>
              );
            })}

            {/* Link back to About */}
            <div className="pt-3 mt-2 border-t border-neutral-800/80">
              <div className="hidden md:block px-1 text-[10px] uppercase font-bold tracking-wider text-neutral-500 mb-1">
                External
              </div>
              <Link
                href="/"
                title="About StrengthWise"
                className="group w-full flex items-center gap-3 rounded-xl px-2.5 py-2 text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-900/50 transition"
              >
                <Info className="h-[18px] w-[18px] shrink-0 text-neutral-400 group-hover:text-white" />
                <span className="hidden md:block whitespace-nowrap">About StrengthWise</span>
              </Link>
            </div>
          </nav>
        </div>

        {/* Sidebar Footer: User Account */}
        <div className="border-t border-neutral-800/80 p-2 md:p-3 space-y-2">
          <div className="flex items-center gap-3 px-0.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-neutral-800 border border-neutral-700 text-emerald-400 font-bold text-xs uppercase">
              {user.email?.charAt(0) || "A"}
            </div>
            <div className="hidden md:block overflow-hidden text-left">
              <p className="truncate text-xs font-medium text-white">{user.email}</p>
              <p className="text-[10px] text-neutral-400">Athlete Pro Tier</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            title="Sign Out"
            className="w-full flex items-center justify-center md:justify-start gap-2 rounded-xl border border-neutral-800 bg-neutral-900/80 px-2 py-2 text-xs font-medium text-neutral-400 hover:bg-neutral-800 hover:text-red-400 transition"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span className="hidden md:block">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8">
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs text-neutral-400 mb-1">
              <span>Athlete Hub</span>
              <ChevronRight className="h-3.5 w-3.5 text-neutral-600" />
              <span className="text-emerald-400 font-medium capitalize">{activeTab}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white capitalize">
              {activeTab === "overview" && "Athlete Command Center"}
              {activeTab === "workouts" && "Resistance Training & Volume"}
              {activeTab === "nutrition" && "Clinical Metabolic Architecture"}
              {activeTab === "progress" && "Performance Telemetry"}
              {activeTab === "coach" && "AI Strength & Nutrition Specialist"}
              {activeTab === "settings" && "Athlete Profile & Target Calibration"}
            </h1>
          </div>

          <div className="flex items-center gap-3 self-start">
            <div className="hidden sm:flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900/80 px-3 py-1.5 text-xs text-neutral-300">
              <Target className="h-3.5 w-3.5 text-emerald-400" />
              <span>Target:</span>
              <strong className="font-mono text-emerald-400">{targets.targetCalories} kcal</strong>
            </div>

            {activeTab !== "settings" && (
              <button
                type="button"
                onClick={() => setActiveTab("settings")}
                className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs font-medium text-neutral-200 hover:bg-neutral-800 hover:text-white transition"
              >
                <Edit3 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Edit Metrics</span>
              </button>
            )}
          </div>
        </div>

        {/* VIEW 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* 4 Tremor KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card decoration="top" decorationColor="emerald">
                <div className="flex items-center justify-between">
                  <Text>Daily Caloric Budget</Text>
                  <BadgeDelta
                    deltaType={
                      profile.goal === "BUILD_MUSCLE"
                        ? "increase"
                        : profile.goal === "LOSE_WEIGHT"
                        ? "decrease"
                        : "unchanged"
                    }
                  >
                    {profile.goal === "BUILD_MUSCLE" ? "+10% Surplus" : profile.goal === "LOSE_WEIGHT" ? "-20% Deficit" : "Maintenance"}
                  </BadgeDelta>
                </div>
                <Metric className="mt-2 text-2xl sm:text-3xl font-mono">
                  {targets.targetCalories}{" "}
                  <span className="text-xs font-sans text-neutral-400 font-normal">kcal/day</span>
                </Metric>
                <div className="mt-3 text-[11px] text-neutral-400 flex justify-between border-t border-neutral-800/80 pt-2">
                  <span>BMR: {targets.bmr}</span>
                  <span>TDEE: {targets.tdee}</span>
                </div>
              </Card>

              <Card decoration="top" decorationColor="emerald">
                <div className="flex items-center justify-between">
                  <Text>Protein Target</Text>
                  <span className="text-[10px] uppercase font-bold text-emerald-400">2.2g / kg</span>
                </div>
                <Metric className="mt-2 text-2xl sm:text-3xl font-mono">
                  {targets.targetProtein}g
                </Metric>
                <div className="mt-3 space-y-1">
                  <ProgressBar value={proteinPercent} color="emerald" />
                  <div className="text-[11px] text-neutral-400 text-right">
                    {proteinPercent}% of total calories
                  </div>
                </div>
              </Card>

              <Card decoration="top" decorationColor="cyan">
                <div className="flex items-center justify-between">
                  <Text>Carbohydrates</Text>
                  <span className="text-[10px] uppercase font-bold text-cyan-400">Glycogen Fuel</span>
                </div>
                <Metric className="mt-2 text-2xl sm:text-3xl font-mono">
                  {targets.targetCarbs}g
                </Metric>
                <div className="mt-3 space-y-1">
                  <ProgressBar value={carbsPercent} color="cyan" />
                  <div className="text-[11px] text-neutral-400 text-right">
                    {carbsPercent}% of total calories
                  </div>
                </div>
              </Card>

              <Card decoration="top" decorationColor="amber">
                <div className="flex items-center justify-between">
                  <Text>Fats</Text>
                  <span className="text-[10px] uppercase font-bold text-amber-400">Endocrine Health</span>
                </div>
                <Metric className="mt-2 text-2xl sm:text-3xl font-mono">
                  {targets.targetFat}g
                </Metric>
                <div className="mt-3 space-y-1">
                  <ProgressBar value={fatPercent} color="amber" />
                  <div className="text-[11px] text-neutral-400 text-right">
                    {fatPercent}% of total calories
                  </div>
                </div>
              </Card>
            </div>

            {/* Middle Row: Tremor Macro Donut Chart & 7-Day Consistency Tracker */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <Card decoration="left" decorationColor="emerald" className="lg:col-span-5">
                <Title>Macronutrient Distribution</Title>
                <Subtitle>Optimal sports nutrition split for {profile.goal?.replace("_", " ").toLowerCase()}</Subtitle>
                <div className="py-2">
                  <DonutChart
                    data={donutData}
                    label="Target Grams"
                    valueFormatter={(v) => `${v}g`}
                    className="h-44 w-44"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-neutral-800/80 text-center text-xs">
                  <div>
                    <span className="text-emerald-400 font-bold">{targets.targetProtein}g</span>
                    <p className="text-[10px] text-neutral-400">Protein</p>
                  </div>
                  <div>
                    <span className="text-cyan-400 font-bold">{targets.targetCarbs}g</span>
                    <p className="text-[10px] text-neutral-400">Carbs</p>
                  </div>
                  <div>
                    <span className="text-amber-400 font-bold">{targets.targetFat}g</span>
                    <p className="text-[10px] text-neutral-400">Fats</p>
                  </div>
                </div>
              </Card>

              <div className="lg:col-span-7 space-y-6">
                {/* 7-Day Consistency Tracker */}
                <Card decoration="left" decorationColor="cyan">
                  <div className="flex items-center justify-between">
                    <div>
                      <Title>Weekly Training Consistency</Title>
                      <Subtitle>7-day compliance: 92% adherence</Subtitle>
                    </div>
                    <span className="rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                      On Target
                    </span>
                  </div>
                  <div className="mt-4">
                    <Tracker data={trackerData} />
                  </div>
                </Card>

                {/* Today's Training Quick Card */}
                <Card decoration="left" decorationColor="amber">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                        <Dumbbell className="h-5 w-5" />
                      </div>
                      <div>
                        <Title>Today&apos;s Prescribed Session</Title>
                        <Subtitle>Hypertrophy Push A • Target RPE 8-9</Subtitle>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab("workouts")}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-neutral-950 hover:bg-emerald-400 transition"
                    >
                      <span>Log Session</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: WORKOUTS */}
        {activeTab === "workouts" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">Active Split: Push / Pull / Legs</h2>
                <p className="text-xs text-neutral-400">
                  Calibrated for {profile.experienceLevel?.toLowerCase()} lifting experience. Progressive overload targeting 8-9 RPE.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-1.5 text-xs text-neutral-300">
                  Volume Load: <strong className="text-emerald-400 font-mono">11,850 kg</strong>
                </span>
              </div>
            </div>

            {/* Workout exercises */}
            <Card decoration="top" decorationColor="emerald">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-4">
                <div>
                  <Title>Session: Hypertrophy Push A</Title>
                  <Subtitle>Primary focus: Pectorals, Anterior Deltoids, Triceps</Subtitle>
                </div>
                <span className="rounded-md bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/20">
                  RPE 8.0 Target
                </span>
              </div>

              <div className="space-y-4">
                {/* Exercise 1 */}
                <div className="rounded-xl border border-neutral-800/80 bg-neutral-950 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white">1. Barbell Bench Press</h4>
                      <p className="text-xs text-neutral-400">4 sets × 6-8 reps • 3 min rest</p>
                    </div>
                    <span className="text-xs font-mono text-emerald-400 font-bold">Working: 85 kg (185 lbs)</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[1, 2, 3, 4].map((setNum) => {
                      const key = `bench-${setNum}`;
                      const isDone = completedSets[key];
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setCompletedSets((prev) => ({ ...prev, [key]: !prev[key] }))}
                          className={`flex items-center justify-between rounded-lg p-2.5 text-xs transition border ${
                            isDone
                              ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-400"
                              : "bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-white"
                          }`}
                        >
                          <span>Set {setNum}</span>
                          <span className="font-mono">{isDone ? "✓ 8 reps" : "Pending"}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Exercise 2 */}
                <div className="rounded-xl border border-neutral-800/80 bg-neutral-950 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white">2. Incline Dumbbell Press</h4>
                      <p className="text-xs text-neutral-400">3 sets × 8-10 reps • 2 min rest</p>
                    </div>
                    <span className="text-xs font-mono text-cyan-400 font-bold">Working: 32 kg (70 lbs)</span>
                  </div>
                </div>

                {/* Exercise 3 */}
                <div className="rounded-xl border border-neutral-800/80 bg-neutral-950 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white">3. Standing Cable Lateral Raises</h4>
                      <p className="text-xs text-neutral-400">4 sets × 12-15 reps • 90s rest</p>
                    </div>
                    <span className="text-xs font-mono text-amber-400 font-bold">Working: 12 kg (25 lbs)</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* VIEW 3: NUTRITION */}
        {activeTab === "nutrition" && (
          <div className="space-y-6">
            <Card decoration="top" decorationColor="emerald">
              <Title>Mifflin-St Jeor Clinical Metabolic Calculation</Title>
              <Subtitle>Peer-reviewed sports nutrition formula based on your physiology</Subtitle>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="rounded-xl bg-neutral-950 p-4 border border-neutral-800 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-neutral-400">Basal Metabolic Rate (BMR)</div>
                  <div className="text-2xl font-extrabold text-white font-mono">{targets.bmr} kcal</div>
                  <p className="text-xs text-neutral-400">Energy consumed at complete rest</p>
                </div>

                <div className="rounded-xl bg-neutral-950 p-4 border border-neutral-800 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-neutral-400">Total Daily Energy (TDEE)</div>
                  <div className="text-2xl font-extrabold text-white font-mono">{targets.tdee} kcal</div>
                  <p className="text-xs text-neutral-400">Active expenditure (Multiplier: 1.55)</p>
                </div>

                <div className="rounded-xl bg-emerald-950/20 border border-emerald-500/30 p-4 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-emerald-400">Target Intake</div>
                  <div className="text-2xl font-extrabold text-emerald-400 font-mono">{targets.targetCalories} kcal</div>
                  <p className="text-xs text-neutral-300 capitalize">{profile.goal?.replace("_", " ").toLowerCase()}</p>
                </div>
              </div>
            </Card>

            {/* Meal Distribution Framework */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card decoration="left" decorationColor="emerald">
                <Text>Meal 1: Breakfast</Text>
                <Metric className="text-xl font-mono mt-1">{Math.round(targets.targetCalories * 0.25)} kcal</Metric>
                <p className="text-xs text-neutral-400 mt-2">
                  ~{Math.round(targets.targetProtein * 0.25)}g Protein • ~{Math.round(targets.targetCarbs * 0.25)}g Carbs
                </p>
              </Card>

              <Card decoration="left" decorationColor="cyan">
                <Text>Meal 2: Pre-Workout</Text>
                <Metric className="text-xl font-mono mt-1">{Math.round(targets.targetCalories * 0.25)} kcal</Metric>
                <p className="text-xs text-neutral-400 mt-2">
                  ~{Math.round(targets.targetProtein * 0.25)}g Protein • ~{Math.round(targets.targetCarbs * 0.35)}g Carbs
                </p>
              </Card>

              <Card decoration="left" decorationColor="emerald">
                <Text>Meal 3: Post-Workout</Text>
                <Metric className="text-xl font-mono mt-1">{Math.round(targets.targetCalories * 0.3)} kcal</Metric>
                <p className="text-xs text-neutral-400 mt-2">
                  ~{Math.round(targets.targetProtein * 0.3)}g Protein • ~{Math.round(targets.targetCarbs * 0.3)}g Carbs
                </p>
              </Card>

              <Card decoration="left" decorationColor="amber">
                <Text>Meal 4: Dinner</Text>
                <Metric className="text-xl font-mono mt-1">{Math.round(targets.targetCalories * 0.2)} kcal</Metric>
                <p className="text-xs text-neutral-400 mt-2">
                  ~{Math.round(targets.targetProtein * 0.2)}g Protein • ~{Math.round(targets.targetFat * 0.4)}g Fats
                </p>
              </Card>
            </div>
          </div>
        )}

        {/* VIEW 4: PROGRESS */}
        {activeTab === "progress" && (
          <div className="space-y-6">
            <Card decoration="top" decorationColor="emerald">
              <Title>6-Week Volume Progression (kg Lifted)</Title>
              <Subtitle>Progressive overload curve with scheduled Week 4 deload</Subtitle>
              <div className="mt-4">
                <AreaChart
                  data={volumeData}
                  index="week"
                  categories={["volumeKg", "target"]}
                  colors={["#10b981", "#525252"]}
                  valueFormatter={(v) => `${v}kg`}
                  className="h-64"
                />
              </div>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card decoration="left" decorationColor="emerald">
                <Text>Current Weight</Text>
                <Metric className="text-2xl font-mono mt-1">
                  {unitSystem === "imperial" ? `${weightLbs} lbs` : `${weightKg} kg`}
                </Metric>
                <p className="text-xs text-neutral-400 mt-1">Goal: {unitSystem === "imperial" ? `${goalWeightLbs} lbs` : `${goalWeightKg} kg`}</p>
              </Card>

              <Card decoration="left" decorationColor="cyan">
                <Text>Adherence Score</Text>
                <Metric className="text-2xl font-mono mt-1">94%</Metric>
                <p className="text-xs text-neutral-400 mt-1">Top 5% of registered athletes</p>
              </Card>

              <Card decoration="left" decorationColor="amber">
                <Text>Active Training Streak</Text>
                <Metric className="text-2xl font-mono mt-1">18 Days</Metric>
                <p className="text-xs text-neutral-400 mt-1">Hypertrophy phase ongoing</p>
              </Card>
            </div>
          </div>
        )}

        {/* VIEW 5: AI COACH */}
        {activeTab === "coach" && (
          <div className="space-y-6 max-w-4xl">
            <Card decoration="top" decorationColor="emerald" className="p-0 overflow-hidden">
              <div className="p-4 border-b border-neutral-800 bg-neutral-900/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-neutral-950">
                    <BrainCircuit className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">StrengthWise AI Coach</h3>
                    <p className="text-[11px] text-emerald-400">Context aware • Mifflin-St Jeor & Biomechanics</p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                  Online
                </span>
              </div>

              {/* Chat Message List */}
              <div className="p-4 sm:p-6 space-y-4 max-h-[450px] overflow-y-auto bg-neutral-950">
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                        msg.sender === "user"
                          ? "bg-emerald-600 text-neutral-950 font-medium"
                          : "bg-neutral-900 border border-neutral-800 text-neutral-200"
                      }`}
                    >
                      <p>{msg.text}</p>
                      <span className={`block text-[9px] mt-1 ${msg.sender === "user" ? "text-emerald-950/70" : "text-neutral-500"}`}>
                        {msg.time}
                      </span>
                    </div>
                  </div>
                ))}
                {aiTyping && (
                  <div className="flex items-center gap-2 text-xs text-neutral-400 italic">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-emerald-400" />
                    <span>Coach is formulating recommendations...</span>
                  </div>
                )}
              </div>

              {/* Quick Prompts */}
              <div className="p-3 bg-neutral-900/40 border-t border-neutral-800/80 flex flex-wrap gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => handleSendMessage("Give me form cues for Barbell Back Squats")}
                  className="rounded-lg bg-neutral-800/80 px-2.5 py-1 text-neutral-300 hover:text-white hover:bg-neutral-700 transition border border-neutral-700/50"
                >
                  Squat form cues
                </button>
                <button
                  type="button"
                  onClick={() => handleSendMessage("What should I eat before my workout?")}
                  className="rounded-lg bg-neutral-800/80 px-2.5 py-1 text-neutral-300 hover:text-white hover:bg-neutral-700 transition border border-neutral-700/50"
                >
                  Pre-workout meal
                </button>
                <button
                  type="button"
                  onClick={() => handleSendMessage("I have shoulder discomfort on bench press")}
                  className="rounded-lg bg-neutral-800/80 px-2.5 py-1 text-neutral-300 hover:text-white hover:bg-neutral-700 transition border border-neutral-700/50"
                >
                  Bench press pain substitute
                </button>
                <button
                  type="button"
                  onClick={() => handleSendMessage("How do I break a strength plateau?")}
                  className="rounded-lg bg-neutral-800/80 px-2.5 py-1 text-neutral-300 hover:text-white hover:bg-neutral-700 transition border border-neutral-700/50"
                >
                  Plateau breaking
                </button>
              </div>

              {/* Message Input */}
              <div className="p-3 border-t border-neutral-800 bg-neutral-900/80 flex items-center gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSendMessage();
                  }}
                  placeholder="Ask about exercise mechanics, nutrition timing, recovery..."
                  className="flex-1 rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  className="rounded-xl bg-emerald-500 p-2.5 text-neutral-950 hover:bg-emerald-400 transition"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </Card>
          </div>
        )}

        {/* VIEW 6: SETTINGS / PROFILE EDIT */}
        {activeTab === "settings" && (
          <form onSubmit={handleSaveProfile} className="space-y-6 max-w-4xl">
            {saveSuccess && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Athlete profile and nutritional targets saved successfully to PostgreSQL!</span>
              </div>
            )}

            {saveError && (
              <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{saveError}</span>
              </div>
            )}

            {/* Unit Toggle */}
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div>
                <Title>Measurement System</Title>
                <Subtitle>Choose how weights and heights are entered</Subtitle>
              </div>
              <div className="flex items-center gap-1 rounded-xl bg-neutral-900 p-1 border border-neutral-800">
                <button
                  type="button"
                  onClick={() => setUnitSystem("imperial")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    unitSystem === "imperial"
                      ? "bg-emerald-500 text-neutral-950"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  Imperial (lbs, ft)
                </button>
                <button
                  type="button"
                  onClick={() => setUnitSystem("metric")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    unitSystem === "metric"
                      ? "bg-emerald-500 text-neutral-950"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  Metric (kg, cm)
                </button>
              </div>
            </div>

            {/* Biometric Fields */}
            <Card decoration="left" decorationColor="emerald">
              <Title>Athlete Biometrics</Title>
              <Subtitle>Powers the Mifflin-St Jeor metabolic equations</Subtitle>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {/* Age */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-300">Age</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-2 px-3 text-sm text-neutral-100 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Biological Sex */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-300">Biological Sex</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-2 px-3 text-sm text-neutral-100 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="MALE">Male (+5 kcal factor)</option>
                    <option value="FEMALE">Female (-161 kcal factor)</option>
                  </select>
                </div>

                {/* Weight */}
                {unitSystem === "imperial" ? (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-neutral-300">Current Weight (lbs)</label>
                    <input
                      type="number"
                      value={weightLbs}
                      onChange={(e) => updateWeightFromLbs(Number(e.target.value))}
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-2 px-3 text-sm text-neutral-100 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-neutral-300">Current Weight (kg)</label>
                    <input
                      type="number"
                      value={weightKg}
                      onChange={(e) => setWeightKg(Number(e.target.value))}
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-2 px-3 text-sm text-neutral-100 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                )}

                {/* Height */}
                {unitSystem === "imperial" ? (
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-medium text-neutral-300">Height (Feet &amp; Inches)</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="Feet"
                        value={heightFt}
                        onChange={(e) => updateHeightFromFtIn(Number(e.target.value), Number(heightIn) || 0)}
                        className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-2 px-3 text-sm text-neutral-100 focus:border-emerald-500 focus:outline-none"
                      />
                      <input
                        type="number"
                        placeholder="Inches"
                        value={heightIn}
                        onChange={(e) => updateHeightFromFtIn(Number(heightFt) || 0, Number(e.target.value))}
                        className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-2 px-3 text-sm text-neutral-100 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-neutral-300">Height (cm)</label>
                    <input
                      type="number"
                      value={heightCm}
                      onChange={(e) => setHeightCm(Number(e.target.value))}
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-2 px-3 text-sm text-neutral-100 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                )}

                {/* Goal Weight */}
                {unitSystem === "imperial" ? (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-neutral-300">Goal Weight (lbs)</label>
                    <input
                      type="number"
                      value={goalWeightLbs}
                      onChange={(e) => updateGoalWeightFromLbs(Number(e.target.value))}
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-2 px-3 text-sm text-neutral-100 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-neutral-300">Goal Weight (kg)</label>
                    <input
                      type="number"
                      value={goalWeightKg}
                      onChange={(e) => setGoalWeightKg(Number(e.target.value))}
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-2 px-3 text-sm text-neutral-100 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>
            </Card>

            {/* Goals & Activity */}
            <Card decoration="left" decorationColor="cyan">
              <Title>Training Goals &amp; Volume</Title>
              <Subtitle>Calibrates progressive overload and calorie surplus/deficit</Subtitle>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-300">Primary Goal</label>
                  <select
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-2 px-3 text-sm text-neutral-100 focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="BUILD_MUSCLE">Hypertrophy (Lean Bulk +10%)</option>
                    <option value="LOSE_WEIGHT">Fat Loss (Deficit -20%)</option>
                    <option value="MAINTAIN">Maintain &amp; Recomp</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-300">Activity Level</label>
                  <select
                    value={activityLevel}
                    onChange={(e) => setActivityLevel(e.target.value)}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-2 px-3 text-sm text-neutral-100 focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="SEDENTARY">Sedentary (Desk job, 1.2x)</option>
                    <option value="LIGHT">Light (1-2 days/week, 1.375x)</option>
                    <option value="MODERATE">Moderate (3-5 days/week, 1.55x)</option>
                    <option value="VERY_ACTIVE">Very Active (6-7 days/week, 1.725x)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-300">Lifting Experience</label>
                  <select
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-2 px-3 text-sm text-neutral-100 focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="BEGINNER">Beginner (&lt; 1 year)</option>
                    <option value="INTERMEDIATE">Intermediate (1-3 years)</option>
                    <option value="ADVANCED">Advanced (3+ years)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-300">Dietary Preference</label>
                  <select
                    value={dietPreference}
                    onChange={(e) => setDietPreference(e.target.value)}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-2 px-3 text-sm text-neutral-100 focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="STANDARD">Standard Omnivore</option>
                    <option value="VEGETARIAN">Vegetarian</option>
                    <option value="VEGAN">Vegan</option>
                    <option value="KETO">Ketogenic (High Fat, Low Carb)</option>
                  </select>
                </div>
              </div>
            </Card>

            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-3 text-sm font-bold text-neutral-950 shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-emerald-500 transition disabled:opacity-50"
            >
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Saving Updates to PostgreSQL...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Target Recalibration</span>
                </>
              )}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
