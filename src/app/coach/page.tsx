"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Bot,
  Brain,
  CheckCircle2,
  MessageSquare,
  ShieldCheck,
  Utensils,
  Zap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { calculateNutritionTargets } from "@/lib/calc";
import { CoachChat, type CoachAthleteContext } from "@/components/coach-chat";
import { GuestAuthModal } from "@/components/guest-auth-modal";
import type { User } from "@supabase/supabase-js";
import { PageHeader } from "@/components/page-header";
import { SampleDataBanner } from "@/components/sample-data-banner";

export default function CoachPage() {
  const supabase = createClient();

  const [authUser, setAuthUser] = useState<User | null>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [loading, setLoading] = useState(true);

  // Guest Auth Intercept Modal State
  const [isGuestAuthModalOpen, setIsGuestAuthModalOpen] = useState(false);
  const [guestModalTitle, setGuestModalTitle] = useState("Create an athlete profile to save coach consultations");
  const [guestModalDescription, setGuestModalDescription] = useState(
    "StrengthWise AI calibrates sports science coaching, form check vision models, and nutrition analysis to your biometrics."
  );

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
    document.title = "AI Coach — StrengthWise";
    async function loadData() {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        setAuthUser(currentUser);

        if (!currentUser) {
          setHasProfile(false);
          setLoading(false);
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
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-150 ease-out">
      <PageHeader
        title="AI Coach"
        description="Ask about training, nutrition, or exercise swaps. Tell it what you ate and it can log the meal for you."
      />

      {!hasProfile && !loading && (
        <SampleDataBanner
          message="Create a profile so the coach knows your weight, goal, experience and injuries."
          redirectPath="/coach"
        />
      )}

      {/* Interactive AI Coach Chatbot */}
      <CoachChat athleteContext={coachAthleteContext} hasProfile={hasProfile} />

      {/* Guest Athlete Profile Intercept Modal */}
      <GuestAuthModal
        isOpen={isGuestAuthModalOpen}
        onClose={() => setIsGuestAuthModalOpen(false)}
        title={guestModalTitle}
        description={guestModalDescription}
        redirectPath="/coach"
      />
    </div>
  );
}
