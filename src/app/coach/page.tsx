"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Brain,
  CheckCircle2,
  Dumbbell,
  Lock,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Utensils,
  Zap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { calculateNutritionTargets } from "@/lib/calc";
import { CoachChat, type CoachAthleteContext } from "@/components/coach-chat";
import type { User } from "@supabase/supabase-js";

export default function CoachPage() {
  const supabase = createClient();

  const [authUser, setAuthUser] = useState<User | null>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [loading, setLoading] = useState(true);

  // Profile context fields
  const [fullName, setFullName] = useState<string>("");
  const [age, setAge] = useState<number>(26);
  const [gender, setGender] = useState<"MALE" | "FEMALE">("MALE");
  const [heightFt, setHeightFt] = useState<number>(6);
  const [heightIn, setHeightIn] = useState<number>(3);
  const [currentWeightLbs, setCurrentWeightLbs] = useState<number>(185);
  const [goalWeightLbs, setGoalWeightLbs] = useState<number>(175);
  const [goal, setGoal] = useState<"CUT" | "MAINTAIN" | "BULK">("BULK");
  const [activityLevel, setActivityLevel] = useState<string>("MODERATE");
  const [userSplitDays, setUserSplitDays] = useState<number>(4);
  const [userSplitType, setUserSplitType] = useState<string>("Upper / Lower Power & Hypertrophy");
  const [customCalories, setCustomCalories] = useState<number | null>(null);
  const [customProtein, setCustomProtein] = useState<number | null>(null);
  const [customCarbs, setCustomCarbs] = useState<number | null>(null);
  const [customFat, setCustomFat] = useState<number | null>(null);

  // Calculations
  const numWeightLbs = Number(currentWeightLbs) || 185;
  const numWeightKg = numWeightLbs / 2.20462;
  const totalInches = (Number(heightFt) || 6) * 12 + (Number(heightIn) || 0);
  const heightCm = totalInches * 2.54;

  const calculated = useMemo(() => {
    const base = calculateNutritionTargets({
      age: Number(age) || 26,
      gender: gender,
      heightCm: heightCm,
      weightKg: numWeightKg,
      activityLevel: activityLevel,
      goal: goal === "CUT" ? "LOSE_WEIGHT" : goal === "BULK" ? "BUILD_MUSCLE" : "MAINTAIN",
    });

    if (customCalories && customCalories > 500) {
      const diffRatio = customCalories / (base.targetCalories || 2000);
      return {
        ...base,
        targetCalories: customCalories,
        targetProtein: customProtein ? Math.round(customProtein) : base.targetProtein,
        targetCarbs: customCarbs ? Math.round(customCarbs) : Math.max(30, Math.round(base.targetCarbs * diffRatio)),
        targetFat: customFat ? Math.round(customFat) : Math.max(30, Math.round(base.targetFat * diffRatio)),
      };
    }

    return base;
  }, [age, gender, heightCm, numWeightKg, activityLevel, goal, customCalories, customProtein, customCarbs, customFat]);

  const coachAthleteContext: CoachAthleteContext = useMemo(() => ({
    fullName: fullName || (authUser?.email ? authUser.email.split("@")[0] : "Athlete"),
    age: Number(age) || 26,
    gender: gender,
    weightLbs: numWeightLbs,
    weightKg: Math.round(numWeightKg * 10) / 10,
    heightCm: Math.round(heightCm),
    heightFt: Number(heightFt) || 6,
    heightIn: Number(heightIn) || 0,
    goal: goal === "CUT" ? "Fat Loss / Cutting (-20% caloric deficit)" : goal === "BULK" ? "Muscle Growth / Hypertrophy Surplus (+10%)" : "Maintenance / Recomposition",
    activityLevel: activityLevel,
    splitType: userSplitType || "Upper / Lower Power & Hypertrophy",
    splitDays: userSplitDays || 4,
    targetCalories: calculated.targetCalories,
    targetProtein: calculated.targetProtein,
    targetCarbs: calculated.targetCarbs,
    targetFat: calculated.targetFat,
  }), [fullName, authUser, numWeightLbs, numWeightKg, heightCm, heightFt, heightIn, age, gender, goal, activityLevel, userSplitType, userSplitDays, calculated]);

  useEffect(() => {
    document.title = "AI Sports Science Coach — StrengthWise AI";
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
              if (data.profile.splitDays) setUserSplitDays(data.profile.splitDays);
              if (data.profile.splitType) setUserSplitType(data.profile.splitType);
              if (data.profile.targetCalories) setCustomCalories(data.profile.targetCalories);
              if (data.profile.targetProtein) setCustomProtein(data.profile.targetProtein);
              if (data.profile.targetCarbs) setCustomCarbs(data.profile.targetCarbs);
              if (data.profile.targetFat) setCustomFat(data.profile.targetFat);
            }
          }
        }

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
              if (p.splitDays) setUserSplitDays(p.splitDays);
              if (p.splitType) setUserSplitType(p.splitType);
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
        console.warn("Error loading coach profile context:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();

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
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800/80 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Autonomous Intelligence</span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-300 font-mono">
              <span>📸 Computer Vision Enabled</span>
            </div>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            24/7 AI Strength &amp; Nutrition Specialist
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400">
            Live interactive consultation with Computer Vision. Upload lift photos, food labels, and gym machines for instant biomechanical form checks and peri-workout fueling prescriptions.
          </p>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-950/30 px-3 py-2 text-xs font-mono text-emerald-400 self-start sm:self-auto">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span>Vision &amp; Sports Science Engine Ready</span>
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
              <h3 className="text-sm font-bold text-white">Default Biometrics Context Loaded</h3>
              <p className="text-xs text-neutral-300 mt-0.5">
                Complete your athlete profile so the AI Coach has your biomechanical context, experience level, and injury history.
              </p>
            </div>
          </div>
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-neutral-950 hover:bg-amber-400 transition shrink-0"
          >
            <span>Complete Athlete Profile</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* Interactive AI Coach Chatbot */}
      <CoachChat athleteContext={coachAthleteContext} hasProfile={hasProfile} />
    </div>
  );
}
