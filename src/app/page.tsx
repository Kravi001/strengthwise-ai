"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  Card,
  Metric,
  Text,
  Title,
  Subtitle,
  Divider,
  ProgressBar,
  BadgeDelta,
  DonutChart,
  Tracker,
} from "@/components/tremor";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Edit3,
  Lock,
  RefreshCw,
  Save,
  Scale,
  Sparkles,
  User as UserIcon,
  Utensils,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { calculateNutritionTargets, type CalculatedTargets } from "@/lib/calc";
import type { User } from "@supabase/supabase-js";

interface ProfileData {
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

export default function HomePage() {
  const [sessionLoading, setSessionLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Form State (internally metric)
  const [unitSystem, setUnitSystem] = useState<"imperial" | "metric">("imperial");
  const [age, setAge] = useState<number | "">(26);
  const [gender, setGender] = useState<string>("MALE");
  const [heightCm, setHeightCm] = useState<number | "">(178);
  const [weightKg, setWeightKg] = useState<number | "">(77);
  const [goalWeightKg, setGoalWeightKg] = useState<number | "">(75);
  const [activityLevel, setActivityLevel] = useState<string>("MODERATE");
  const [goal, setGoal] = useState<string>("BUILD_MUSCLE");
  const [dietPreference, setDietPreference] = useState<string>("STANDARD");
  const [experienceLevel, setExperienceLevel] = useState<string>("INTERMEDIATE");

  // Display fields for Imperial
  const [heightFt, setHeightFt] = useState<number | "">(5);
  const [heightIn, setHeightIn] = useState<number | "">(10);
  const [weightLbs, setWeightLbs] = useState<number | "">(170);
  const [goalWeightLbs, setGoalWeightLbs] = useState<number | "">(165);

  const [saving, startSaveTransition] = useTransition();
  const [statusMsg, setStatusMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const supabase = createClient();

  // Unit synchronization
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

  const updateHeightFromCm = (cm: number) => {
    setHeightCm(cm);
    const totalInches = cm / 2.54;
    setHeightFt(Math.floor(totalInches / 12));
    setHeightIn(Math.round(totalInches % 12));
  };

  const updateWeightFromKg = (kg: number) => {
    setWeightKg(kg);
    setWeightLbs(Math.round(kg * 2.20462));
  };

  const updateGoalWeightFromKg = (kg: number) => {
    setGoalWeightKg(kg);
    setGoalWeightLbs(Math.round(kg * 2.20462));
  };

  // Live scientific calculations
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

  const donutData = [
    { name: "Protein", value: targets.targetProtein, color: "#10b981" },
    { name: "Carbs", value: targets.targetCarbs, color: "#06b6d4" },
    { name: "Fats", value: targets.targetFat, color: "#f59e0b" },
  ];

  const totalMacroCalories = targets.targetCalories || 2000;
  const proteinPercent = Math.round(((targets.targetProtein * 4) / totalMacroCalories) * 100);
  const carbsPercent = Math.round(((targets.targetCarbs * 4) / totalMacroCalories) * 100);
  const fatPercent = Math.round(((targets.targetFat * 9) / totalMacroCalories) * 100);

  // Load user & profile
  const refreshData = async () => {
    try {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      setUser(currentUser);

      if (currentUser) {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const data = await res.json();
          if (data.profile) {
            setProfile(data.profile);
            const p = data.profile;
            if (p.age) setAge(p.age);
            if (p.gender) setGender(p.gender);
            if (p.heightCm) updateHeightFromCm(p.heightCm);
            if (p.weightKg) updateWeightFromKg(p.weightKg);
            if (p.goalWeightKg) updateGoalWeightFromKg(p.goalWeightKg);
            if (p.activityLevel) setActivityLevel(p.activityLevel);
            if (p.goal) setGoal(p.goal);
            if (p.dietPreference) setDietPreference(p.dietPreference);
            if (p.experienceLevel) setExperienceLevel(p.experienceLevel);
          } else {
            setProfile(null);
          }
        }
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.error("Error loading user profile:", err);
    } finally {
      setSessionLoading(false);
    }
  };

  useEffect(() => {
    refreshData();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setProfile(null);
      } else {
        refreshData();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Google sign in shortcut
  const handleGoogleSignIn = async () => {
    const origin = window.location.origin;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    });
  };

  // Save profile
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    if (!user) {
      // Redirect to login if unauthenticated
      window.location.href = "/login";
      return;
    }

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
          throw new Error(result.error || "Failed to save profile.");
        }

        setProfile(result.profile);
        setIsEditingProfile(false);
        setStatusMsg({
          type: "success",
          text: "Profile created! Your athlete dashboard is now unlocked.",
        });
      } catch (err: unknown) {
        setStatusMsg({
          type: "error",
          text:
            err instanceof Error ? err.message : "An unexpected error occurred.",
        });
      }
    });
  };

  if (sessionLoading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-neutral-400">
          <RefreshCw className="h-5 w-5 animate-spin text-emerald-400" />
          <span>Loading StrengthWise...</span>
        </div>
      </div>
    );
  }

  // CONDITION: If profile is not created yet (or user clicked "Edit Profile"), SHOW ONLY THE TREMOR PROFILE SETUP!
  const showProfileSetup = !user || !profile || isEditingProfile;

  if (showProfileSetup) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-0.5 text-xs font-medium text-emerald-400 mb-2">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Step 1: Athlete Setup</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {profile ? "Edit Your Athlete Profile" : "Create Your Athlete Profile"}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1">
              {user ? (
                <>
                  Signed in as <span className="text-emerald-400 font-mono">{user.email}</span>. Complete your profile to unlock your dashboard.
                </>
              ) : (
                "Set your metrics and dietary goals to unlock your personalized training dashboard."
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start">
            {profile && (
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-300 hover:text-white"
              >
                Back to Dashboard
              </button>
            )}

            {/* Unit Toggle */}
            <div className="flex items-center gap-1 rounded-xl bg-neutral-900 p-1 border border-neutral-800">
              <button
                type="button"
                onClick={() => setUnitSystem("imperial")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  unitSystem === "imperial"
                    ? "bg-emerald-500 text-neutral-950 shadow-sm shadow-emerald-500/20"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                Imperial (lbs, ft)
              </button>
              <button
                type="button"
                onClick={() => setUnitSystem("metric")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  unitSystem === "metric"
                    ? "bg-emerald-500 text-neutral-950 shadow-sm shadow-emerald-500/20"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                Metric (kg, cm)
              </button>
            </div>
          </div>
        </div>

        {/* Authentication Notice if not signed in */}
        {!user && (
          <Card decoration="left" decorationColor="emerald" className="bg-emerald-950/20 border-emerald-900/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <Title className="text-white flex items-center gap-2">
                  <Lock className="h-4 w-4 text-emerald-400" />
                  Sign In Required to Save Your Profile
                </Title>
                <Text className="text-neutral-300 text-xs sm:text-sm">
                  Sign in through Supabase with Google or Email so your profile is saved to PostgreSQL.
                </Text>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="inline-flex items-center gap-2 rounded-xl border border-neutral-700 bg-neutral-800 px-3.5 py-2 text-xs font-medium text-white hover:bg-neutral-700 transition"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span>Google</span>
                </button>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-neutral-950 hover:bg-emerald-400 transition"
                >
                  <UserIcon className="h-3.5 w-3.5" />
                  <span>Email Sign In</span>
                </Link>
              </div>
            </div>
          </Card>
        )}

        {statusMsg && (
          <div
            className={`flex items-center gap-2.5 rounded-xl border p-4 text-sm ${
              statusMsg.type === "success"
                ? "border-emerald-900/40 bg-emerald-950/30 text-emerald-300"
                : "border-red-900/40 bg-red-950/30 text-red-300"
            }`}
          >
            {statusMsg.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Profile Setup Form & Live Tremor Calculations */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Form Column */}
          <form onSubmit={handleSave} className="lg:col-span-7 space-y-6">
            {/* Card 1: Physical Measurements */}
            <Card decoration="top" decorationColor="emerald">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <Title className="flex items-center gap-2">
                    <Scale className="h-4 w-4 text-emerald-400" />
                    Physical Measurements
                  </Title>
                  <Subtitle>Body stats for Mifflin-St Jeor metabolic calculation</Subtitle>
                </div>
                <span className="rounded-md bg-neutral-800 px-2 py-0.5 text-[11px] font-mono text-neutral-300">
                  {unitSystem.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Age */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-300">Age</label>
                  <input
                    type="number"
                    min={12}
                    max={120}
                    value={age}
                    onChange={(e) =>
                      setAge(e.target.value ? parseInt(e.target.value, 10) : "")
                    }
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-2.5 px-3 text-sm text-neutral-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* Gender */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-300">Biological Sex</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-2.5 px-3 text-sm text-neutral-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="MALE">Male (Mifflin +5)</option>
                    <option value="FEMALE">Female (Mifflin -161)</option>
                    <option value="OTHER">Other / Non-binary</option>
                  </select>
                </div>

                {/* Height */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-300">
                    Height {unitSystem === "imperial" ? "(ft / in)" : "(cm)"}
                  </label>
                  {unitSystem === "imperial" ? (
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="Feet"
                        min={3}
                        max={8}
                        value={heightFt}
                        onChange={(e) => {
                          const val = e.target.value ? parseInt(e.target.value, 10) : 0;
                          updateHeightFromFtIn(val, Number(heightIn) || 0);
                        }}
                        className="rounded-xl border border-neutral-800 bg-neutral-950 py-2.5 px-3 text-sm text-neutral-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      <input
                        type="number"
                        placeholder="Inches"
                        min={0}
                        max={11}
                        value={heightIn}
                        onChange={(e) => {
                          const val = e.target.value ? parseInt(e.target.value, 10) : 0;
                          updateHeightFromFtIn(Number(heightFt) || 0, val);
                        }}
                        className="rounded-xl border border-neutral-800 bg-neutral-950 py-2.5 px-3 text-sm text-neutral-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  ) : (
                    <input
                      type="number"
                      min={100}
                      max={250}
                      value={heightCm}
                      onChange={(e) => {
                        const val = e.target.value ? parseFloat(e.target.value) : 0;
                        updateHeightFromCm(val);
                      }}
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-2.5 px-3 text-sm text-neutral-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  )}
                </div>

                {/* Weight */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-300">
                    Current Bodyweight {unitSystem === "imperial" ? "(lbs)" : "(kg)"}
                  </label>
                  {unitSystem === "imperial" ? (
                    <input
                      type="number"
                      min={50}
                      max={600}
                      value={weightLbs}
                      onChange={(e) => {
                        const val = e.target.value ? parseFloat(e.target.value) : 0;
                        updateWeightFromLbs(val);
                      }}
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-2.5 px-3 text-sm text-neutral-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  ) : (
                    <input
                      type="number"
                      min={25}
                      max={300}
                      value={weightKg}
                      onChange={(e) => {
                        const val = e.target.value ? parseFloat(e.target.value) : 0;
                        updateWeightFromKg(val);
                      }}
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-2.5 px-3 text-sm text-neutral-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  )}
                </div>

                {/* Goal Weight */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-medium text-neutral-300">
                    Target Goal Weight {unitSystem === "imperial" ? "(lbs)" : "(kg)"}
                  </label>
                  {unitSystem === "imperial" ? (
                    <input
                      type="number"
                      min={50}
                      max={600}
                      value={goalWeightLbs}
                      onChange={(e) => {
                        const val = e.target.value ? parseFloat(e.target.value) : 0;
                        updateGoalWeightFromLbs(val);
                      }}
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-2.5 px-3 text-sm text-neutral-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  ) : (
                    <input
                      type="number"
                      min={25}
                      max={300}
                      value={goalWeightKg}
                      onChange={(e) => {
                        const val = e.target.value ? parseFloat(e.target.value) : 0;
                        updateGoalWeightFromKg(val);
                      }}
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-2.5 px-3 text-sm text-neutral-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  )}
                </div>
              </div>
            </Card>

            {/* Card 2: Training & Dietary Strategy */}
            <Card decoration="top" decorationColor="cyan">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <Title className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-cyan-400" />
                    Training & Dietary Strategy
                  </Title>
                  <Subtitle>Macro distribution and energy balance targets</Subtitle>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Goal */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-300">Primary Goal</label>
                  <select
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-2.5 px-3 text-sm text-neutral-100 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  >
                    <option value="LOSE_WEIGHT">Fat Loss (-500 kcal Deficit)</option>
                    <option value="MAINTAIN">Maintain / Recomposition (0 kcal)</option>
                    <option value="BUILD_MUSCLE">Muscle Hypertrophy (+300 kcal Surplus)</option>
                  </select>
                </div>

                {/* Activity Level */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-300">Activity Level</label>
                  <select
                    value={activityLevel}
                    onChange={(e) => setActivityLevel(e.target.value)}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-2.5 px-3 text-sm text-neutral-100 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  >
                    <option value="SEDENTARY">Sedentary (Desk work, little exercise)</option>
                    <option value="LIGHT">Light Activity (1-3 workout days/wk)</option>
                    <option value="MODERATE">Moderate Activity (3-5 workout days/wk)</option>
                    <option value="ACTIVE">Very Active (6-7 intense days/wk)</option>
                    <option value="VERY_ACTIVE">Athletic / Heavy Physical Labor</option>
                  </select>
                </div>

                {/* Diet Preference */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-300">Diet Type</label>
                  <select
                    value={dietPreference}
                    onChange={(e) => setDietPreference(e.target.value)}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-2.5 px-3 text-sm text-neutral-100 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  >
                    <option value="STANDARD">Standard Omnivore</option>
                    <option value="VEGETARIAN">Vegetarian</option>
                    <option value="VEGAN">Vegan</option>
                    <option value="KETO">Ketogenic (High Fat, Low Carb)</option>
                  </select>
                </div>

                {/* Experience */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-300">Lifting Experience</label>
                  <select
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-2.5 px-3 text-sm text-neutral-100 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  >
                    <option value="BEGINNER">Beginner (&lt; 1 year)</option>
                    <option value="INTERMEDIATE">Intermediate (1-3 years)</option>
                    <option value="ADVANCED">Advanced (3+ years)</option>
                  </select>
                </div>
              </div>
            </Card>

            {/* Save Button */}
            <button
              type="submit"
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-3.5 text-sm font-semibold text-neutral-950 shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-emerald-500 transition disabled:opacity-50"
            >
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin text-neutral-950" />
                  <span>Saving Profile to PostgreSQL...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>
                    {user ? "Save Athlete Profile & Unlock Dashboard" : "Sign In & Save Profile"}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Right Column: Live Tremor Targets */}
          <div className="lg:col-span-5 space-y-6">
            {/* Calorie Target Card */}
            <Card decoration="top" decorationColor="emerald">
              <div className="flex items-center justify-between">
                <Text>Target Daily Calories</Text>
                <BadgeDelta
                  deltaType={
                    goal === "BUILD_MUSCLE"
                      ? "increase"
                      : goal === "LOSE_WEIGHT"
                      ? "decrease"
                      : "unchanged"
                  }
                >
                  {goal === "BUILD_MUSCLE"
                    ? "+300 kcal"
                    : goal === "LOSE_WEIGHT"
                    ? "-500 kcal"
                    : "Maintenance"}
                </BadgeDelta>
              </div>
              <Metric className="mt-2 text-3xl">
                {targets.targetCalories}{" "}
                <span className="text-sm font-normal text-neutral-400">kcal / day</span>
              </Metric>

              <Divider />

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-neutral-400">Basal Metabolic Rate:</span>
                  <p className="text-sm font-semibold text-neutral-200 mt-0.5">
                    {targets.bmr} kcal
                  </p>
                </div>
                <div>
                  <span className="text-neutral-400">Maintenance TDEE:</span>
                  <p className="text-sm font-semibold text-neutral-200 mt-0.5">
                    {targets.tdee} kcal
                  </p>
                </div>
              </div>
            </Card>

            {/* Tremor Macro Donut Chart & Progress Bars */}
            <Card decoration="top" decorationColor="purple">
              <Title>Calculated Macronutrients</Title>
              <Subtitle>Athletic sports nutrition split</Subtitle>

              {/* Donut Chart */}
              <div className="py-2">
                <DonutChart
                  data={donutData}
                  label="Target Grams"
                  valueFormatter={(v) => `${v}g`}
                />
              </div>

              {/* Macro Progress Bars */}
              <div className="space-y-4 pt-2">
                {/* Protein */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 font-medium text-white">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      Protein ({proteinPercent}%)
                    </span>
                    <span className="font-mono font-semibold text-emerald-400">
                      {targets.targetProtein}g ({targets.targetProtein * 4} kcal)
                    </span>
                  </div>
                  <ProgressBar value={proteinPercent} color="emerald" />
                </div>

                {/* Carbs */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 font-medium text-white">
                      <span className="h-2 w-2 rounded-full bg-cyan-500" />
                      Carbs ({carbsPercent}%)
                    </span>
                    <span className="font-mono font-semibold text-cyan-400">
                      {targets.targetCarbs}g ({targets.targetCarbs * 4} kcal)
                    </span>
                  </div>
                  <ProgressBar value={carbsPercent} color="cyan" />
                </div>

                {/* Fat */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 font-medium text-white">
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                      Fats ({fatPercent}%)
                    </span>
                    <span className="font-mono font-semibold text-amber-400">
                      {targets.targetFat}g ({targets.targetFat * 9} kcal)
                    </span>
                  </div>
                  <ProgressBar value={fatPercent} color="amber" />
                </div>
              </div>

              <Divider />

              <div className="flex items-center gap-2 text-xs text-neutral-400">
                <Utensils className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>
                  Protein targeted at <strong>~2.0g per kg</strong> of body mass.
                </span>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // CONDITION: USER IS SIGNED IN AND PROFILE IS CREATED!
  // UNLOCK THE FULL TREMOR ATHLETE DASHBOARD WITH THEIR REAL DATA!
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-0.5 text-xs font-medium text-emerald-400 mb-2">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Profile Verified</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Athlete Command Center
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Personalized metrics for <span className="text-emerald-400 font-mono">{user?.email}</span>
          </p>
        </div>

        <div className="flex items-center gap-3 self-start">
          <button
            type="button"
            onClick={() => setIsEditingProfile(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2 text-xs font-medium text-neutral-200 hover:bg-neutral-800 hover:text-white transition"
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span>Edit Profile & Targets</span>
          </button>
        </div>
      </div>

      {/* 4 Tremor KPI Cards Powered by Real User Profile Targets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Caloric Budget */}
        <Card decoration="top" decorationColor="emerald">
          <div className="flex items-center justify-between">
            <Text>Target Calories</Text>
            <BadgeDelta
              deltaType={
                profile?.goal === "BUILD_MUSCLE"
                  ? "increase"
                  : profile?.goal === "LOSE_WEIGHT"
                  ? "decrease"
                  : "unchanged"
              }
            >
              {profile?.goal === "BUILD_MUSCLE"
                ? "Surplus"
                : profile?.goal === "LOSE_WEIGHT"
                ? "Deficit"
                : "Maintenance"}
            </BadgeDelta>
          </div>
          <Metric className="mt-2 text-2xl">
            {profile?.targetCalories || targets.targetCalories}{" "}
            <span className="text-sm font-normal text-neutral-400">kcal/day</span>
          </Metric>
          <ProgressBar value={100} color="emerald" className="mt-4" label="Personal target" />
        </Card>

        {/* Protein Target */}
        <Card decoration="top" decorationColor="emerald">
          <div className="flex items-center justify-between">
            <Text>Daily Protein</Text>
            <BadgeDelta deltaType="increase">~2.0g/kg</BadgeDelta>
          </div>
          <Metric className="mt-2 text-2xl">
            {profile?.targetProtein || targets.targetProtein}g
          </Metric>
          <ProgressBar value={100} color="emerald" className="mt-4" label="Muscle hypertrophy" />
        </Card>

        {/* Carbohydrates Target */}
        <Card decoration="top" decorationColor="cyan">
          <div className="flex items-center justify-between">
            <Text>Daily Carbs</Text>
            <BadgeDelta deltaType="moderateIncrease">Energy</BadgeDelta>
          </div>
          <Metric className="mt-2 text-2xl">
            {profile?.targetCarbs || targets.targetCarbs}g
          </Metric>
          <ProgressBar value={100} color="cyan" className="mt-4" label="Glycogen pacing" />
        </Card>

        {/* Dietary Fat Target */}
        <Card decoration="top" decorationColor="amber">
          <div className="flex items-center justify-between">
            <Text>Healthy Fats</Text>
            <BadgeDelta deltaType="unchanged">Balance</BadgeDelta>
          </div>
          <Metric className="mt-2 text-2xl">
            {profile?.targetFat || targets.targetFat}g
          </Metric>
          <ProgressBar value={100} color="amber" className="mt-4" label="Hormonal health" />
        </Card>
      </div>

      {/* Tremor 14-Day Consistency Tracker */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div>
            <Title>14-Day Training & Nutrition Adherence</Title>
            <Subtitle>Track progressive training consistency and rest days</Subtitle>
          </div>
          <div className="flex items-center gap-3 text-xs text-neutral-400">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>Active</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-neutral-700" />
              <span>Rest</span>
            </div>
          </div>
        </div>
        <Tracker
          data={[
            { color: "emerald", tooltip: "Day 1: Setup Completed" },
            { color: "emerald", tooltip: "Day 2: Target Calibrated" },
            { color: "emerald", tooltip: "Day 3: Nutrition Goal Set" },
            { color: "neutral", tooltip: "Day 4: Scheduled Rest" },
            { color: "emerald", tooltip: "Day 5: Session Scheduled" },
            { color: "emerald", tooltip: "Day 6: Hypertrophy" },
            { color: "neutral", tooltip: "Day 7: Active Recovery" },
            { color: "emerald", tooltip: "Day 8: Volume Push" },
            { color: "emerald", tooltip: "Day 9: Volume Pull" },
            { color: "emerald", tooltip: "Day 10: Leg Focus" },
            { color: "emerald", tooltip: "Day 11: Deload Target" },
            { color: "neutral", tooltip: "Day 12: Rest" },
            { color: "emerald", tooltip: "Day 13: Power Day" },
            { color: "emerald", tooltip: "Today: Profile Active" },
          ]}
          className="mt-2"
        />
      </Card>

      {/* Detailed Macro Donut Chart & Profile Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Macro Donut Card */}
        <Card className="lg:col-span-5 flex flex-col justify-between" decoration="top" decorationColor="purple">
          <div>
            <Title>Your Macronutrient Distribution</Title>
            <Subtitle>Total daily nutrition blueprint</Subtitle>
          </div>
          <div className="py-4">
            <DonutChart
              data={[
                { name: "Protein", value: profile?.targetProtein || targets.targetProtein, color: "#10b981" },
                { name: "Carbs", value: profile?.targetCarbs || targets.targetCarbs, color: "#06b6d4" },
                { name: "Fats", value: profile?.targetFat || targets.targetFat, color: "#f59e0b" },
              ]}
              label="Target Grams"
              valueFormatter={(v) => `${v}g`}
            />
          </div>
          <div className="rounded-xl border border-neutral-800/80 bg-neutral-950/60 p-3 text-xs text-neutral-400 flex items-center gap-2">
            <Utensils className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>Targeting {profile?.dietPreference || "STANDARD"} diet strategy.</span>
          </div>
        </Card>

        {/* Profile Attributes Card */}
        <Card className="lg:col-span-7 flex flex-col justify-between" decoration="top" decorationColor="cyan">
          <div>
            <div className="flex items-center justify-between">
              <Title>Athlete Profile Summary</Title>
              <span className="rounded-md border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-0.5 text-xs font-semibold text-cyan-400">
                {profile?.goal || "BUILD_MUSCLE"}
              </span>
            </div>
            <Subtitle>Stored in PostgreSQL database via Prisma</Subtitle>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-4">
            <div className="rounded-xl border border-neutral-800/80 bg-neutral-950/60 p-3">
              <span className="text-xs text-neutral-400">Current Weight:</span>
              <p className="text-base font-bold text-white mt-0.5">
                {profile?.weightKg} kg{" "}
                <span className="text-xs font-normal text-neutral-400">
                  ({Math.round((profile?.weightKg || 0) * 2.20462)} lbs)
                </span>
              </p>
            </div>

            <div className="rounded-xl border border-neutral-800/80 bg-neutral-950/60 p-3">
              <span className="text-xs text-neutral-400">Goal Weight:</span>
              <p className="text-base font-bold text-emerald-400 mt-0.5">
                {profile?.goalWeightKg} kg{" "}
                <span className="text-xs font-normal text-neutral-400">
                  ({Math.round((profile?.goalWeightKg || 0) * 2.20462)} lbs)
                </span>
              </p>
            </div>

            <div className="rounded-xl border border-neutral-800/80 bg-neutral-950/60 p-3">
              <span className="text-xs text-neutral-400">Height:</span>
              <p className="text-base font-bold text-white mt-0.5">
                {profile?.heightCm} cm
              </p>
            </div>

            <div className="rounded-xl border border-neutral-800/80 bg-neutral-950/60 p-3">
              <span className="text-xs text-neutral-400">Activity Level:</span>
              <p className="text-sm font-semibold text-white mt-0.5">
                {profile?.activityLevel || "MODERATE"}
              </p>
            </div>

            <div className="rounded-xl border border-neutral-800/80 bg-neutral-950/60 p-3">
              <span className="text-xs text-neutral-400">Experience:</span>
              <p className="text-sm font-semibold text-white mt-0.5">
                {profile?.experienceLevel || "INTERMEDIATE"}
              </p>
            </div>

            <div className="rounded-xl border border-neutral-800/80 bg-neutral-950/60 p-3">
              <span className="text-xs text-neutral-400">Diet Type:</span>
              <p className="text-sm font-semibold text-white mt-0.5">
                {profile?.dietPreference || "STANDARD"}
              </p>
            </div>
          </div>

          <div className="border-t border-neutral-800 pt-3 flex items-center justify-between text-xs text-neutral-400">
            <span>Ready for Workout Logging & AI Coach</span>
            <button
              onClick={() => setIsEditingProfile(true)}
              className="text-emerald-400 hover:text-emerald-300 font-medium underline"
            >
              Update Metrics
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
