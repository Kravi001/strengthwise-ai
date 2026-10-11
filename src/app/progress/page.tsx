"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Card,
  ProgressBar,
  AreaChart,
} from "@/components/tremor";
import {
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Flame,
  Lock,
  Plus,
  Scale,
  Sparkles,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface WeightLogItem {
  id: string;
  weightLbs: number;
  weightKg: number;
  note?: string | null;
  loggedAt: string;
}

interface ChartPoint {
  date: string;
  rawDate: string;
  weight: number;
  goal: number;
  note?: string | null;
  isSynthetic?: boolean;
}

interface WeightTelemetry {
  logs: WeightLogItem[];
  chartData: ChartPoint[];
  summary: {
    startingWeightLbs: number;
    currentWeightLbs: number;
    goalWeightLbs: number;
    goalType: string;
    totalChangeLbs: number;
    remainingToGoalLbs: number;
    weeklyRateLbs: number;
    projectedWeeks: number | null;
    convergencePercent: number;
    hasLogs: boolean;
  };
}

export default function ProgressPage() {
  const supabase = createClient();

  const [authUser, setAuthUser] = useState<User | null>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [loading, setLoading] = useState(true);

  // Profile data
  const [fullName, setFullName] = useState("");
  const [currentWeightLbs, setCurrentWeightLbs] = useState<number>(185);
  const [goalWeightLbs, setGoalWeightLbs] = useState<number>(175);
  const [goal, setGoal] = useState<"CUT" | "MAINTAIN" | "BULK">("BULK");
  const [userSplitDays, setUserSplitDays] = useState<number>(4);

  // Weight telemetry data
  const [weightData, setWeightData] = useState<WeightTelemetry | null>(null);
  const [selectedRange, setSelectedRange] = useState<"7D" | "30D" | "90D" | "ALL">("ALL");
  const [isLoadingWeight, setIsLoadingWeight] = useState(false);

  // Log weight modal state
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [weightInput, setWeightInput] = useState("");
  const [weightUnit, setWeightUnit] = useState<"LBS" | "KG">("LBS");
  const [logDateInput, setLogDateInput] = useState(() => new Date().toISOString().split("T")[0]);
  const [noteInput, setNoteInput] = useState("");
  const [isSavingWeight, setIsSavingWeight] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Quick note preset tags
  const notePresets = ["Morning Fasted", "Post-Workout", "Weekly Check-in", "Evening"];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Fetch weight history & telemetry
  const fetchWeightTelemetry = async (range: string = selectedRange) => {
    setIsLoadingWeight(true);
    try {
      const res = await fetch(`/api/weight?range=${range}`);
      if (res.ok) {
        const data = await res.json();
        setWeightData(data);
        if (data.summary) {
          if (data.summary.currentWeightLbs) {
            setCurrentWeightLbs(data.summary.currentWeightLbs);
          }
          if (data.summary.goalWeightLbs) {
            setGoalWeightLbs(data.summary.goalWeightLbs);
          }
        }
      }
    } catch (err) {
      console.warn("Failed to fetch weight telemetry:", err);
    } finally {
      setIsLoadingWeight(false);
    }
  };

  useEffect(() => {
    document.title = "Progress & Telemetry — StrengthWise AI";
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
              if (data.user?.name) setFullName(data.user.name);
              else if (data.profile.name) setFullName(data.profile.name);
              if (data.profile.weightKg) setCurrentWeightLbs(Math.round(data.profile.weightKg * 2.20462 * 10) / 10);
              if (data.profile.goalWeightKg) setGoalWeightLbs(Math.round(data.profile.goalWeightKg * 2.20462 * 10) / 10);
              if (data.profile.goal) {
                setGoal(data.profile.goal === "LOSE_WEIGHT" ? "CUT" : data.profile.goal === "BUILD_MUSCLE" ? "BULK" : "MAINTAIN");
              }
              if (data.profile.splitDays) setUserSplitDays(data.profile.splitDays);
            }
          }

          // Fetch weight logs
          await fetchWeightTelemetry("ALL");
        }

        if (typeof window !== "undefined") {
          const stored = localStorage.getItem("sw_athlete_profile");
          if (stored) {
            const p = JSON.parse(stored);
            if (p.isCompleted || p.age || p.weightLbs) {
              setHasProfile(true);
              if (p.fullName) setFullName(p.fullName);
              if (p.weightLbs) setCurrentWeightLbs(p.weightLbs);
              if (p.goalWeightLbs) setGoalWeightLbs(p.goalWeightLbs);
              if (p.goal) setGoal(p.goal);
              if (p.splitDays) setUserSplitDays(p.splitDays);
            }
          }
        }
      } catch (err) {
        console.warn("Error loading progress telemetry:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [supabase]);

  // Handle range switch
  const handleRangeChange = (range: "7D" | "30D" | "90D" | "ALL") => {
    setSelectedRange(range);
    fetchWeightTelemetry(range);
  };

  // Open modal with prefilled current weight
  const openLogModal = () => {
    setWeightInput(currentWeightLbs ? String(currentWeightLbs) : "185");
    setWeightUnit("LBS");
    setLogDateInput(new Date().toISOString().split("T")[0]);
    setNoteInput("");
    setIsLogModalOpen(true);
  };

  // Save new weight entry
  const handleSaveWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedVal = parseFloat(weightInput);
    if (!parsedVal || isNaN(parsedVal) || parsedVal <= 0) {
      alert("Please enter a valid weight number.");
      return;
    }

    setIsSavingWeight(true);
    try {
      const payload: { weightLbs?: number; weightKg?: number; note?: string; loggedAt: string } = {
        loggedAt: logDateInput || new Date().toISOString(),
        note: noteInput.trim() || undefined,
      };

      if (weightUnit === "LBS") {
        payload.weightLbs = Math.round(parsedVal * 10) / 10;
      } else {
        payload.weightKg = Math.round(parsedVal * 10) / 10;
      }

      const res = await fetch("/api/weight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsLogModalOpen(false);
        showToast("✓ Weigh-in recorded and calibrated!");
        await fetchWeightTelemetry(selectedRange);
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to record weigh-in.");
      }
    } catch (err) {
      console.error("Error logging weight:", err);
      alert("Network error while recording weight.");
    } finally {
      setIsSavingWeight(false);
    }
  };

  // Delete an existing weight log
  const handleDeleteWeight = async (id: string) => {
    if (!confirm("Are you sure you want to delete this weigh-in entry?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/weight?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Weigh-in entry deleted.");
        await fetchWeightTelemetry(selectedRange);
      } else {
        alert("Failed to delete log entry.");
      }
    } catch (err) {
      console.error("Error deleting weight log:", err);
    } finally {
      setDeletingId(null);
    }
  };

  // Active metrics calculation
  const summary = weightData?.summary;
  const activeCurrentWeight = summary?.currentWeightLbs ?? currentWeightLbs;
  const activeGoalWeight = summary?.goalWeightLbs ?? goalWeightLbs;
  const weightDelta = Math.round(Math.abs(activeCurrentWeight - activeGoalWeight) * 10) / 10;
  const netChange = summary?.totalChangeLbs ?? 0;
  const weeklyRate = summary?.weeklyRateLbs ?? 0;
  const projectedWeeks = summary?.projectedWeeks;
  const convergencePercent = summary?.convergencePercent ?? 82;

  // Chart data
  const chartData = useMemo(() => {
    if (weightData?.chartData && weightData.chartData.length > 0) {
      return weightData.chartData.map((pt) => ({
        date: pt.date,
        "Actual Weight": pt.weight,
        "Goal Target": pt.goal,
      }));
    }
    // Baseline fallback if data hasn't finished loading yet
    return [
      { date: "Start", "Actual Weight": activeCurrentWeight, "Goal Target": activeGoalWeight },
      { date: "Current", "Actual Weight": activeCurrentWeight, "Goal Target": activeGoalWeight },
    ];
  }, [weightData, activeCurrentWeight, activeGoalWeight]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-10 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 rounded-xl bg-emerald-500/95 px-4 py-2.5 text-xs font-bold text-neutral-950 shadow-2xl backdrop-blur-md animate-in slide-in-from-top duration-200">
          <CheckCircle2 className="h-4 w-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="border-b border-neutral-800/80 pb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-400">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Telemetry &amp; Telemetry Analytics</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Progress Telemetry &amp; Strength Analytics
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400">
            Track your weekly volume adherence, estimated 1-Rep Max curves, and nutritional compliance in real time.
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
              <h3 className="text-sm font-bold text-white">Baseline Telemetry Active</h3>
              <p className="text-xs text-neutral-300 mt-0.5">
                Complete your athlete profile biometrics and goal weight to unlock customized 1RM curves and body composition forecasting.
              </p>
            </div>
          </div>
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-neutral-950 hover:bg-amber-400 transition shrink-0"
          >
            <span>Complete Profile Settings</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* WEIGHT OVER TIME & GOAL CONVERGENCE FEATURE */}
      <Card className="bg-neutral-900/70 border-neutral-800 p-6 sm:p-8 space-y-6">
        {/* Header with Title, Goal Tag, and Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800/80 pb-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs uppercase font-mono tracking-wider text-emerald-400 font-bold">
              <Scale className="h-4 w-4" />
              <span>Body Composition Telemetry</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <span>Weight Over Time &amp; Goal Convergence</span>
            </h2>
            <p className="text-xs text-neutral-400">
              Biometric check-in trendline calibrated against your target weight curve.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Goal Badge */}
            <span className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-xs font-mono font-semibold text-emerald-400">
              {goal === "CUT"
                ? "Fat Loss Target (Cut)"
                : goal === "BULK"
                ? "Hypertrophy Surplus (Bulk)"
                : "Maintenance (Recomp)"}
            </span>

            {/* Log Weigh-In Button */}
            <button
              onClick={openLogModal}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-neutral-950 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 transition active:scale-95"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Log Weigh-in</span>
            </button>
          </div>
        </div>

        {/* 4 Interactive KPI Metric Pillars */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Current Scale Weight */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-4 space-y-1">
            <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider flex items-center justify-between">
              <span>Current Weight</span>
              <Scale className="h-3.5 w-3.5 text-neutral-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono flex items-baseline gap-1">
              <span>{activeCurrentWeight}</span>
              <span className="text-xs text-neutral-500 font-normal">lbs</span>
            </div>
            <div className="text-[10px] text-neutral-400 font-mono">
              {Math.round(activeCurrentWeight / 2.20462 * 10) / 10} kg metric
            </div>
          </div>

          {/* Target Calibrated Weight */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-4 space-y-1">
            <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider flex items-center justify-between">
              <span>Goal Target</span>
              <Target className="h-3.5 w-3.5 text-cyan-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-cyan-400 font-mono flex items-baseline gap-1">
              <span>{activeGoalWeight}</span>
              <span className="text-xs text-neutral-500 font-normal">lbs</span>
            </div>
            <div className="text-[10px] text-cyan-400/80 font-mono">
              {weightDelta === 0 ? "Target reached! 🎉" : `${weightDelta} lbs to target`}
            </div>
          </div>

          {/* Net Change Since Baseline */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-4 space-y-1">
            <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider flex items-center justify-between">
              <span>Total Trajectory</span>
              {netChange <= 0 ? (
                <TrendingDown className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <TrendingUp className="h-3.5 w-3.5 text-amber-400" />
              )}
            </div>
            <div
              className={`text-2xl sm:text-3xl font-black font-mono flex items-baseline gap-1 ${
                netChange === 0
                  ? "text-neutral-300"
                  : goal === "CUT"
                  ? netChange < 0
                    ? "text-emerald-400"
                    : "text-amber-400"
                  : netChange > 0
                  ? "text-emerald-400"
                  : "text-neutral-300"
              }`}
            >
              <span>{netChange > 0 ? `+${netChange}` : `${netChange}`}</span>
              <span className="text-xs text-neutral-500 font-normal">lbs</span>
            </div>
            <div className="text-[10px] text-neutral-400 font-mono">
              {netChange === 0 ? "Baseline calibrated" : "since tracking started"}
            </div>
          </div>

          {/* Weekly Velocity / Goal Projection */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-4 space-y-1">
            <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider flex items-center justify-between">
              <span>Pace Velocity</span>
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono flex items-baseline gap-1">
              <span>{weeklyRate !== 0 ? `${weeklyRate > 0 ? "+" : ""}${weeklyRate}` : "~0.0"}</span>
              <span className="text-xs text-neutral-500 font-normal">lbs/wk</span>
            </div>
            <div className="text-[10px] text-neutral-400 font-mono truncate">
              {projectedWeeks
                ? `Est. ${projectedWeeks} wks to goal`
                : weightDelta === 0
                ? "Target achieved"
                : "Tracking velocity"}
            </div>
          </div>
        </div>

        {/* Goal Convergence Progress Bar */}
        <div className="rounded-2xl border border-neutral-800/80 bg-neutral-950/60 p-4 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-1.5 text-neutral-300 font-medium">
              <Target className="h-3.5 w-3.5 text-emerald-400" />
              <span>Goal Convergence Progress</span>
            </div>
            <span className="font-mono text-emerald-400 font-bold">
              {convergencePercent}% on track
            </span>
          </div>
          <ProgressBar value={convergencePercent} color="emerald" className="h-2 rounded-full" />
          <div className="flex justify-between text-[10px] text-neutral-500 font-mono pt-0.5">
            <span>Starting: {summary?.startingWeightLbs ?? activeCurrentWeight} lbs</span>
            <span>Target: {activeGoalWeight} lbs</span>
          </div>
        </div>

        {/* Interactive Weight Over Time Area Chart */}
        <div className="space-y-3 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <span className="text-neutral-300 font-semibold">Actual Weight</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
                <span className="text-neutral-400">Target Goal</span>
              </div>
            </div>

            {/* Range Toggle Buttons */}
            <div className="flex items-center gap-1 rounded-xl bg-neutral-950/90 border border-neutral-800 p-1 self-start sm:self-auto">
              {(["7D", "30D", "90D", "ALL"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => handleRangeChange(r)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-mono font-semibold transition ${
                    selectedRange === r
                      ? "bg-neutral-800 text-white shadow-sm"
                      : "text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Area Chart Component */}
          <div className="rounded-2xl border border-neutral-800/80 bg-neutral-950/70 p-4">
            <AreaChart
              data={chartData}
              index="date"
              categories={["Actual Weight", "Goal Target"]}
              colors={["#10b981", "#06b6d4"]}
              autoDomain={true}
              showGridLines={true}
              valueFormatter={(v) => `${v} lbs`}
              className="h-64 sm:h-72 w-full"
            />
          </div>
        </div>

        {/* History Accordion / Management */}
        <div className="pt-2 border-t border-neutral-800/80">
          <button
            onClick={() => setShowHistory((prev) => !prev)}
            className="w-full flex items-center justify-between text-xs text-neutral-400 hover:text-neutral-200 font-mono py-1 transition"
          >
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-neutral-500" />
              <span>Weigh-in History ({weightData?.logs?.length || 0} recorded logs)</span>
            </div>
            {showHistory ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {showHistory && (
            <div className="mt-4 space-y-2 animate-in fade-in duration-200">
              {weightData?.logs && weightData.logs.length > 0 ? (
                <div className="divide-y divide-neutral-800/60 rounded-xl border border-neutral-800 bg-neutral-950/80 overflow-hidden max-h-64 overflow-y-auto">
                  {weightData.logs.map((log) => {
                    const logDate = new Date(log.loggedAt).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });
                    return (
                      <div
                        key={log.id}
                        className="flex items-center justify-between px-4 py-3 hover:bg-neutral-900/50 transition text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white font-mono">{log.weightLbs} lbs</span>
                            <span className="text-neutral-500 font-mono text-[11px]">({log.weightKg} kg)</span>
                            {log.note && (
                              <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] text-neutral-300">
                                {log.note}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-neutral-500">{logDate}</div>
                        </div>

                        <button
                          onClick={() => handleDeleteWeight(log.id)}
                          disabled={deletingId === log.id}
                          className="p-1.5 text-neutral-500 hover:text-rose-400 transition rounded-lg hover:bg-rose-500/10 disabled:opacity-50"
                          title="Delete entry"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-6 text-center text-xs text-neutral-500 space-y-1">
                  <p>No historical weigh-ins logged yet.</p>
                  <p className="text-[11px] text-neutral-400">
                    Click &ldquo;Log Weigh-in&rdquo; to start tracking your daily or weekly weight progression!
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>


      {/* QUICK LOG WEIGH-IN MODAL */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                  <Scale className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Log Body Weight</h3>
                  <p className="text-[11px] text-neutral-400">Check-in and update your goal trajectory curve</p>
                </div>
              </div>
              <button
                onClick={() => setIsLogModalOpen(false)}
                className="rounded-lg p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Weigh-in Form */}
            <form onSubmit={handleSaveWeight} className="space-y-4">
              {/* Weight Value Input + Unit Toggle */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300">
                  Scale Weight
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min="50"
                    max="700"
                    required
                    value={weightInput}
                    onChange={(e) => setWeightInput(e.target.value)}
                    placeholder="e.g. 184.5"
                    className="flex-1 rounded-xl border border-neutral-700 bg-neutral-950 px-3.5 py-2.5 text-lg font-mono font-bold text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
                  />
                  {/* Unit Toggle */}
                  <div className="flex rounded-xl bg-neutral-950 border border-neutral-700 p-1">
                    <button
                      type="button"
                      onClick={() => setWeightUnit("LBS")}
                      className={`rounded-lg px-3 py-1.5 text-xs font-mono font-bold transition ${
                        weightUnit === "LBS"
                          ? "bg-emerald-500 text-neutral-950 shadow-sm"
                          : "text-neutral-400 hover:text-neutral-200"
                      }`}
                    >
                      LBS
                    </button>
                    <button
                      type="button"
                      onClick={() => setWeightUnit("KG")}
                      className={`rounded-lg px-3 py-1.5 text-xs font-mono font-bold transition ${
                        weightUnit === "KG"
                          ? "bg-emerald-500 text-neutral-950 shadow-sm"
                          : "text-neutral-400 hover:text-neutral-200"
                      }`}
                    >
                      KG
                    </button>
                  </div>
                </div>
              </div>

              {/* Date Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                  <span>Weigh-in Date</span>
                </label>
                <input
                  type="date"
                  required
                  value={logDateInput}
                  onChange={(e) => setLogDateInput(e.target.value)}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3.5 py-2 text-xs font-mono text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
                />
              </div>

              {/* Note / Context Tags */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-300">
                  Condition / Note (Optional)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {notePresets.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setNoteInput(tag)}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-mono transition ${
                        noteInput === tag
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-neutral-800 text-neutral-400 hover:text-neutral-200 border border-transparent"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder="Or custom note (e.g. fasted morning)..."
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsLogModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingWeight}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-neutral-950 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
                >
                  {isSavingWeight ? (
                    <span>Recording...</span>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Save Weigh-in</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
