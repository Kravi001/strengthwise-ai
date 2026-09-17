"use client";

import { useEffect, useState, useTransition } from "react";
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
  AlertCircle,
  ArrowRight,
  Bot,
  BrainCircuit,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Code2,
  Database,
  Dumbbell,
  Edit3,
  ExternalLink,
  Eye,
  EyeOff,
  Flame,
  Globe,
  Layers,
  LineChart,
  Lock,
  Mail,
  MailCheck,
  RefreshCw,
  Scale,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Upload,
  User as UserIcon,
  Utensils,
  Zap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { calculateNutritionTargets } from "@/lib/calc";
import type { User } from "@supabase/supabase-js";

const AVATAR_PRESETS = ["🏋️‍♂️", "🦾", "🥗", "⚡", "🧘", "🏆", "🔥", "🥇"];

export default function LandingPage() {
  const supabase = createClient();

  // --- Auth & User State ---
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<"signup" | "signin">("signup");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [authErrorMsg, setAuthErrorMsg] = useState<string | null>(null);
  const [emailConfirmationSent, setEmailConfirmationSent] = useState(false);
  const [isVerifyingDev, setIsVerifyingDev] = useState(false);

  // --- Profile State ---
  const [hasProfile, setHasProfile] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Form Fields
  const [avatar, setAvatar] = useState<string>("🏋️‍♂️");
  const [fullName, setFullName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [age, setAge] = useState<number | string>(26);
  const [gender, setGender] = useState<"FEMALE" | "MALE">("FEMALE");
  const [heightFt, setHeightFt] = useState<number | string>(5);
  const [heightIn, setHeightIn] = useState<number | string>(8);
  const [currentWeightLbs, setCurrentWeightLbs] = useState<number | string>(155);
  const [goalWeightLbs, setGoalWeightLbs] = useState<number | string>(145);
  const [goal, setGoal] = useState<"CUT" | "MAINTAIN" | "BULK">("CUT");
  const [activityLevel, setActivityLevel] = useState<string>("MODERATE");

  // Calculations
  const numWeightLbs = Number(currentWeightLbs) || 155;
  const numWeightKg = numWeightLbs / 2.20462;
  const totalInches = (Number(heightFt) || 5) * 12 + (Number(heightIn) || 8);
  const heightCm = totalInches * 2.54;

  const calculated = calculateNutritionTargets({
    age: Number(age) || 26,
    gender: gender,
    heightCm: heightCm,
    weightKg: numWeightKg,
    activityLevel: activityLevel,
    goal: goal === "CUT" ? "LOSE_WEIGHT" : goal === "BULK" ? "BUILD_MUSCLE" : "MAINTAIN",
  });

  const chartData = [
    { name: "Protein", value: calculated.targetProtein, color: "#10b981" },
    { name: "Carbs", value: calculated.targetCarbs, color: "#06b6d4" },
    { name: "Fats", value: calculated.targetFat, color: "#f59e0b" },
  ];

  // 1. Check current Supabase session & load existing profile on mount
  useEffect(() => {
    async function initSessionAndProfile() {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        setAuthUser(currentUser);
        if (currentUser) {
          if (currentUser.email) setEmail(currentUser.email);
          if (currentUser.user_metadata?.full_name) setFullName(currentUser.user_metadata.full_name);

          // Check if there is a pending draft to save from Google OAuth return
          const draft = localStorage.getItem("sw_athlete_profile_draft");
          if (draft) {
            try {
              const draftData = JSON.parse(draft);
              await fetch("/api/profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(draftData),
              });
              localStorage.removeItem("sw_athlete_profile_draft");
              localStorage.setItem("sw_athlete_profile", JSON.stringify({ ...draftData, isCompleted: true }));
              window.dispatchEvent(new Event("sw_profile_updated"));
              setHasProfile(true);
              setShowProfileForm(false);
              setSaveSuccessMsg("🎉 Google Account connected and athlete profile saved!");
              return;
            } catch (err) {
              console.warn("Could not save draft after OAuth:", err);
            }
          }

          // Fetch profile from backend database
          try {
            const res = await fetch("/api/profile");
            if (res.ok) {
              const data = await res.json();
              if (data.profile) {
                setHasProfile(true);
                setShowProfileForm(false);
                if (data.profile.age) setAge(data.profile.age);
                if (data.profile.gender) setGender(data.profile.gender);
                if (data.profile.weightKg) setCurrentWeightLbs(Math.round(data.profile.weightKg * 2.20462));
                if (data.profile.goalWeightKg) setGoalWeightLbs(Math.round(data.profile.goalWeightKg * 2.20462));
                if (data.profile.goal) setGoal(data.profile.goal === "LOSE_WEIGHT" ? "CUT" : data.profile.goal === "BUILD_MUSCLE" ? "BULK" : "MAINTAIN");
                if (data.profile.activityLevel) setActivityLevel(data.profile.activityLevel);
                return;
              }
            }
          } catch {
            // Fallback to local storage
          }
        }

        // Fallback: check localStorage for offline/cached profile
        const stored = localStorage.getItem("sw_athlete_profile");
        if (stored) {
          const p = JSON.parse(stored);
          if (p.isCompleted || p.age || p.weightLbs) {
            setHasProfile(true);
            setShowProfileForm(false);
            if (p.avatar) setAvatar(p.avatar);
            if (p.fullName) setFullName(p.fullName);
            if (p.email) setEmail(p.email);
            if (p.age) setAge(p.age);
            if (p.gender) setGender(p.gender);
            if (p.heightFt) setHeightFt(p.heightFt);
            if (p.heightIn) setHeightIn(p.heightIn);
            if (p.weightLbs) setCurrentWeightLbs(p.weightLbs);
            if (p.goalWeightLbs) setGoalWeightLbs(p.goalWeightLbs);
            if (p.goal) setGoal(p.goal);
            if (p.activityLevel) setActivityLevel(p.activityLevel);
          }
        }
      } catch (err) {
        console.warn("Init session error:", err);
      }
    }

    initSessionAndProfile();
  }, [supabase]);

  // 2. Google OAuth Handler
  const handleGoogleSignIn = async () => {
    setAuthErrorMsg(null);
    setGoogleLoading(true);

    // Prepare profile draft so that once user returns from Google, it's immediately saved
    const profileDraft = {
      fullName: fullName || "StrengthWise Athlete",
      avatar,
      age: Number(age),
      gender,
      heightCm,
      weightKg: numWeightKg,
      weightLbs: numWeightLbs,
      goalWeightKg: (Number(goalWeightLbs) || 145) / 2.20462,
      goalWeightLbs: Number(goalWeightLbs),
      activityLevel,
      goal: goal === "CUT" ? "LOSE_WEIGHT" : goal === "BULK" ? "BUILD_MUSCLE" : "MAINTAIN",
    };

    try {
      localStorage.setItem("sw_athlete_profile_draft", JSON.stringify(profileDraft));
      const origin = window.location.origin;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/auth/callback`,
        },
      });

      if (error) {
        setAuthErrorMsg(error.message);
        setGoogleLoading(false);
      }
    } catch (err: unknown) {
      setAuthErrorMsg(err instanceof Error ? err.message : "Failed to initiate Google sign-in.");
      setGoogleLoading(false);
    }
  };

  // 3. Instant Dev Verification Handler
  const handleInstantVerify = async () => {
    if (!email) return;
    setIsVerifyingDev(true);
    setAuthErrorMsg(null);
    try {
      const res = await fetch("/api/auth/dev-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to verify account.");

      if (password) {
        const { data: signData, error: signError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (!signError && signData.session) {
          setAuthUser(signData.session.user);
          setEmailConfirmationSent(false);
          await commitProfileToDatabase(signData.session.user);
          return;
        }
      }
      setEmailConfirmationSent(false);
      setAuthMode("signin");
      setSaveSuccessMsg("Account verified! Click 'Sign In & Save Profile' below.");
    } catch (err: unknown) {
      setAuthErrorMsg(err instanceof Error ? err.message : "Verification failed.");
    } finally {
      setIsVerifyingDev(false);
    }
  };

  // 4. Commit Profile to Supabase & Database
  const commitProfileToDatabase = async (userObj?: User | null) => {
    const activeUser = userObj || authUser;
    const profilePayload = {
      fullName,
      name: fullName,
      avatar,
      age: Number(age),
      gender,
      heightCm,
      weightKg: numWeightKg,
      goalWeightKg: (Number(goalWeightLbs) || 145) / 2.20462,
      activityLevel,
      goal: goal === "CUT" ? "LOSE_WEIGHT" : goal === "BULK" ? "BUILD_MUSCLE" : "MAINTAIN",
    };

    const localProfileData = {
      isCompleted: true,
      avatar,
      fullName: fullName || (activeUser?.email ? activeUser.email.split("@")[0] : "Athlete"),
      email: email || activeUser?.email || "",
      age: Number(age),
      gender,
      heightFt: Number(heightFt),
      heightIn: Number(heightIn),
      heightCm,
      weightLbs: numWeightLbs,
      weightKg: numWeightKg,
      goalWeightLbs: Number(goalWeightLbs),
      goal,
      activityLevel,
      targetCalories: calculated.targetCalories,
      targetProtein: calculated.targetProtein,
      targetCarbs: calculated.targetCarbs,
      targetFat: calculated.targetFat,
      updatedAt: new Date().toISOString(),
    };

    // Save locally
    localStorage.setItem("sw_athlete_profile", JSON.stringify(localProfileData));
    document.cookie = `sw_athlete_profile=true; path=/; max-age=31536000; SameSite=Lax`;
    window.dispatchEvent(new Event("sw_profile_updated"));

    // Save to PostgreSQL backend via Prisma API
    try {
      await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profilePayload),
      });
    } catch (err) {
      console.warn("Backend profile save error:", err);
    }

    setHasProfile(true);
    setShowProfileForm(false);
    setSaveSuccessMsg("🎉 Profile saved to your Supabase account! Meals, Workouts, Progress, and AI Coach unlocked.");

    setTimeout(() => {
      const mealsEl = document.getElementById("meals");
      if (mealsEl) {
        mealsEl.scrollIntoView({ behavior: "smooth" });
      }
    }, 600);
  };

  // 5. Handle Form Submit (Creates account if needed, then saves profile)
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthErrorMsg(null);
    setSaveSuccessMsg(null);
    setIsSaving(true);

    try {
      // CASE A: User is already signed in -> just save profile to Supabase/DB
      if (authUser) {
        await commitProfileToDatabase(authUser);
        return;
      }

      // CASE B: User needs to create an account or sign in with Email & Password
      if (!email || !password) {
        setAuthErrorMsg("Please enter both an email and a password to create your account and save your profile.");
        setIsSaving(false);
        return;
      }

      if (password.length < 6) {
        setAuthErrorMsg("Password must be at least 6 characters long.");
        setIsSaving(false);
        return;
      }

      const origin = window.location.origin;

      if (authMode === "signup") {
        // Create Supabase Account
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName || email.split("@")[0],
              avatar_url: avatar,
            },
            emailRedirectTo: `${origin}/auth/callback`,
          },
        });

        if (error) {
          setAuthErrorMsg(error.message);
          setIsSaving(false);
          return;
        }

        if (data.session?.user) {
          setAuthUser(data.session.user);
          await commitProfileToDatabase(data.session.user);
        } else {
          // Email confirmation is required by Supabase
          setEmailConfirmationSent(true);
          setIsSaving(false);
        }
      } else {
        // Sign In with existing password
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.toLowerCase().includes("email not confirmed")) {
            setEmailConfirmationSent(true);
            setAuthErrorMsg("Email address has not been confirmed yet. Click 'Instant Verify' to activate.");
          } else {
            setAuthErrorMsg(error.message);
          }
          setIsSaving(false);
          return;
        }

        if (data.session?.user) {
          setAuthUser(data.session.user);
          await commitProfileToDatabase(data.session.user);
        }
      }
    } catch (err: unknown) {
      setAuthErrorMsg(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  // Photo Upload Handler
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAvatar(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Workouts Split State ---
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

  // --- AI Coach Consultation Demo State ---
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
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-20">

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
              href="#profile-setup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-neutral-950 shadow-lg shadow-emerald-500/25 hover:bg-emerald-400 hover:scale-[1.02] transition active:scale-[0.98]"
            >
              <UserIcon className="h-4 w-4" />
              <span>{hasProfile ? "View / Edit Athlete Profile" : "Create Profile & Account to Unlock"}</span>
              <ArrowRight className="h-4 w-4" />
            </a>
            {!authUser && (
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-xl border border-neutral-700 bg-neutral-900/90 px-6 py-3 text-sm font-semibold text-white hover:bg-neutral-800 transition"
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
                <span>{googleLoading ? "Connecting Google..." : "Sign In with Google"}</span>
              </button>
            )}
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
              <Database className="h-4 w-4 text-amber-400" />
              <span>Supabase Cloud Sync</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. ATHLETE PROFILE & SUPABASE ACCOUNT CREATION CARD                      */}
      {/* ========================================================================= */}
      <section id="profile-setup" className="scroll-mt-6 space-y-6">
        {/* Welcome Green Banner */}
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-5 sm:p-6 backdrop-blur-md shadow-xl">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-bold text-emerald-400">
                Welcome to StrengthWise AI!
              </h3>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                Create your account and athlete profile below so our AI engine can compute your
                personalized daily calorie targets, macro splits, and periodized workout routines.
                Connecting your profile unlocks all navigation tabs below.
              </p>
            </div>
          </div>
        </div>

        {/* Profile Card */}
        <Card className="bg-neutral-900/80 border-neutral-800 p-6 sm:p-8 space-y-8 shadow-2xl">
          {/* Header & Status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800/80 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-white tracking-tight">Your Profile &amp; Account</h2>
                {hasProfile && (
                  <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-mono font-semibold text-emerald-400">
                    Active &amp; Unlocked
                  </span>
                )}
                {authUser && (
                  <span className="rounded-full bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 text-xs font-mono font-semibold text-cyan-400">
                    Supabase Connected
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-neutral-400 mt-1">
                {authUser
                  ? `Signed in as ${authUser.email}. Profile updates sync directly to your PostgreSQL database.`
                  : "Create an account with Google or email to save your profile permanently."}
              </p>
            </div>

            {hasProfile && (
              <button
                type="button"
                onClick={() => setShowProfileForm(!showProfileForm)}
                className="self-start sm:self-auto inline-flex items-center gap-1.5 rounded-xl border border-neutral-700 bg-neutral-800/80 px-3.5 py-2 text-xs font-semibold text-neutral-200 hover:bg-neutral-700 hover:text-white transition"
              >
                <Edit3 className="h-3.5 w-3.5 text-emerald-400" />
                <span>{showProfileForm ? "Collapse Editor" : "Edit Profile Settings"}</span>
              </button>
            )}
          </div>

          {/* Success Message Banner */}
          {saveSuccessMsg && (
            <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-4 text-xs font-medium text-emerald-300">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {/* Error Message Banner */}
          {authErrorMsg && (
            <div className="flex flex-col gap-2 rounded-xl border border-red-900/40 bg-red-950/30 p-4 text-xs text-red-300">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                <span>{authErrorMsg}</span>
              </div>
              {authErrorMsg.toLowerCase().includes("confirmed") && (
                <button
                  type="button"
                  onClick={handleInstantVerify}
                  disabled={isVerifyingDev}
                  className="self-start mt-1 inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/20 px-2.5 py-1 text-xs font-medium text-emerald-300 hover:bg-emerald-500/30 transition"
                >
                  <Zap className="h-3.5 w-3.5" />
                  <span>{isVerifyingDev ? "Verifying..." : "Click here to Instant Verify & Activate"}</span>
                </button>
              )}
            </div>
          )}

          {/* Email Confirmation Pending Screen */}
          {emailConfirmationSent && (
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 space-y-4 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                <MailCheck className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">Confirmation Email Requested</h4>
                <p className="text-xs text-neutral-400">
                  Supabase sent a confirmation link to <span className="font-mono text-emerald-300">{email}</span>.
                </p>
                <p className="text-xs text-neutral-500">
                  Don&apos;t want to wait for email delivery? Click Instant Verify below to activate immediately.
                </p>
              </div>
              <button
                type="button"
                onClick={handleInstantVerify}
                disabled={isVerifyingDev}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-bold text-neutral-950 hover:bg-emerald-400 transition"
              >
                <Zap className="h-3.5 w-3.5 fill-current" />
                <span>{isVerifyingDev ? "Activating..." : "Instant Verify & Save Profile"}</span>
              </button>
            </div>
          )}

          {/* Form Content */}
          {showProfileForm && !emailConfirmationSent ? (
            <form onSubmit={handleSaveProfile} className="space-y-8">

              {/* 1. GOOGLE OAUTH FAST ACTION (If not logged in) */}
              {!authUser && (
                <div className="space-y-3 rounded-2xl border border-neutral-800 bg-neutral-950/80 p-5">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="space-y-0.5 text-center sm:text-left">
                      <div className="text-xs font-bold text-white flex items-center justify-center sm:justify-start gap-1.5">
                        <Zap className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Quick Connect via Google</span>
                      </div>
                      <div className="text-[11px] text-neutral-400">
                        Authenticate with Google and save your profile to Supabase in one click.
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={googleLoading}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-xl border border-neutral-700 bg-neutral-900 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-neutral-800 hover:border-neutral-600 transition disabled:opacity-50"
                    >
                      {googleLoading ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin text-emerald-400" />
                          <span>Connecting...</span>
                        </>
                      ) : (
                        <>
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
                        </>
                      )}
                    </button>
                  </div>

                  <div className="relative flex items-center justify-center pt-2">
                    <div className="w-full border-t border-neutral-800" />
                    <span className="absolute bg-neutral-950 px-2.5 text-[10px] uppercase tracking-wider text-neutral-500 font-semibold">
                      Or Create with Email &amp; Password
                    </span>
                  </div>
                </div>
              )}

              {/* 2. PROFILE PICTURE & ACCOUNT SECTION */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 font-mono">
                    Profile Picture &amp; Account
                  </h3>
                  {!authUser && (
                    <div className="flex rounded-lg bg-neutral-950 p-1 border border-neutral-800">
                      <button
                        type="button"
                        onClick={() => setAuthMode("signup")}
                        className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition ${
                          authMode === "signup"
                            ? "bg-neutral-800 text-white shadow-xs"
                            : "text-neutral-400 hover:text-white"
                        }`}
                      >
                        Create Account
                      </button>
                      <button
                        type="button"
                        onClick={() => setAuthMode("signin")}
                        className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition ${
                          authMode === "signin"
                            ? "bg-neutral-800 text-white shadow-xs"
                            : "text-neutral-400 hover:text-white"
                        }`}
                      >
                        Sign In
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                  {/* Avatar Circle Display */}
                  <div className="relative group shrink-0">
                    <div className="h-20 w-20 rounded-full border-2 border-emerald-500/40 bg-neutral-950 flex items-center justify-center overflow-hidden text-3xl shadow-lg">
                      {avatar.startsWith("data:") || avatar.startsWith("http") ? (
                        <img src={avatar} alt="Profile" className="h-full w-full object-cover" />
                      ) : (
                        <span>{avatar}</span>
                      )}
                    </div>
                    <label
                      htmlFor="avatar-upload"
                      className="absolute bottom-0 right-0 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-emerald-500 text-neutral-950 shadow-md hover:bg-emerald-400 transition"
                      title="Upload custom photo"
                    >
                      <Camera className="h-3.5 w-3.5" />
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Avatar Controls */}
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-white">Custom Profile Picture</div>
                    <div className="text-[11px] text-neutral-400">
                      Upload your own photo or choose a fitness avatar preset below:
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <label
                        htmlFor="avatar-upload-btn"
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800/80 px-2.5 py-1.5 text-xs font-medium text-neutral-200 hover:bg-neutral-700 hover:text-white transition"
                      >
                        <Upload className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Upload Photo</span>
                        <input
                          id="avatar-upload-btn"
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                      </label>

                      {AVATAR_PRESETS.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setAvatar(preset)}
                          className={`h-8 w-8 rounded-lg border text-base flex items-center justify-center transition ${
                            avatar === preset
                              ? "border-emerald-500 bg-emerald-500/20 scale-110 shadow-sm shadow-emerald-500/30"
                              : "border-neutral-800 bg-neutral-950 hover:border-neutral-700 hover:scale-105"
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Account credentials */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-300">Full Name</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Alex Smith"
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-xs text-neutral-100 placeholder:text-neutral-600 focus:border-emerald-500 focus:outline-none transition"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-300">Email Address</label>
                    <input
                      type="email"
                      required
                      disabled={Boolean(authUser)}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex.smith@example.com"
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-xs text-neutral-100 placeholder:text-neutral-600 focus:border-emerald-500 focus:outline-none transition disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* Password field if not authenticated */}
                  {!authUser && (
                    <div className="space-y-1.5 sm:col-span-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-neutral-300">
                          {authMode === "signup" ? "Set Account Password" : "Enter Password"}
                        </label>
                        <span className="text-[11px] text-neutral-500">Minimum 6 characters</span>
                      </div>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-2.5 pl-3.5 pr-10 text-xs text-neutral-100 placeholder:text-neutral-600 focus:border-emerald-500 focus:outline-none transition"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-2.5 text-neutral-500 hover:text-neutral-300"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. ABOUT YOU SECTION (Biometrics) */}
              <div className="space-y-4 pt-4 border-t border-neutral-800/80">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 font-mono">
                  About You (Biometrics)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Age */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-300">Age</label>
                    <input
                      type="number"
                      min={14}
                      max={99}
                      required
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-xs text-neutral-100 placeholder:text-neutral-600 focus:border-emerald-500 focus:outline-none transition font-mono"
                    />
                  </div>

                  {/* Biological Sex */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-300">Biological Sex</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setGender("FEMALE")}
                        className={`rounded-xl py-2.5 text-xs font-bold transition border ${
                          gender === "FEMALE"
                            ? "bg-emerald-500 text-neutral-950 border-emerald-400 shadow-sm"
                            : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white"
                        }`}
                      >
                        Female
                      </button>
                      <button
                        type="button"
                        onClick={() => setGender("MALE")}
                        className={`rounded-xl py-2.5 text-xs font-bold transition border ${
                          gender === "MALE"
                            ? "bg-emerald-500 text-neutral-950 border-emerald-400 shadow-sm"
                            : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white"
                        }`}
                      >
                        Male
                      </button>
                    </div>
                  </div>

                  {/* Height ft & in */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-300">Height (ft)</label>
                    <input
                      type="number"
                      min={3}
                      max={7}
                      required
                      value={heightFt}
                      onChange={(e) => setHeightFt(e.target.value)}
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-xs text-neutral-100 focus:border-emerald-500 focus:outline-none transition font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-300">Height (in)</label>
                    <input
                      type="number"
                      min={0}
                      max={11}
                      required
                      value={heightIn}
                      onChange={(e) => setHeightIn(e.target.value)}
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-xs text-neutral-100 focus:border-emerald-500 focus:outline-none transition font-mono"
                    />
                  </div>

                  {/* Weights */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-300">Current Weight (lbs)</label>
                    <input
                      type="number"
                      min={70}
                      max={450}
                      required
                      value={currentWeightLbs}
                      onChange={(e) => setCurrentWeightLbs(e.target.value)}
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-xs text-neutral-100 focus:border-emerald-500 focus:outline-none transition font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-300">Goal Weight (lbs)</label>
                    <input
                      type="number"
                      min={70}
                      max={450}
                      required
                      value={goalWeightLbs}
                      onChange={(e) => setGoalWeightLbs(e.target.value)}
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-xs text-neutral-100 focus:border-emerald-500 focus:outline-none transition font-mono"
                    />
                  </div>
                </div>

                {/* Primary Training Goal */}
                <div className="space-y-1.5 pt-2">
                  <label className="text-xs font-semibold text-neutral-300">Primary Goal Phase</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setGoal("CUT")}
                      className={`rounded-xl py-2.5 px-3 text-xs font-bold transition border ${
                        goal === "CUT"
                          ? "bg-amber-500/20 border-amber-500 text-amber-400 shadow-sm"
                          : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white"
                      }`}
                    >
                      Fat Loss (-20%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setGoal("MAINTAIN")}
                      className={`rounded-xl py-2.5 px-3 text-xs font-bold transition border ${
                        goal === "MAINTAIN"
                          ? "bg-cyan-500/20 border-cyan-500 text-cyan-400 shadow-sm"
                          : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white"
                      }`}
                    >
                      Maintenance
                    </button>
                    <button
                      type="button"
                      onClick={() => setGoal("BULK")}
                      className={`rounded-xl py-2.5 px-3 text-xs font-bold transition border ${
                        goal === "BULK"
                          ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-sm"
                          : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white"
                      }`}
                    >
                      Muscle Surplus (+10%)
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-neutral-400 text-center sm:text-left">
                  {authUser
                    ? "Saves directly to your Supabase PostgreSQL database."
                    : "Creates your Supabase account, computes targets, and unlocks all tabs."}
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 px-7 py-3 text-xs font-bold text-neutral-950 shadow-lg shadow-emerald-500/25 hover:from-emerald-400 hover:to-emerald-300 hover:scale-[1.02] transition active:scale-[0.98] disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin text-neutral-950" />
                      <span>Saving Profile to Supabase...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 fill-current" />
                      <span>
                        {authUser
                          ? "Save Profile to Supabase & Unlock"
                          : authMode === "signup"
                          ? "Create Account & Save Profile"
                          : "Sign In & Save Profile"}
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : !emailConfirmationSent ? (
            /* Collapsed Profile Summary State */
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl bg-neutral-950/70 border border-neutral-800 p-5">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full border border-emerald-500/40 bg-neutral-900 flex items-center justify-center overflow-hidden text-2xl shadow-md">
                  {avatar.startsWith("data:") || avatar.startsWith("http") ? (
                    <img src={avatar} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <span>{avatar}</span>
                  )}
                </div>
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    {fullName || (authUser?.email ? authUser.email.split("@")[0] : "Athlete")}
                    <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                      Profile Active
                    </span>
                    {authUser && (
                      <span className="text-[10px] text-cyan-400 font-mono bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded">
                        Supabase Synced
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-neutral-400 mt-0.5">
                    {currentWeightLbs} lbs • {heightFt}&apos;{heightIn}&quot; • {gender.toLowerCase()} • {goal === "CUT" ? "Fat Loss" : goal === "BULK" ? "Muscle Surplus" : "Maintenance"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowProfileForm(true)}
                  className="rounded-xl border border-neutral-700 bg-neutral-800/80 px-4 py-2 text-xs font-semibold text-neutral-200 hover:bg-neutral-700 hover:text-white transition"
                >
                  Edit Profile
                </button>
                <a
                  href="#meals"
                  className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-neutral-950 hover:bg-emerald-400 transition"
                >
                  View Your Targets &darr;
                </a>
              </div>
            </div>
          ) : null}
        </Card>
      </section>

      {/* ========================================================================= */}
      {/* 3. MEALS SECTION (Metabolic Math & Nutrition Architecture)                */}
      {/* ========================================================================= */}
      <section id="meals" className="scroll-mt-6 space-y-8 relative">
        {/* If locked, display overlay */}
        {!hasProfile && (
          <div className="absolute -inset-2 z-20 rounded-3xl backdrop-blur-md bg-neutral-950/70 border border-neutral-800/80 flex flex-col items-center justify-center p-6 text-center shadow-2xl">
            <div className="max-w-md space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Lock className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-black text-white tracking-tight">
                Meals &amp; Nutrition Gated
              </h3>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                Create your account and athlete profile above so the Mifflin-St Jeor engine can calculate your
                exact customized calorie targets and macro splits.
              </p>
              <a
                href="#profile-setup"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-2.5 text-xs font-bold text-neutral-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition"
              >
                <span>Create Profile &amp; Account to Unlock</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        )}

        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">
            <Utensils className="h-3.5 w-3.5" />
            <span>Precision Sports Nutrition</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Metabolic Architecture &amp; Macro Distribution
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400">
            Clinical Mifflin-St Jeor metabolic calculations tailored to your exact bodyweight,
            biological sex, and training phase.
          </p>
        </div>

        {/* Live Interactive Nutrition Calculator Card */}
        <Card className="bg-neutral-900/80 border-neutral-800 p-6 sm:p-8 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Breakdown details */}
            <div className="lg:col-span-6 space-y-6">
              <div>
                <div className="text-xs uppercase font-mono tracking-wider text-emerald-400 font-bold mb-1">
                  Athlete Targets
                </div>
                <Title className="text-white text-base">
                  {fullName ? `${fullName}'s Nutritional Blueprint` : "Daily Metabolic Fuel"}
                </Title>
                <Text className="text-neutral-400 text-xs mb-3">
                  Calibrated for {numWeightLbs} lbs ({Math.round(numWeightKg)} kg) athlete in {goal === "CUT" ? "Fat Loss (-20%)" : goal === "BULK" ? "Muscle Surplus (+10%)" : "Maintenance"} phase:
                </Text>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setGoal("CUT")}
                    className={`rounded-xl py-2.5 px-3 text-xs font-bold transition border ${
                      goal === "CUT"
                        ? "bg-amber-500/20 border-amber-500 text-amber-400 shadow-sm"
                        : "bg-neutral-800/60 border-neutral-700 text-neutral-400 hover:text-white"
                    }`}
                  >
                    Fat Loss (-20%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setGoal("MAINTAIN")}
                    className={`rounded-xl py-2.5 px-3 text-xs font-bold transition border ${
                      goal === "MAINTAIN"
                        ? "bg-cyan-500/20 border-cyan-500 text-cyan-400 shadow-sm"
                        : "bg-neutral-800/60 border-neutral-700 text-neutral-400 hover:text-white"
                    }`}
                  >
                    Maintenance
                  </button>
                  <button
                    type="button"
                    onClick={() => setGoal("BULK")}
                    className={`rounded-xl py-2.5 px-3 text-xs font-bold transition border ${
                      goal === "BULK"
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-sm"
                        : "bg-neutral-800/60 border-neutral-700 text-neutral-400 hover:text-white"
                    }`}
                  >
                    Muscle Surplus (+10%)
                  </button>
                </div>
              </div>

              {/* Summary Breakdown */}
              <div className="rounded-xl bg-neutral-950 p-4 border border-neutral-800 space-y-2 text-xs">
                <div className="flex justify-between text-neutral-400">
                  <span>Computed Basal Metabolic Rate (BMR):</span>
                  <span className="text-neutral-200 font-mono">{calculated.bmr} kcal</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Active Expenditure (TDEE × 1.55):</span>
                  <span className="text-neutral-200 font-mono">{calculated.tdee} kcal</span>
                </div>
                <div className="flex justify-between font-bold border-t border-neutral-800/80 pt-2 text-white">
                  <span>Target Daily Intake:</span>
                  <span className="text-emerald-400 font-mono text-sm">{calculated.targetCalories} kcal / day</span>
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
                  {calculated.targetCalories} <span className="text-xs text-neutral-500 font-sans">KCAL</span>
                </div>
              </div>

              <DonutChart
                data={chartData}
                label="Target Grams"
                valueFormatter={(v) => `${v}g`}
                className="h-44 w-44"
              />

              {/* Macros grid */}
              <div className="grid grid-cols-3 gap-3 w-full text-center">
                <div className="rounded-xl bg-neutral-900 p-2.5 border border-emerald-500/20">
                  <div className="text-[10px] uppercase font-bold text-emerald-400">Protein</div>
                  <div className="text-base font-extrabold text-white font-mono">{calculated.targetProtein}g</div>
                  <div className="text-[10px] text-neutral-400">2.0g / kg</div>
                </div>
                <div className="rounded-xl bg-neutral-900 p-2.5 border border-cyan-500/20">
                  <div className="text-[10px] uppercase font-bold text-cyan-400">Carbs</div>
                  <div className="text-base font-extrabold text-white font-mono">{calculated.targetCarbs}g</div>
                  <div className="text-[10px] text-neutral-400">Glycogen fuel</div>
                </div>
                <div className="rounded-xl bg-neutral-900 p-2.5 border border-amber-500/20">
                  <div className="text-[10px] uppercase font-bold text-amber-400">Fats</div>
                  <div className="text-base font-extrabold text-white font-mono">{calculated.targetFat}g</div>
                  <div className="text-[10px] text-neutral-400">Hormone health</div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* ========================================================================= */}
      {/* 4. WORKOUTS SECTION (Adaptive Resistance Programming)                     */}
      {/* ========================================================================= */}
      <section id="workouts" className="scroll-mt-6 space-y-8 relative">
        {!hasProfile && (
          <div className="absolute -inset-2 z-20 rounded-3xl backdrop-blur-md bg-neutral-950/70 border border-neutral-800/80 flex flex-col items-center justify-center p-6 text-center shadow-2xl">
            <div className="max-w-md space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <Lock className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-black text-white tracking-tight">
                Workouts &amp; Periodization Gated
              </h3>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                Create your account and athlete profile above to unlock periodized workout splits tailored to
                your training frequency and target RPE.
              </p>
              <a
                href="#profile-setup"
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-6 py-2.5 text-xs font-bold text-neutral-950 shadow-lg shadow-cyan-500/20 hover:bg-cyan-400 transition"
              >
                <span>Create Profile &amp; Account to Unlock</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        )}

        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-400">
            <Dumbbell className="h-3.5 w-3.5" />
            <span>Resistance Training &amp; Periodization</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Adaptive Workouts &amp; Progressive Overload
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400">
            Systematic volume autoregulation based on RPE (Rating of Perceived Exertion) and RIR (Reps in Reserve).
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
        </Card>
      </section>

      {/* ========================================================================= */}
      {/* 5. PROGRESS SECTION (Telemetry & Performance Analytics)                   */}
      {/* ========================================================================= */}
      <section id="progress" className="scroll-mt-6 space-y-8 relative">
        {!hasProfile && (
          <div className="absolute -inset-2 z-20 rounded-3xl backdrop-blur-md bg-neutral-950/70 border border-neutral-800/80 flex flex-col items-center justify-center p-6 text-center shadow-2xl">
            <div className="max-w-md space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Lock className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-black text-white tracking-tight">
                Progress Telemetry Gated
              </h3>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                Create your account and athlete profile above to activate real-time telemetry, 1RM progress curves, and adherence monitoring.
              </p>
              <a
                href="#profile-setup"
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-2.5 text-xs font-bold text-neutral-950 shadow-lg shadow-amber-500/20 hover:bg-amber-400 transition"
              >
                <span>Create Profile &amp; Account to Unlock</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        )}

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
      </section>

      {/* ========================================================================= */}
      {/* 6. COACH SECTION (AI Strength & Nutrition Specialist)                     */}
      {/* ========================================================================= */}
      <section id="coach" className="scroll-mt-6 space-y-8 relative">
        {!hasProfile && (
          <div className="absolute -inset-2 z-20 rounded-3xl backdrop-blur-md bg-neutral-950/70 border border-neutral-800/80 flex flex-col items-center justify-center p-6 text-center shadow-2xl">
            <div className="max-w-md space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Lock className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-black text-white tracking-tight">
                AI Coach Specialist Gated
              </h3>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                Create your account and athlete profile above so the AI Coach has your biomechanical context,
                experience level, and injury history.
              </p>
              <a
                href="#profile-setup"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-2.5 text-xs font-bold text-neutral-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition"
              >
                <span>Create Profile &amp; Account to Unlock</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        )}

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
      {/* 7. CREATOR PROFILE SPOTLIGHT                                              */}
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
