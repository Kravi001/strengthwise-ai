"use client";

import { useState } from "react";
import {
  Card,
  Metric,
  Text,
  Title,
  Subtitle,
  BadgeDelta,
  ProgressBar,
  Tracker,
  DonutChart,
  AreaChart,
} from "@/components/tremor";
import { Dumbbell, Utensils } from "lucide-react";

export function TremorAthleteDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState<"7d" | "30d">("7d");

  // Mock data for Tremor Macro Donut Chart
  const macroData = [
    { name: "Protein", value: 165, color: "#10b981" }, // emerald
    { name: "Carbs", value: 240, color: "#06b6d4" },   // cyan
    { name: "Fats", value: 65, color: "#f59e0b" },     // amber
  ];

  // Mock data for Tremor Weekly Performance Area Chart
  const performanceData = [
    { day: "Mon", volumeKg: 9200, calories: 2450 },
    { day: "Tue", volumeKg: 11400, calories: 2600 },
    { day: "Wed", volumeKg: 0, calories: 2200 }, // rest day
    { day: "Thu", volumeKg: 13800, calories: 2750 },
    { day: "Fri", volumeKg: 10500, calories: 2500 },
    { day: "Sat", volumeKg: 14200, calories: 2850 },
    { day: "Sun", volumeKg: 0, calories: 2300 }, // rest day
  ];

  // Mock data for Tremor Compliance Tracker
  const trackerData = [
    { color: "emerald" as const, tooltip: "Mon: Push Day (Completed)" },
    { color: "emerald" as const, tooltip: "Tue: Pull Day (Completed)" },
    { color: "neutral" as const, tooltip: "Wed: Rest & Recovery" },
    { color: "emerald" as const, tooltip: "Thu: Leg Day (Completed)" },
    { color: "emerald" as const, tooltip: "Fri: Upper Power (Completed)" },
    { color: "emerald" as const, tooltip: "Sat: Lower Power (Completed)" },
    { color: "neutral" as const, tooltip: "Sun: Rest Day" },
    { color: "emerald" as const, tooltip: "Mon: Push Volume (Completed)" },
    { color: "emerald" as const, tooltip: "Tue: Pull Volume (Completed)" },
    { color: "amber" as const, tooltip: "Wed: Partial Session (80%)" },
    { color: "emerald" as const, tooltip: "Thu: Leg Day (Completed)" },
    { color: "emerald" as const, tooltip: "Fri: Arm Specialization" },
    { color: "neutral" as const, tooltip: "Sat: Active Rest" },
    { color: "emerald" as const, tooltip: "Today: Scheduled Workout" },
  ];

  return (
    <section className="space-y-6">
      {/* Tremor Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-white">
              Athlete Performance Matrix
            </h2>
            <span className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
              Tremor UI
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Real-time analytics powered by Tremor cards, compliance trackers, and Recharts.
          </p>
        </div>

        {/* Period Switcher */}
        <div className="flex items-center rounded-lg bg-neutral-900 p-1 border border-neutral-800 self-start">
          <button
            onClick={() => setSelectedPeriod("7d")}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
              selectedPeriod === "7d"
                ? "bg-neutral-800 text-white"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setSelectedPeriod("30d")}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
              selectedPeriod === "30d"
                ? "bg-neutral-800 text-white"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            Month View
          </button>
        </div>
      </div>

      {/* 4 Tremor KPI Metric Cards with BadgeDelta & ProgressBar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Calorie Intake */}
        <Card decoration="top" decorationColor="emerald">
          <div className="flex items-center justify-between">
            <Text>Daily Caloric Budget</Text>
            <BadgeDelta deltaType="increase">+4.2%</BadgeDelta>
          </div>
          <Metric className="mt-2 text-2xl">
            2,450 <span className="text-sm font-normal text-neutral-400">/ 2,800 kcal</span>
          </Metric>
          <ProgressBar value={87.5} color="emerald" className="mt-4" label="87% consumed" />
        </Card>

        {/* Protein Target */}
        <Card decoration="top" decorationColor="emerald">
          <div className="flex items-center justify-between">
            <Text>Protein Adherence</Text>
            <BadgeDelta deltaType="moderateIncrease">+12g</BadgeDelta>
          </div>
          <Metric className="mt-2 text-2xl">
            165g <span className="text-sm font-normal text-neutral-400">/ 180g</span>
          </Metric>
          <ProgressBar value={91.6} color="emerald" className="mt-4" label="92% target" />
        </Card>

        {/* Total Lift Volume */}
        <Card decoration="top" decorationColor="cyan">
          <div className="flex items-center justify-between">
            <Text>Weekly Workload</Text>
            <BadgeDelta deltaType="increase">+8.5%</BadgeDelta>
          </div>
          <Metric className="mt-2 text-2xl">59,100 kg</Metric>
          <ProgressBar value={78} color="cyan" className="mt-4" label="Overload pace" />
        </Card>

        {/* Active Streak */}
        <Card decoration="top" decorationColor="purple">
          <div className="flex items-center justify-between">
            <Text>Workout Streak</Text>
            <BadgeDelta deltaType="increase">18 Days</BadgeDelta>
          </div>
          <Metric className="mt-2 text-2xl">18 / 21 Days</Metric>
          <ProgressBar value={85.7} color="purple" className="mt-4" label="86% consistency" />
        </Card>
      </div>

      {/* Tremor 14-Day Workout Consistency Tracker */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div>
            <Title>14-Day Workout & Nutrition Adherence</Title>
            <Subtitle>Track progressive training consistency and rest days</Subtitle>
          </div>
          <div className="flex items-center gap-3 text-xs text-neutral-400">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span>Partial</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-neutral-700" />
              <span>Rest</span>
            </div>
          </div>
        </div>
        <Tracker data={trackerData} className="mt-2" />
      </Card>

      {/* Tremor Charts Grid: Donut Macro Chart + Volume Area Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Macro Distribution Donut Chart */}
        <Card className="lg:col-span-1 flex flex-col justify-between">
          <div>
            <Title>Macronutrient Breakdown</Title>
            <Subtitle>Daily macro split distribution</Subtitle>
          </div>
          <div className="py-4">
            <DonutChart
              data={macroData}
              label="Total Grams"
              valueFormatter={(v) => `${v}g`}
            />
          </div>
          <div className="rounded-xl border border-neutral-800/80 bg-neutral-950/60 p-3 text-xs text-neutral-400 flex items-center gap-2">
            <Utensils className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>High protein allocation to support muscle hypertrophy.</span>
          </div>
        </Card>

        {/* Weekly Volume Progression Area Chart */}
        <Card className="lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <Title>Weekly Volume Load Progression</Title>
              <Subtitle>Total tonnage lifted (kg) per training day</Subtitle>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
              <Dumbbell className="h-3.5 w-3.5" />
              <span>Peak: 14,200 kg</span>
            </div>
          </div>
          <div className="py-4">
            <AreaChart
              data={performanceData}
              index="day"
              categories={["volumeKg"]}
              colors={["#10b981"]}
              valueFormatter={(v) => `${v.toLocaleString()} kg`}
            />
          </div>
          <div className="border-t border-neutral-800 pt-3 flex items-center justify-between text-xs text-neutral-400">
            <span>Optimal progressive overload curve detected</span>
            <span className="text-emerald-400 font-medium">Next: Lower Hypertrophy</span>
          </div>
        </Card>
      </div>
    </section>
  );
}
