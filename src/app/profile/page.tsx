"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, Title, Subtitle, Text, Divider, DonutChart } from "@/components/tremor";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  Check,
  CheckCircle2,
  ChevronRight,
  Dumbbell,
  Eye,
  EyeOff,
  Flame,
  Gauge,
  HeartPulse,
  Info,
  Layers,
  LayoutDashboard,
  LineChart,
  Lock,
  LogOut,
  Mail,
  MailCheck,
  RefreshCw,
  Scale,
  Save,
  ShieldCheck,
  Sparkles,
  Target,
  User as UserIcon,
  Utensils,
  Zap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { TremorAppShell } from "@/components/dashboard/tremor-app-shell";
import { calculateNutritionTargets, type CalculatedTargets } from "@/lib/calc";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";

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

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewingDashboard, setViewingDashboard] = useState(false);

  // Active onboarding step: 1 = Body/Anthropometrics, 2 = Training/Goal, 3 = Nutrition/Diet
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [showAllSteps, setShowAllSteps] = useState(false);

  // Form unit system
  const [unitSystem, setUnitSystem] = useState<"IMPERIAL" | "METRIC">("IMPERIAL");

  // Profile Form Fields (with clinical defaults)
  const [age, setAge] = useState<number>(26);
  const [gender, setGender] = useState<"MALE" | "FEMALE">("MALE");
  const [heightFt, setHeightFt] = useState<number>(5);
  const [heightIn, setHeightIn] = useState<number>(10);
  const [heightCm, setHeightCm] = useState<number>(178);
  const [weightLbs, setWeightLbs] = useState<number>(175);
  const [weightKg, setWeightKg] = useState<number>(79.4);
  const [goalWeightLbs, setGoalWeightLbs] = useState<number>(180);
  const [goalWeightKg, setGoalWeightKg] = useState<number>(81.6);
  const [activityLevel, setActivityLevel] = useState<string>("MODERATE");
  const [goal, setGoal] = useState<string>("BUILD_MUSCLE");
  const [dietPreference, setDietPreference] = useState<string>("HIGH_PROTEIN");
  const [experienceLevel, setExperienceLevel] = useState<string>("INTERMEDIATE");

  // Save state
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState<string | null>(null);

  // Login / Registration Form State
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [emailConfirmationSent, setEmailConfirmationSent] = useState(false);
  const [resending, setResending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const supabase = createClient();

  // Load authenticated session & existing profile
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
            const p: ProfileData = data.profile;
            setProfile(p);

            if (p.age) setAge(p.age);
            if (p.gender) setGender(p.gender.toUpperCase() === "FEMALE" ? "FEMALE" : "MALE");
            if (p.heightCm) {
              setHeightCm(Math.round(p.heightCm));
              const totalInches = p.heightCm / 2.54;
              setHeightFt(Math.floor(totalInches / 12));
              setHeightIn(Math.round(totalInches % 12));
            }
            if (p.weightKg) {
              setWeightKg(Math.round(p.weightKg * 10) / 10);
              setWeightLbs(Math.round(p.weightKg * 2.20462));
            }
            if (p.goalWeightKg) {
              setGoalWeightKg(Math.round(p.goalWeightKg * 10) / 10);
              setGoalWeightLbs(Math.round(p.goalWeightKg * 2.20462));
            }
            if (p.activityLevel) setActivityLevel(p.activityLevel);
            if (p.goal) setGoal(p.goal);
            if (p.dietPreference) setDietPreference(p.dietPreference);
            if (p.experienceLevel) setExperienceLevel(p.experienceLevel);
          }
        }
      }
    } catch (err) {
      console.error("Error loading user profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        setUser(session?.user ?? null);
        if (!session?.user) {
          setProfile(null);
          setViewingDashboard(false);
        } else {
          refreshData();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Derived metric values for calculation
  const currentHeightCm =
    unitSystem === "IMPERIAL"
      ? Math.round((heightFt * 12 + heightIn) * 2.54)
      : heightCm;

  const currentWeightKg =
    unitSystem === "IMPERIAL"
      ? Math.round((weightLbs / 2.20462) * 10) / 10
      : weightKg;

  const currentGoalWeightKg =
    unitSystem === "IMPERIAL"
      ? Math.round((goalWeightLbs / 2.20462) * 10) / 10
      : goalWeightKg;

  // Real-time reactive Mifflin-St Jeor calculation
  const liveTargets: CalculatedTargets = calculateNutritionTargets({
    age,
    gender,
    heightCm: currentHeightCm,
    weightKg: currentWeightKg,
    goalWeightKg: currentGoalWeightKg,
    activityLevel,
    goal,
    dietPreference,
  });

  const chartData = [
    { name: "Protein", value: liveTargets.targetProtein, color: "#10b981" },
    { name: "Carbs", value: liveTargets.targetCarbs, color: "#06b6d4" },
    { name: "Fats", value: liveTargets.targetFat, color: "#f59e0b" },
  ];

  // Save profile to database via API
  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setProfileSaveError(null);
    setProfileSaveSuccess(false);

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          age,
          gender,
          heightCm: currentHeightCm,
          weightKg: currentWeightKg,
          goalWeightKg: currentGoalWeightKg,
          activityLevel,
          goal,
          dietPreference,
          experienceLevel,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to calibrate and save profile.");
      }

      setProfile(data.profile);
      setProfileSaveSuccess(true);
      setTimeout(() => setProfileSaveSuccess(false), 4000);
    } catch (err: unknown) {
      setProfileSaveError(
        err instanceof Error ? err.message : "Failed to save profile."
      );
    } finally {
      setSavingProfile(false);
    }
  };

  // Google OAuth Sign-In
  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setGoogleLoading(true);
    try {
      const origin = window.location.origin;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/auth/callback`,
        },
      });

      if (error) {
        setErrorMsg(error.message);
        setGoogleLoading(false);
      }
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : "Failed to initiate Google sign-in."
      );
      setGoogleLoading(false);
    }
  };

  // Email + Password Submit
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email || !password) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    startTransition(async () => {
      try {
        if (mode === "signup") {
          const origin = window.location.origin;
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: name || email.split("@")[0],
              },
              emailRedirectTo: `${origin}/auth/callback`,
            },
          });

          if (error) {
            setErrorMsg(error.message);
            return;
          }

          if (data.session) {
            setSuccessMsg("Account successfully verified! Loading athlete profile...");
            await refreshData();
          } else {
            setEmailConfirmationSent(true);
          }
        } else {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) {
            if (error.message.toLowerCase().includes("email not confirmed")) {
              setEmailConfirmationSent(true);
              setErrorMsg(
                "Your email is not verified yet. Use 'Instant Verify' below to activate immediately."
              );
            } else {
              setErrorMsg(error.message);
            }
            return;
          }

          if (data.session) {
            await refreshData();
          }
        }
      } catch (err: unknown) {
        setErrorMsg(
          err instanceof Error ? err.message : "Authentication error occurred."
        );
      }
    });
  };

  // Instant Dev Verify Bypass
  const handleInstantVerify = async () => {
    if (!email) return;
    setVerifying(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/auth/dev-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to verify account.");
      }

      setSuccessMsg(data.message);

      if (password) {
        const { data: signData, error: signError } =
          await supabase.auth.signInWithPassword({
            email,
            password,
          });

        if (!signError && signData.session) {
          await refreshData();
          return;
        }
      }

      setEmailConfirmationSent(false);
      setMode("signin");
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : "Verification bypass failed."
      );
    } finally {
      setVerifying(false);
    }
  };

  // Resend Confirmation
  const handleResendConfirmation = async () => {
    if (!email) return;
    setResending(true);
    setErrorMsg(null);
    try {
      const origin = window.location.origin;
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${origin}/auth/callback`,
        },
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccessMsg("Confirmation email requested via Supabase.");
      }
    } catch {
      setErrorMsg("Failed to resend confirmation email.");
    } finally {
      setResending(false);
    }
  };

  // Sign Out
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setViewingDashboard(false);
  };

  // If authenticated user launches full Tremor Dashboard Shell overlay
  if (user && viewingDashboard) {
    return (
      <TremorAppShell
        user={user}
        profile={
          profile || {
            id: "temp",
            userId: user.id,
            age,
            gender,
            heightCm: currentHeightCm,
            weightKg: currentWeightKg,
            goalWeightKg: currentGoalWeightKg,
            activityLevel,
            goal,
            dietPreference,
            experienceLevel,
            targetCalories: liveTargets.targetCalories,
            targetProtein: liveTargets.targetProtein,
            targetCarbs: liveTargets.targetCarbs,
            targetFat: liveTargets.targetFat,
          }
        }
        onProfileUpdated={(updated) => {
          setProfile(updated);
        }}
        onSignOut={handleSignOut}
        onClose={() => setViewingDashboard(false)}
      />
    );
  }

  // Athlete initials
  const athleteInitials = user
    ? (
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email ||
        "SW"
      )
        .slice(0, 2)
        .toUpperCase()
    : "SW";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-10">
      {/* 1. Hero Section — Styled matching the Landing Page Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-neutral-800/80 bg-gradient-to-b from-neutral-900/90 via-neutral-950 to-neutral-950 p-6 sm:p-10 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.14),transparent_60%)] pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-400 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5" />
            <span>
              {user ? "Sports Science Athlete Command Center" : "Intelligent Metabolic Calibration"}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
            {user ? (
              <>
                Athlete Calibration &amp;{" "}
                <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  Command Center
                </span>
              </>
            ) : (
              <>
                Calibrate Your{" "}
                <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  Metabolic Baseline
                </span>
              </>
            )}
          </h1>

          <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed max-w-2xl mx-auto">
            Clinical exercise physiology and metabolic telemetry. We compute your exact Basal Metabolic
            Rate (BMR), Total Daily Energy Expenditure (TDEE), and adaptive macronutrient partitions
            using the clinical Mifflin-St Jeor equation.
          </p>

          {/* Top CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {user ? (
              <>
                <button
                  type="button"
                  onClick={() => setViewingDashboard(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-neutral-950 shadow-lg shadow-emerald-500/25 hover:bg-emerald-400 hover:scale-[1.02] transition active:scale-[0.98]"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Launch Athlete Dashboard</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-2 rounded-xl border border-neutral-700 bg-neutral-900/90 px-4 py-3 text-xs font-semibold text-neutral-300 hover:bg-neutral-800 hover:text-red-400 transition"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <a
                href="#portal-section"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-neutral-950 shadow-lg shadow-emerald-500/25 hover:bg-emerald-400 hover:scale-[1.02] transition active:scale-[0.98]"
              >
                <Lock className="h-4 w-4" />
                <span>Sign In or Create Account</span>
                <ArrowRight className="h-4 w-4" />
              </a>
            )}
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-5 border-t border-neutral-800/80 text-neutral-400 text-[11px] font-medium">
            <div className="flex items-center justify-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Mifflin-St Jeor Math</span>
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-cyan-400" />
              <span>Adaptive Volume</span>
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <LineChart className="h-3.5 w-3.5 text-amber-400" />
              <span>Tremor Telemetry</span>
            </div>
          </div>
        </div>
      </section>

      {/* Authenticated Athlete Identity Bar */}
      {user && (
        <Card decoration="left" decorationColor="emerald" className="bg-neutral-900/60 border-neutral-800 p-5 shadow-xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-left">
              <div className="relative group shrink-0">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 p-0.5 shadow-md shadow-emerald-500/20">
                  <div className="h-full w-full rounded-[14px] bg-neutral-950 flex flex-col items-center justify-center text-white">
                    <span className="text-base font-black bg-gradient-to-br from-emerald-400 to-cyan-300 bg-clip-text text-transparent">
                      {athleteInitials}
                    </span>
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-md bg-emerald-500 text-neutral-950 shadow-sm">
                  <ShieldCheck className="h-3 w-3" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    {user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "Strength Athlete"}
                  </h2>
                  <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                    VERIFIED ATHLETE
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-mono text-neutral-400 text-[11px]">
                    {user.email}
                  </span>
                  <span className="text-neutral-600">&bull;</span>
                  {profile ? (
                    <span className="text-[11px] font-medium text-emerald-400">
                      Profile Active &amp; Synced
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-amber-400">
                      Initial Calibration Incomplete
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setViewingDashboard(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20 transition"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span>Enter Full Dashboard</span>
            </button>
          </div>
        </Card>
      )}

      {/* 2. Onboarding Flow Step Selector & Mode Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-neutral-800 pb-4">
        {/* 3 Step Indicator Tabs */}
        <div className="flex items-center gap-1.5 sm:gap-2 p-1 rounded-2xl bg-neutral-900/80 border border-neutral-800 w-full sm:w-auto overflow-x-auto">
          {[
            { step: 1, label: "1. Body & Anthropometrics", icon: HeartPulse },
            { step: 2, label: "2. Training & Goal", icon: Dumbbell },
            { step: 3, label: "3. Nutrition Protocol", icon: Utensils },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeStep === item.step;
            return (
              <button
                key={item.step}
                type="button"
                onClick={() => {
                  setActiveStep(item.step as 1 | 2 | 3);
                  setShowAllSteps(false);
                }}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition whitespace-nowrap ${
                  isActive && !showAllSteps
                    ? "bg-emerald-500 text-neutral-950 shadow-md shadow-emerald-500/20"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-800/60"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* View All Sections Toggle */}
        <button
          type="button"
          onClick={() => setShowAllSteps(!showAllSteps)}
          className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition self-end sm:self-auto ${
            showAllSteps
              ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
              : "border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:text-white hover:border-neutral-700"
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>{showAllSteps ? "Paging Mode" : "Expand All Sections"}</span>
        </button>
      </div>

      {/* 3. Main Dual-Pane Sports Science Calibration Suite */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Calibration Form Fields (7 cols) */}
        <div className="lg:col-span-7 space-y-6">

          {/* PHASE 1: BODY & ANTHROPOMETRICS */}
          {(showAllSteps || activeStep === 1) && (
            <Card decoration="top" decorationColor="emerald" className="bg-neutral-900/60 border-neutral-800 p-6 sm:p-7 space-y-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
                <div className="space-y-0.5">
                  <Title className="text-white text-lg font-bold flex items-center gap-2">
                    <HeartPulse className="h-5 w-5 text-emerald-400" />
                    <span>Phase 1: Body Anthropometrics</span>
                  </Title>
                  <Text className="text-neutral-400 text-xs">
                    Mifflin-St Jeor metabolic formula variables.
                  </Text>
                </div>

                {/* Unit System Toggle */}
                <div className="flex rounded-xl bg-neutral-950 p-1 border border-neutral-800">
                  <button
                    type="button"
                    onClick={() => setUnitSystem("IMPERIAL")}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                      unitSystem === "IMPERIAL"
                        ? "bg-emerald-500 text-neutral-950 shadow-sm"
                        : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    US (lbs, ft)
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnitSystem("METRIC")}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                      unitSystem === "METRIC"
                        ? "bg-emerald-500 text-neutral-950 shadow-sm"
                        : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    Metric (kg, cm)
                  </button>
                </div>
              </div>

              {/* Biological Sex Cards (MSJ Factor) */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
                  <span>Biological Sex (MSJ Equation Constant)</span>
                  <span className="text-[10px] font-mono text-neutral-500">M: +5 kcal &bull; F: -161 kcal</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setGender("MALE")}
                    className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition ${
                      gender === "MALE"
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500 shadow-md shadow-emerald-500/10"
                        : "border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200"
                    }`}
                  >
                    <span className="text-sm font-bold text-white">Male</span>
                    <span className="text-[10px] text-neutral-400 font-mono mt-0.5">+5 kcal MSJ constant</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender("FEMALE")}
                    className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition ${
                      gender === "FEMALE"
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500 shadow-md shadow-emerald-500/10"
                        : "border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200"
                    }`}
                  >
                    <span className="text-sm font-bold text-white">Female</span>
                    <span className="text-[10px] text-neutral-400 font-mono mt-0.5">-161 kcal MSJ constant</span>
                  </button>
                </div>
              </div>

              {/* Age & Height Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
                    <span>Age (Years)</span>
                    <span className="text-[10px] font-mono text-neutral-500">-5A factor</span>
                  </label>
                  <input
                    type="number"
                    min="14"
                    max="100"
                    value={age}
                    onChange={(e) => setAge(Math.max(14, parseInt(e.target.value) || 25))}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-sm text-neutral-100 font-mono focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
                    <span>Height</span>
                    <span className="text-[10px] font-mono text-neutral-500">6.25H factor</span>
                  </label>
                  {unitSystem === "IMPERIAL" ? (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="relative">
                        <input
                          type="number"
                          min="3"
                          max="7"
                          value={heightFt}
                          onChange={(e) => setHeightFt(parseInt(e.target.value) || 5)}
                          className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2.5 text-sm text-neutral-100 font-mono focus:border-emerald-500 focus:outline-none pr-8"
                        />
                        <span className="absolute right-3 top-3 text-xs text-neutral-500">ft</span>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="11"
                          value={heightIn}
                          onChange={(e) => setHeightIn(parseInt(e.target.value) || 0)}
                          className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2.5 text-sm text-neutral-100 font-mono focus:border-emerald-500 focus:outline-none pr-8"
                        />
                        <span className="absolute right-3 top-3 text-xs text-neutral-500">in</span>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        type="number"
                        min="100"
                        max="250"
                        value={heightCm}
                        onChange={(e) => setHeightCm(parseInt(e.target.value) || 175)}
                        className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-sm text-neutral-100 font-mono focus:border-emerald-500 focus:outline-none pr-10"
                      />
                      <span className="absolute right-3 top-3 text-xs text-neutral-500">cm</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Current Weight & Goal Weight */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
                    <span>Current Weight</span>
                    <span className="text-[10px] font-mono text-neutral-500">10W factor</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      min="60"
                      max="500"
                      value={unitSystem === "IMPERIAL" ? weightLbs : weightKg}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        if (unitSystem === "IMPERIAL") {
                          setWeightLbs(val);
                          setWeightKg(Math.round((val / 2.20462) * 10) / 10);
                        } else {
                          setWeightKg(val);
                          setWeightLbs(Math.round(val * 2.20462));
                        }
                      }}
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-sm text-neutral-100 font-mono focus:border-emerald-500 focus:outline-none pr-10"
                    />
                    <span className="absolute right-3 top-3 text-xs text-neutral-500">
                      {unitSystem === "IMPERIAL" ? "lbs" : "kg"}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
                    <span>Target Goal Weight</span>
                    <span className="text-[10px] font-mono text-neutral-500">Target mass</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      min="60"
                      max="500"
                      value={unitSystem === "IMPERIAL" ? goalWeightLbs : goalWeightKg}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        if (unitSystem === "IMPERIAL") {
                          setGoalWeightLbs(val);
                          setGoalWeightKg(Math.round((val / 2.20462) * 10) / 10);
                        } else {
                          setGoalWeightKg(val);
                          setGoalWeightLbs(Math.round(val * 2.20462));
                        }
                      }}
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-sm text-neutral-100 font-mono focus:border-emerald-500 focus:outline-none pr-10"
                    />
                    <span className="absolute right-3 top-3 text-xs text-neutral-500">
                      {unitSystem === "IMPERIAL" ? "lbs" : "kg"}
                    </span>
                  </div>
                </div>
              </div>

              {!showAllSteps && (
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setActiveStep(2)}
                    className="inline-flex items-center gap-2 rounded-xl bg-neutral-800 border border-neutral-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-neutral-700 transition"
                  >
                    <span>Proceed to Training &amp; Goal</span>
                    <ChevronRight className="h-4 w-4 text-emerald-400" />
                  </button>
                </div>
              )}
            </Card>
          )}

          {/* PHASE 2: TRAINING & GOAL */}
          {(showAllSteps || activeStep === 2) && (
            <Card decoration="top" decorationColor="cyan" className="bg-neutral-900/60 border-neutral-800 p-6 sm:p-7 space-y-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
                <div className="space-y-0.5">
                  <Title className="text-white text-lg font-bold flex items-center gap-2">
                    <Dumbbell className="h-5 w-5 text-cyan-400" />
                    <span>Phase 2: Training Physiology &amp; Goal</span>
                  </Title>
                  <Text className="text-neutral-400 text-xs">
                    Caloric offsets and activity multipliers.
                  </Text>
                </div>
              </div>

              {/* Nutrition Goal Phase */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
                  <span>Training Goal &amp; Caloric Delta</span>
                  <span className="text-[10px] font-mono text-neutral-500">Clinical offset</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      key: "BUILD_MUSCLE",
                      label: "Hypertrophy",
                      sub: "+300 kcal surplus",
                      color: "text-cyan-400",
                      desc: "Maximizes lean muscle accretion with minor surplus",
                    },
                    {
                      key: "MAINTAIN",
                      label: "Maintenance",
                      sub: "0 kcal baseline",
                      color: "text-emerald-400",
                      desc: "Body recomposition & performance stabilization",
                    },
                    {
                      key: "LOSE_WEIGHT",
                      label: "Fat Loss (Cut)",
                      sub: "-500 kcal deficit",
                      color: "text-amber-400",
                      desc: "Preserves lean tissue under controlled deficit",
                    },
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setGoal(item.key)}
                      className={`flex flex-col items-start justify-between p-3.5 rounded-xl border text-left transition ${
                        goal === item.key
                          ? "border-emerald-500 bg-emerald-500/10 text-white ring-1 ring-emerald-500 shadow-md shadow-emerald-500/10"
                          : "border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700"
                      }`}
                    >
                      <div className="w-full flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-white">{item.label}</span>
                        <span className={`text-[10px] font-mono font-bold ${item.color}`}>
                          {item.sub}
                        </span>
                      </div>
                      <p className="text-[10px] text-neutral-400 leading-tight">{item.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Activity Level Multiplier */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
                  <span>Physical Activity Level (PAL Multiplier)</span>
                  <span className="text-[10px] font-mono text-neutral-500">TDEE = BMR &times; PAL</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { key: "SEDENTARY", label: "Sedentary", mult: "1.2x", desc: "Desk job / minimal" },
                    { key: "LIGHT", label: "Light", mult: "1.375x", desc: "1-2 training days" },
                    { key: "MODERATE", label: "Moderate", mult: "1.55x", desc: "3-5 training days" },
                    { key: "ACTIVE", label: "Active", mult: "1.725x", desc: "6-7 intense days" },
                    { key: "VERY_ACTIVE", label: "Athlete", mult: "1.9x", desc: "2x daily / manual work" },
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setActivityLevel(item.key)}
                      className={`p-3 rounded-xl border text-left transition ${
                        activityLevel === item.key
                          ? "border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500 shadow-sm"
                          : "border-neutral-800 bg-neutral-950 hover:border-neutral-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{item.label}</span>
                        <span className="text-[10px] font-mono font-bold text-emerald-400">{item.mult}</span>
                      </div>
                      <div className="text-[10px] text-neutral-400 mt-1">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Experience Level */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
                  <span>Lifting Experience Level</span>
                  <span className="text-[10px] font-mono text-neutral-500">Volume autoregulation</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: "BEGINNER", label: "Novice (< 1 yr)" },
                    { key: "INTERMEDIATE", label: "Intermediate (1-3 yrs)" },
                    { key: "ADVANCED", label: "Advanced (3+ yrs)" },
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setExperienceLevel(item.key)}
                      className={`p-2.5 rounded-xl border text-center transition ${
                        experienceLevel === item.key
                          ? "border-cyan-500 bg-cyan-500/10 text-cyan-300 ring-1 ring-cyan-500"
                          : "border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700"
                      }`}
                    >
                      <div className="text-xs font-bold text-white">{item.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {!showAllSteps && (
                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setActiveStep(1)}
                    className="inline-flex items-center gap-2 rounded-xl border border-neutral-800 px-3.5 py-2 text-xs font-semibold text-neutral-400 hover:text-white transition"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Back</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveStep(3)}
                    className="inline-flex items-center gap-2 rounded-xl bg-neutral-800 border border-neutral-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-neutral-700 transition"
                  >
                    <span>Proceed to Nutrition Protocol</span>
                    <ChevronRight className="h-4 w-4 text-emerald-400" />
                  </button>
                </div>
              )}
            </Card>
          )}

          {/* PHASE 3: NUTRITION ARCHITECTURE & SYNC */}
          {(showAllSteps || activeStep === 3) && (
            <Card decoration="top" decorationColor="amber" className="bg-neutral-900/60 border-neutral-800 p-6 sm:p-7 space-y-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
                <div className="space-y-0.5">
                  <Title className="text-white text-lg font-bold flex items-center gap-2">
                    <Utensils className="h-5 w-5 text-amber-400" />
                    <span>Phase 3: Nutrition Architecture &amp; Sync</span>
                  </Title>
                  <Text className="text-neutral-400 text-xs">
                    Macronutrient distribution and database sync.
                  </Text>
                </div>
              </div>

              {/* Diet Protocol Preference */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
                  <span>Dietary Architecture</span>
                  <span className="text-[10px] font-mono text-neutral-500">Macro distribution</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { key: "HIGH_PROTEIN", label: "High Protein", sub: "2.2g / kg" },
                    { key: "STANDARD", label: "Balanced", sub: "40/30/30" },
                    { key: "VEGETARIAN", label: "Plant-Based", sub: "Vegetarian" },
                    { key: "KETO", label: "Low Carb", sub: "Ketogenic" },
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setDietPreference(item.key)}
                      className={`p-3 rounded-xl border text-center transition ${
                        dietPreference === item.key
                          ? "border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500 shadow-sm"
                          : "border-neutral-800 bg-neutral-950 hover:border-neutral-700"
                      }`}
                    >
                      <div className="text-xs font-bold text-white">{item.label}</div>
                      <div className="text-[10px] font-mono text-neutral-400 mt-0.5">{item.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Save Action & Feedback for Authenticated Athlete */}
              {user ? (
                <div className="pt-2 space-y-3">
                  {profileSaveError && (
                    <div className="flex items-center gap-2 rounded-xl border border-red-900/40 bg-red-950/30 p-3 text-xs text-red-400">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{profileSaveError}</span>
                    </div>
                  )}

                  {profileSaveSuccess && (
                    <div className="flex items-center gap-2 rounded-xl border border-emerald-900/40 bg-emerald-950/30 p-3 text-xs text-emerald-300">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                      <span>Metabolic profile calibrated and saved to database!</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-3.5 text-sm font-bold text-neutral-950 shadow-lg shadow-emerald-500/25 hover:from-emerald-400 hover:to-emerald-500 hover:scale-[1.01] transition active:scale-[0.99] disabled:opacity-50"
                  >
                    {savingProfile ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin text-neutral-950" />
                        <span>Syncing Calibration to PostgreSQL...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        <span>Save &amp; Sync Metabolic Calibration</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-center space-y-3">
                  <div className="text-xs text-neutral-300 leading-relaxed">
                    Sign in or create your athlete account to sync these clinical targets with the AI Coach and training logger.
                  </div>
                  <a
                    href="#portal-section"
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-neutral-950 shadow-md shadow-emerald-500/20 hover:bg-emerald-400 transition"
                  >
                    <Lock className="h-3.5 w-3.5" />
                    <span>Sign In to Save Profile</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              )}

              {!showAllSteps && (
                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setActiveStep(2)}
                    className="inline-flex items-center gap-2 rounded-xl border border-neutral-800 px-3.5 py-2 text-xs font-semibold text-neutral-400 hover:text-white transition"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Back to Step 2</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveStep(1)}
                    className="text-xs text-neutral-500 hover:text-neutral-300 underline"
                  >
                    Restart from Step 1
                  </button>
                </div>
              )}
            </Card>
          )}

        </div>

        {/* Right Column: Sticky Live Telemetry & Mifflin-St Jeor Engine (5 cols) */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-8">
          <Card decoration="top" decorationColor="emerald" className="bg-neutral-900/60 border-neutral-800 p-6 space-y-6 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="space-y-0.5">
                <Title className="text-white text-base font-bold flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-400" />
                  <span>Real-Time Metabolic Telemetry</span>
                </Title>
                <Text className="text-neutral-400 text-xs">Mifflin-St Jeor Clinical Formula</Text>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-mono font-bold text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>LIVE</span>
              </div>
            </div>

            {/* Primary Calorie Hero */}
            <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-emerald-950/25 via-neutral-950 to-neutral-950 p-5 text-center space-y-2">
              <span className="text-xs uppercase tracking-wider text-emerald-400 font-mono font-bold">
                Prescribed Daily Target
              </span>
              <div className="text-4xl font-black font-mono text-white tracking-tight">
                {liveTargets.targetCalories.toLocaleString()}{" "}
                <span className="text-sm font-sans text-neutral-400 font-normal">kcal / day</span>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900 border border-neutral-800 px-3 py-1 text-[11px] font-mono text-neutral-300">
                <span>BMR: {liveTargets.bmr} kcal</span>
                <span className="text-neutral-600">&bull;</span>
                <span>TDEE: {liveTargets.tdee} kcal</span>
              </div>
            </div>

            {/* Macro Donut Chart */}
            <div className="space-y-3">
              <div className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
                <span>Macronutrient Partition</span>
                <span className="text-[10px] font-mono text-neutral-500">Grams &amp; Caloric Ratios</span>
              </div>
              <div className="flex justify-center py-1">
                <DonutChart
                  data={chartData}
                  category="value"
                  index="name"
                  valueFormatter={(num) => `${num}g`}
                  className="h-40 w-40"
                />
              </div>

              {/* 3 Macro Cards */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-neutral-950 p-2.5 border border-emerald-500/20">
                  <div className="text-[10px] uppercase font-bold text-emerald-400">Protein</div>
                  <div className="text-lg font-extrabold text-white font-mono">
                    {liveTargets.targetProtein}g
                  </div>
                  <div className="text-[9px] text-neutral-400">2.2g / kg</div>
                </div>
                <div className="rounded-xl bg-neutral-950 p-2.5 border border-cyan-500/20">
                  <div className="text-[10px] uppercase font-bold text-cyan-400">Carbs</div>
                  <div className="text-lg font-extrabold text-white font-mono">
                    {liveTargets.targetCarbs}g
                  </div>
                  <div className="text-[9px] text-neutral-400">Glycogen</div>
                </div>
                <div className="rounded-xl bg-neutral-950 p-2.5 border border-amber-500/20">
                  <div className="text-[10px] uppercase font-bold text-amber-400">Fats</div>
                  <div className="text-lg font-extrabold text-white font-mono">
                    {liveTargets.targetFat}g
                  </div>
                  <div className="text-[9px] text-neutral-400">Hormones</div>
                </div>
              </div>
            </div>

            {/* Formula verification chips */}
            <div className="pt-2 border-t border-neutral-800 space-y-2">
              <div className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold">
                Clinical Formula Proof
              </div>
              <div className="flex flex-wrap gap-1.5 text-[10px] font-mono text-neutral-400">
                <span className="rounded-md bg-neutral-950 px-2 py-1 border border-neutral-800">
                  BMR = 10W + 6.25H - 5A + S
                </span>
                <span className="rounded-md bg-neutral-950 px-2 py-1 border border-neutral-800">
                  2.2g Protein / kg
                </span>
                <span className="rounded-md bg-neutral-950 px-2 py-1 border border-neutral-800">
                  Autoregulated Volume
                </span>
              </div>
            </div>

            {/* Direct Dashboard Launch for Authenticated Athlete */}
            {user && (
              <button
                type="button"
                onClick={() => setViewingDashboard(true)}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-xs font-bold text-neutral-950 shadow-md shadow-emerald-500/20 hover:bg-emerald-400 transition"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Launch Athlete Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </Card>
        </div>
      </div>

      {/* 4. Unauthenticated Login / Sign-Up Portal Card (If user is not logged in) */}
      {!user && (
        <div id="portal-section" className="mt-12 pt-8 border-t border-neutral-800/80 max-w-lg mx-auto space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-0.5 text-xs font-semibold text-emerald-400">
              <Lock className="h-3.5 w-3.5" />
              <span>Athlete Portal Access</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Access Your Permanent Profile
            </h2>
            <p className="text-xs text-neutral-400">
              Sync your training logs, interactive charts, and 24/7 AI strength specialist.
            </p>
          </div>

          <Card decoration="top" decorationColor="emerald" className="bg-neutral-900/60 border-neutral-800 p-6 sm:p-8 space-y-6 shadow-2xl">
            {/* Mode Switch Tabs */}
            <div className="grid grid-cols-2 rounded-xl bg-neutral-950 p-1 border border-neutral-800">
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`rounded-lg py-2 text-xs font-bold transition ${
                  mode === "signin"
                    ? "bg-emerald-500 text-neutral-950 shadow-md shadow-emerald-500/20"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`rounded-lg py-2 text-xs font-bold transition ${
                  mode === "signup"
                    ? "bg-emerald-500 text-neutral-950 shadow-md shadow-emerald-500/20"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Status Alerts */}
            {errorMsg && (
              <div className="flex items-start gap-2.5 rounded-xl border border-red-900/40 bg-red-950/30 p-3.5 text-xs text-red-300">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                <div className="space-y-1">
                  <span>{errorMsg}</span>
                  {errorMsg.toLowerCase().includes("not confirmed") && (
                    <div>
                      <button
                        type="button"
                        onClick={handleInstantVerify}
                        className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/30 transition"
                      >
                        <Zap className="h-3 w-3" />
                        <span>Instant Verify &amp; Activate Account</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {successMsg && (
              <div className="flex items-start gap-2.5 rounded-xl border border-emerald-900/40 bg-emerald-950/30 p-3.5 text-xs text-emerald-300">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Google OAuth */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-neutral-700 bg-neutral-950/90 px-4 py-3 text-xs font-semibold text-white shadow-sm hover:bg-neutral-800 hover:border-neutral-600 transition disabled:opacity-50"
            >
              {googleLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin text-emerald-400" />
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24">
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
              )}
              <span>Continue with Google</span>
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center">
              <div className="w-full border-t border-neutral-800" />
              <span className="relative bg-neutral-900 px-3 text-[11px] uppercase tracking-wider text-neutral-500 font-semibold">
                Or with email credentials
              </span>
            </div>

            {/* Email Form */}
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {mode === "signup" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-300">Full Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3.5 top-3 h-4 w-4 text-neutral-500" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Alex Smith"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-950 pl-10 pr-3.5 py-2.5 text-xs text-neutral-100 placeholder:text-neutral-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-300">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-neutral-500" />
                  <input
                    type="email"
                    required
                    placeholder="athlete@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 pl-10 pr-3.5 py-2.5 text-xs text-neutral-100 placeholder:text-neutral-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-neutral-300">Password</label>
                  <span className="text-[10px] text-neutral-500 font-mono">Min. 6 chars</span>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-neutral-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 pl-10 pr-10 py-2.5 text-xs text-neutral-100 placeholder:text-neutral-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-neutral-500 hover:text-neutral-300"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3 text-xs font-bold text-neutral-950 shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-emerald-500 transition disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-neutral-950" />
                    <span>Authenticating Athlete...</span>
                  </>
                ) : (
                  <>
                    <span>{mode === "signin" ? "Sign In to Athlete Portal" : "Create Athlete Account"}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </Card>
        </div>
      )}

      {/* 5. Trust Badges Footer */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-4 border-t border-neutral-800/80 text-neutral-400 text-xs font-medium text-center">
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
  );
}
