"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, Title, Subtitle, Text, Divider, DonutChart } from "@/components/tremor";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  BrainCircuit,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Dumbbell,
  Eye,
  EyeOff,
  Flame,
  Gauge,
  HeartPulse,
  Info,
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
  Upload,
  User as UserIcon,
  Utensils,
  Zap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { TremorAppShell } from "@/components/dashboard/tremor-app-shell";
import { calculateNutritionTargets, type CalculatedTargets } from "@/lib/calc";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";

const AVATAR_PRESETS = ["🏋️", "💪", "🥗", "⚡", "🧘", "🏆", "🔥", "🥇"];

const EQUIPMENT_OPTIONS = [
  "Barbell",
  "Dumbbell",
  "Kettlebell",
  "Bodyweight",
  "Cable Machine",
  "Resistance Band",
  "Smith Machine",
  "Leg Press",
];

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

  // Avatar & Photo state
  const [selectedAvatarPreset, setSelectedAvatarPreset] = useState<string>("🏋️");
  const [customPhotoUrl, setCustomPhotoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile Form Fields (matching Picture 1)
  const [fullName, setFullName] = useState("");
  const [emailField, setEmailField] = useState("");
  const [unitSystem, setUnitSystem] = useState<"IMPERIAL" | "METRIC">("IMPERIAL");
  const [age, setAge] = useState<number>(26);
  const [gender, setGender] = useState<"MALE" | "FEMALE">("FEMALE");
  const [heightFt, setHeightFt] = useState<number>(5);
  const [heightIn, setHeightIn] = useState<number>(8);
  const [heightCm, setHeightCm] = useState<number>(173);
  const [weightLbs, setWeightLbs] = useState<number>(165);
  const [weightKg, setWeightKg] = useState<number>(74.8);
  const [goalWeightLbs, setGoalWeightLbs] = useState<number>(155);
  const [goalWeightKg, setGoalWeightKg] = useState<number>(70.3);

  // Fitness Goals & Routine
  const [activityLevel, setActivityLevel] = useState<string>("MODERATE");
  const [goal, setGoal] = useState<string>("BUILD_MUSCLE");
  const [experienceLevel, setExperienceLevel] = useState<string>("INTERMEDIATE");
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([
    "Barbell",
    "Dumbbell",
    "Bodyweight",
  ]);

  // Nutrition & Restrictions
  const [dietPreference, setDietPreference] = useState<string>("HIGH_PROTEIN");
  const [foodRestrictions, setFoodRestrictions] = useState("");
  const [medicalConditions, setMedicalConditions] = useState("");

  // Save state
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState<string | null>(null);

  // Auth Portal Modal / State
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
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
        setFullName(currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || "");
        setEmailField(currentUser.email || "");

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

  // Photo select handler
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCustomPhotoUrl(url);
    }
  };

  // Equipment toggle
  const toggleEquipment = (item: string) => {
    setSelectedEquipment((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  // Save profile to database via API
  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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

  // Sign Out
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setViewingDashboard(false);
  };

  // Google OAuth Sign-In
  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setGoogleLoading(true);
    try {
      const origin = window.location.origin;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${origin}/auth/callback` },
      });
      if (error) {
        setErrorMsg(error.message);
        setGoogleLoading(false);
      }
    } catch {
      setErrorMsg("Failed to initiate Google sign-in.");
      setGoogleLoading(false);
    }
  };

  // Auth Submit
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    startTransition(async () => {
      try {
        if (mode === "signup") {
          const origin = window.location.origin;
          const { data, error } = await supabase.auth.signUp({
            email: authEmail,
            password: authPassword,
            options: {
              data: { full_name: fullName || authEmail.split("@")[0] },
              emailRedirectTo: `${origin}/auth/callback`,
            },
          });
          if (error) {
            setErrorMsg(error.message);
            return;
          }
          if (data.session) {
            setSuccessMsg("Account successfully verified!");
            await refreshData();
          } else {
            setSuccessMsg("Check your email for confirmation!");
          }
        } else {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: authEmail,
            password: authPassword,
          });
          if (error) {
            setErrorMsg(error.message);
            return;
          }
          if (data.session) {
            await refreshData();
          }
        }
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : "Authentication error.");
      }
    });
  };

  // If user enters dashboard shell
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
        onProfileUpdated={(updated) => setProfile(updated)}
        onSignOut={handleSignOut}
        onClose={() => setViewingDashboard(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 antialiased py-8 px-4 sm:px-6 lg:px-8 space-y-10 max-w-4xl mx-auto">
      {/* 1. Top Ambient Hero Container — Styled to match Landing Page Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-neutral-800/80 bg-gradient-to-b from-neutral-900/90 via-neutral-950 to-neutral-950 p-6 sm:p-10 shadow-2xl space-y-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.14),transparent_60%)] pointer-events-none" />

        {/* Welcome Banner matching Picture 1 with Landing Page Glassmorphism */}
        <div className="relative z-10 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 sm:p-5 backdrop-blur-md space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-sm sm:text-base text-emerald-400">
            <Sparkles className="h-4 w-4 text-emerald-400 animate-pulse" />
            <span>Welcome to StrengthWise AI!</span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-medium">
            Please set up your new account profile below so our AI engine can compute your personalized
            daily calorie targets, macro splits, meal plan, and workout routines.
          </p>
        </div>

        {/* Heading Section */}
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-0.5 text-xs font-semibold text-emerald-400 backdrop-blur-md">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Sports Science Calibration Protocol</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Your{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Profile
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400">
            We use this to calculate your calories, macros, meals, and workouts.
          </p>
        </div>

        {/* Authenticated Fast-Track Banner */}
        {user && (
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-neutral-800/80">
            <div className="flex items-center gap-2 text-xs text-neutral-300">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span>
                Authenticated as <strong className="text-white font-mono">{user.email}</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={() => setViewingDashboard(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-neutral-950 shadow-md shadow-emerald-500/20 hover:bg-emerald-400 transition"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span>Launch Dashboard</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </section>

      {/* 2. Main Profile Form Formatted in Landing Page Dark UI Cards */}
      <form onSubmit={handleSaveProfile} className="space-y-8">

        {/* SECTION 1: PROFILE PICTURE & ACCOUNT */}
        <Card decoration="left" decorationColor="emerald" className="bg-neutral-900/60 border-neutral-800 p-6 sm:p-7 space-y-6 shadow-xl">
          <div className="border-b border-neutral-800 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Profile Picture &amp; Account
            </h3>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Custom Avatar with Radiant Border */}
            <div className="relative group shrink-0">
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 p-0.5 shadow-lg shadow-emerald-500/20">
                <div className="h-full w-full rounded-[14px] bg-neutral-950 flex flex-col items-center justify-center text-3xl select-none overflow-hidden">
                  {customPhotoUrl ? (
                    <img
                      src={customPhotoUrl}
                      alt="Avatar"
                      className="h-full w-full object-cover rounded-[14px]"
                    />
                  ) : (
                    <span>{selectedAvatarPreset}</span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Upload custom photo"
                className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 text-neutral-950 shadow-md hover:bg-emerald-400 transition hover:scale-105"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
              />
            </div>

            {/* Avatar Selector & Upload CTA */}
            <div className="flex-1 space-y-3 text-center sm:text-left">
              <div>
                <label className="text-sm font-bold text-white">Custom Profile Picture</label>
                <p className="text-xs text-neutral-400">
                  Upload your own photo or choose a fitness avatar preset below
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-700 bg-neutral-950 px-3.5 py-2 text-xs font-semibold text-neutral-200 hover:bg-neutral-800 hover:border-neutral-600 transition"
                >
                  <Upload className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Upload Photo</span>
                </button>

                {/* 8 Preset Emojis matching Picture 1 */}
                <div className="flex items-center gap-1.5 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
                  {AVATAR_PRESETS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        setCustomPhotoUrl(null);
                        setSelectedAvatarPreset(emoji);
                      }}
                      className={`h-8 w-8 rounded-lg flex items-center justify-center text-base transition ${
                        !customPhotoUrl && selectedAvatarPreset === emoji
                          ? "bg-emerald-500/20 border border-emerald-500 ring-1 ring-emerald-500 shadow-sm"
                          : "hover:bg-neutral-800 text-neutral-300"
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Full Name & Email Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300">Full Name</label>
              <input
                type="text"
                placeholder="e.g. Alex Smith"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300">Email Address</label>
              <input
                type="email"
                placeholder="athlete@example.com"
                value={emailField}
                onChange={(e) => setEmailField(e.target.value)}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/40 font-mono"
              />
            </div>
          </div>
        </Card>

        {/* SECTION 2: ABOUT YOU */}
        <Card decoration="left" decorationColor="cyan" className="bg-neutral-900/60 border-neutral-800 p-6 sm:p-7 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
              About You
            </h3>

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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Age */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
                <span>Age</span>
                <span className="text-[10px] font-mono text-neutral-500">-5A factor</span>
              </label>
              <input
                type="number"
                min="14"
                max="100"
                value={age}
                onChange={(e) => setAge(Math.max(14, parseInt(e.target.value) || 25))}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-2.5 text-sm text-neutral-100 font-mono focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
              />
            </div>

            {/* Biological Sex Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
                <span>Biological Sex</span>
                <span className="text-[10px] font-mono text-neutral-500">M: +5 &bull; F: -161</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGender("FEMALE")}
                  className={`rounded-xl border py-2.5 px-3 text-xs font-bold transition ${
                    gender === "FEMALE"
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500"
                      : "border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700"
                  }`}
                >
                  Female (-161)
                </button>
                <button
                  type="button"
                  onClick={() => setGender("MALE")}
                  className={`rounded-xl border py-2.5 px-3 text-xs font-bold transition ${
                    gender === "MALE"
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500"
                      : "border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700"
                  }`}
                >
                  Male (+5)
                </button>
              </div>
            </div>
          </div>

          {/* Height Grid */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
              <span>Height</span>
              <span className="text-[10px] font-mono text-neutral-500">6.25H factor</span>
            </label>
            {unitSystem === "IMPERIAL" ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <input
                    type="number"
                    min="3"
                    max="7"
                    value={heightFt}
                    onChange={(e) => setHeightFt(parseInt(e.target.value) || 5)}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-2.5 text-sm text-neutral-100 font-mono focus:border-emerald-500 focus:outline-none pr-10"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs text-neutral-500">ft</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="11"
                    value={heightIn}
                    onChange={(e) => setHeightIn(parseInt(e.target.value) || 0)}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-2.5 text-sm text-neutral-100 font-mono focus:border-emerald-500 focus:outline-none pr-10"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs text-neutral-500">in</span>
                </div>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="number"
                  min="100"
                  max="250"
                  value={heightCm}
                  onChange={(e) => setHeightCm(parseInt(e.target.value) || 173)}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-2.5 text-sm text-neutral-100 font-mono focus:border-emerald-500 focus:outline-none pr-10"
                />
                <span className="absolute right-3.5 top-2.5 text-xs text-neutral-500">cm</span>
              </div>
            )}
          </div>

          {/* Current & Goal Weight Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
                <span>Current Weight ({unitSystem === "IMPERIAL" ? "lbs" : "kg"})</span>
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
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-2.5 text-sm text-neutral-100 font-mono focus:border-emerald-500 focus:outline-none pr-12"
                />
                <span className="absolute right-3.5 top-2.5 text-xs text-neutral-500">
                  {unitSystem === "IMPERIAL" ? "lbs" : "kg"}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
                <span>Goal Weight ({unitSystem === "IMPERIAL" ? "lbs" : "kg"})</span>
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
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-2.5 text-sm text-neutral-100 font-mono focus:border-emerald-500 focus:outline-none pr-12"
                />
                <span className="absolute right-3.5 top-2.5 text-xs text-neutral-500">
                  {unitSystem === "IMPERIAL" ? "lbs" : "kg"}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* SECTION 3: FITNESS GOALS & ROUTINE */}
        <Card decoration="left" decorationColor="amber" className="bg-neutral-900/60 border-neutral-800 p-6 sm:p-7 space-y-6 shadow-xl">
          <div className="border-b border-neutral-800 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Fitness Goals &amp; Routine
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Activity Level */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300">Activity Level</label>
              <select
                value={activityLevel}
                onChange={(e) => setActivityLevel(e.target.value)}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-2.5 text-sm text-neutral-100 focus:border-emerald-500 focus:outline-none"
              >
                <option value="SEDENTARY">Sedentary (Desk Job, minimal exercise)</option>
                <option value="LIGHT">Lightly Active (1-2 days/week)</option>
                <option value="MODERATE">Moderately Active (3-5 days/week)</option>
                <option value="ACTIVE">Very Active (6-7 days/week)</option>
                <option value="VERY_ACTIVE">Extremely Active (Athletic training)</option>
              </select>
            </div>

            {/* Primary Goal */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300">Primary Goal</label>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-2.5 text-sm text-neutral-100 focus:border-emerald-500 focus:outline-none"
              >
                <option value="BUILD_MUSCLE">Hypertrophy (+300 kcal Lean Bulk)</option>
                <option value="MAINTAIN">Maintenance (Recomposition)</option>
                <option value="LOSE_WEIGHT">Fat Loss (-500 kcal Cut)</option>
              </select>
            </div>
          </div>

          {/* Workout Experience */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-300">Workout Experience</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: "BEGINNER", label: "Beginner (< 1 yr)" },
                { key: "INTERMEDIATE", label: "Intermediate (1-3 yrs)" },
                { key: "ADVANCED", label: "Advanced (3+ yrs)" },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setExperienceLevel(item.key)}
                  className={`rounded-xl border py-2 text-xs font-bold transition ${
                    experienceLevel === item.key
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500"
                      : "border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Available Equipment Chips */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-300">Available Equipment</label>
            <div className="flex flex-wrap gap-2">
              {EQUIPMENT_OPTIONS.map((item) => {
                const active = selectedEquipment.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleEquipment(item)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                      active
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/50"
                        : "border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700 hover:text-white"
                    }`}
                  >
                    {active && <Check className="h-3.5 w-3.5 text-emerald-400" />}
                    <span>{item}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        {/* SECTION 4: NUTRITION & RESTRICTIONS */}
        <Card decoration="left" decorationColor="emerald" className="bg-neutral-900/60 border-neutral-800 p-6 sm:p-7 space-y-6 shadow-xl">
          <div className="border-b border-neutral-800 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Nutrition &amp; Restrictions
            </h3>
          </div>

          <div className="space-y-4">
            {/* Diet Preference */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300">Diet Preference</label>
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

            {/* Food Allergies */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300">
                Food Allergies / Restrictions (comma separated)
              </label>
              <input
                type="text"
                placeholder="e.g. peanuts, dairy, gluten"
                value={foodRestrictions}
                onChange={(e) => setFoodRestrictions(e.target.value)}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* Medical / Joint Conditions */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300">
                Medical / Joint Conditions (comma separated)
              </label>
              <input
                type="text"
                placeholder="e.g. knee pain, lower back sensitivity"
                value={medicalConditions}
                onChange={(e) => setMedicalConditions(e.target.value)}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </Card>

        {/* SECTION 5: LIVE TARGET CALCULATIONS & TELEMETRY */}
        <Card decoration="top" decorationColor="emerald" className="bg-neutral-900/60 border-neutral-800 p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div className="space-y-0.5">
              <Title className="text-white text-base font-bold flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-400" />
                <span>Live Target Calculations</span>
              </Title>
              <Text className="text-neutral-400 text-xs">Mifflin-St Jeor Clinical Formula Engine</Text>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-mono font-bold text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>LIVE TELEMETRY</span>
            </div>
          </div>

          {/* Calorie Intake Hero */}
          <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-emerald-950/25 via-neutral-950 to-neutral-950 p-5 text-center space-y-2">
            <span className="text-xs uppercase tracking-wider text-emerald-400 font-mono font-bold">
              Prescribed Daily Caloric Target
            </span>
            <div className="text-4xl font-black font-mono text-white tracking-tight">
              {liveTargets.targetCalories.toLocaleString()}{" "}
              <span className="text-sm font-sans text-neutral-400 font-normal">kcal / day</span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-neutral-900 border border-neutral-800 px-3.5 py-1 text-[11px] font-mono text-neutral-300">
              <span>BMR: {liveTargets.bmr} kcal</span>
              <span className="text-neutral-600">&bull;</span>
              <span>TDEE: {liveTargets.tdee} kcal</span>
            </div>
          </div>

          {/* Macro Breakdown Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl bg-neutral-950 p-3.5 border border-emerald-500/20 text-center space-y-1">
              <div className="text-[11px] uppercase font-bold text-emerald-400">Protein</div>
              <div className="text-2xl font-extrabold text-white font-mono">
                {liveTargets.targetProtein}g
              </div>
              <div className="text-[10px] text-neutral-400">2.2g / kg Bodyweight</div>
            </div>
            <div className="rounded-xl bg-neutral-950 p-3.5 border border-cyan-500/20 text-center space-y-1">
              <div className="text-[11px] uppercase font-bold text-cyan-400">Carbs</div>
              <div className="text-2xl font-extrabold text-white font-mono">
                {liveTargets.targetCarbs}g
              </div>
              <div className="text-[10px] text-neutral-400">Glycogen Replenishment</div>
            </div>
            <div className="rounded-xl bg-neutral-950 p-3.5 border border-amber-500/20 text-center space-y-1">
              <div className="text-[11px] uppercase font-bold text-amber-400">Fats</div>
              <div className="text-2xl font-extrabold text-white font-mono">
                {liveTargets.targetFat}g
              </div>
              <div className="text-[10px] text-neutral-400">Hormonal Support</div>
            </div>
          </div>

          {/* Formula Proof Chips */}
          <div className="pt-2 border-t border-neutral-800 flex flex-wrap gap-2 text-[11px] font-mono text-neutral-400">
            <span className="rounded-md bg-neutral-950 px-2.5 py-1 border border-neutral-800">
              BMR = 10W + 6.25H - 5A + S
            </span>
            <span className="rounded-md bg-neutral-950 px-2.5 py-1 border border-neutral-800">
              Adaptive Volume Progression
            </span>
          </div>
        </Card>

        {/* FEEDBACK & SAVE ACTION */}
        <div className="space-y-4 pt-2">
          {profileSaveError && (
            <div className="flex items-center gap-2.5 rounded-xl border border-red-900/40 bg-red-950/30 p-4 text-xs text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{profileSaveError}</span>
            </div>
          )}

          {profileSaveSuccess && (
            <div className="flex items-center gap-2.5 rounded-xl border border-emerald-900/40 bg-emerald-950/30 p-4 text-xs text-emerald-300">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>Profile and clinical targets synced successfully to database!</span>
            </div>
          )}

          <button
            type="submit"
            disabled={savingProfile}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-4 text-sm font-bold text-neutral-950 shadow-lg shadow-emerald-500/25 hover:bg-emerald-400 hover:scale-[1.01] transition active:scale-[0.99] disabled:opacity-50"
          >
            {savingProfile ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin text-neutral-950" />
                <span>Saving Profile &amp; Updating Recommendations...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save &amp; Update Recommendations</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* 3. Unauthenticated Login Portal (If not signed in) */}
      {!user && (
        <div className="mt-12 pt-8 border-t border-neutral-800/80 max-w-md mx-auto space-y-6">
          <div className="text-center space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-0.5 text-xs font-semibold text-emerald-400">
              <Lock className="h-3.5 w-3.5" />
              <span>Permanent Athlete Sync</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Sign In to Save Profile Permanently
            </h2>
          </div>

          <Card decoration="top" decorationColor="emerald" className="bg-neutral-900/60 border-neutral-800 p-6 space-y-5 shadow-2xl">
            {/* Mode Switch Tabs */}
            <div className="grid grid-cols-2 rounded-xl bg-neutral-950 p-1 border border-neutral-800">
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setErrorMsg(null);
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

            {errorMsg && (
              <div className="flex items-center gap-2 text-xs text-red-400 bg-red-950/30 border border-red-900/40 p-3 rounded-xl">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="flex items-center gap-2 text-xs text-emerald-300 bg-emerald-950/30 border border-emerald-900/40 p-3 rounded-xl">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Google OAuth */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-2.5 text-xs font-semibold text-white hover:bg-neutral-800 transition"
            >
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
              <span>Continue with Google</span>
            </button>

            {/* Email Form */}
            <form onSubmit={handleAuthSubmit} className="space-y-3.5 pt-1">
              <input
                type="email"
                required
                placeholder="athlete@example.com"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-xs text-neutral-100 placeholder:text-neutral-600 focus:border-emerald-500 focus:outline-none"
              />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-xs text-neutral-100 placeholder:text-neutral-600 focus:border-emerald-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={isPending}
                className="w-full rounded-xl bg-emerald-500 py-2.5 text-xs font-bold text-neutral-950 hover:bg-emerald-400 transition"
              >
                {mode === "signin" ? "Sign In" : "Create Account"}
              </button>
            </form>
          </Card>
        </div>
      )}

      {/* 4. Trust Badges Footer matching Landing Page */}
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
