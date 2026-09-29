"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Card,
  Text,
  Title,
  DonutChart,
  ProgressBar,
} from "@/components/tremor";
import {
  AlertCircle,
  ArrowRight,
  Camera,
  CheckCircle2,
  Database,
  Dumbbell,
  Edit3,
  ExternalLink,
  Eye,
  EyeOff,
  Flame,
  Globe,
  Lock,
  Mail,
  MailCheck,
  Plus,
  RefreshCw,
  Scan,
  Search,
  ShieldCheck,
  Shuffle,
  Sliders,
  Sparkles,
  Trash2,
  TrendingUp,
  Upload,
  User as UserIcon,
  Utensils,
  Zap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { calculateNutritionTargets } from "@/lib/calc";
import { FoodScannerModal } from "@/components/food-scanner-modal";
import { WorkoutModal } from "@/components/workout-modal";
import { CustomSplitModal } from "@/components/custom-split-modal";
import { CoachChat, type CoachAthleteContext } from "@/components/coach-chat";
import {
  CustomSplit,
  DEFAULT_CUSTOM_SPLIT,
  loadCustomSplit,
} from "@/lib/custom-split";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";

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
  const [authSubmitting, setAuthSubmitting] = useState(false);

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
  const [gender, setGender] = useState<"FEMALE" | "MALE">("MALE");
  const [heightFt, setHeightFt] = useState<number | string>(6);
  const [heightIn, setHeightIn] = useState<number | string>(3);
  const [currentWeightLbs, setCurrentWeightLbs] = useState<number | string>(185);
  const [goalWeightLbs, setGoalWeightLbs] = useState<number | string>(175);
  const [goal, setGoal] = useState<"CUT" | "MAINTAIN" | "BULK">("BULK");
  const [activityLevel, setActivityLevel] = useState<string>("MODERATE");

  // Calculations
  const numWeightLbs = Number(currentWeightLbs) || 185;
  const numWeightKg = numWeightLbs / 2.20462;
  const parsedFt = Number(heightFt) > 0 ? Number(heightFt) : 6;
  const parsedIn = !isNaN(Number(heightIn)) && Number(heightIn) >= 0 ? Number(heightIn) : 0;
  const totalInches = parsedFt * 12 + parsedIn;
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

  // --- Meal Logging & Food Scanner State ---
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerInitialMeal, setScannerInitialMeal] = useState<"BREAKFAST" | "LUNCH" | "DINNER" | "SNACK">("LUNCH");
  const [scannerInitialTab, setScannerInitialTab] = useState<"scan" | "search" | "quick">("scan");
  const [loggedMealsData, setLoggedMealsData] = useState<{
    meals: any[];
    grouped: { BREAKFAST: any[]; LUNCH: any[]; DINNER: any[]; SNACK: any[] };
    totals: { calories: number; protein: number; carbs: number; fat: number; fiber: number };
    remaining: { calories: number; protein: number; carbs: number; fat: number; fiber: number };
  }>({
    meals: [],
    grouped: { BREAKFAST: [], LUNCH: [], DINNER: [], SNACK: [] },
    totals: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
    remaining: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
  });

  const fetchLoggedMeals = async () => {
    try {
      const res = await fetch("/api/meals");
      if (res.ok) {
        const data = await res.json();
        setLoggedMealsData(data);
      }
    } catch (err) {
      console.warn("Failed to fetch meals:", err);
    }
  };

  const handleDeleteMeal = async (id: string) => {
    try {
      await fetch(`/api/meals?id=${id}`, { method: "DELETE" });
      await fetchLoggedMeals();
    } catch (err) {
      console.warn("Failed to delete meal:", err);
    }
  };

  // --- Workout Logging & Split Builder State ---
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
  const [workoutModalPresetName, setWorkoutModalPresetName] = useState<string>("");
  const [workoutModalPresetNotes, setWorkoutModalPresetNotes] = useState<string>("");
  const [workoutModalInitialMode, setWorkoutModalInitialMode] = useState<"routine" | "random" | "freeform">("routine");
  const [isCustomSplitModalOpen, setIsCustomSplitModalOpen] = useState(false);
  const [customSplit, setCustomSplit] = useState<CustomSplit>(DEFAULT_CUSTOM_SPLIT);
  const [loggedWorkoutsData, setLoggedWorkoutsData] = useState<{
    workouts: any[];
    summary: {
      totalWorkouts: number;
      thisWeekCount: number;
      totalMinutes: number;
      totalCalories: number;
      weeklyMinutes: number;
      weeklyCalories: number;
    };
  }>({
    workouts: [],
    summary: {
      totalWorkouts: 0,
      thisWeekCount: 0,
      totalMinutes: 0,
      totalCalories: 0,
      weeklyMinutes: 0,
      weeklyCalories: 0,
    },
  });

  const fetchLoggedWorkouts = async () => {
    try {
      const res = await fetch("/api/workouts");
      if (res.ok) {
        const data = await res.json();
        setLoggedWorkoutsData(data);
      }
    } catch (err) {
      console.warn("Failed to fetch workouts:", err);
    }
  };

  const handleDeleteWorkout = async (id: string) => {
    try {
      await fetch(`/api/workouts?id=${id}`, { method: "DELETE" });
      await fetchLoggedWorkouts();
    } catch (err) {
      console.warn("Failed to delete workout:", err);
    }
  };

  // Helper to load profile for an authenticated user
  const loadProfileForUser = async (user: User) => {
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        if (data.profile) {
          setHasProfile(true);
          setShowProfileForm(false);
          if (data.profile.avatar) setAvatar(data.profile.avatar);
          if (data.user?.name) {
            setFullName(data.user.name);
          } else if (data.profile.name) {
            setFullName(data.profile.name);
          } else if (data.profile.firstName) {
            setFullName(`${data.profile.firstName} ${data.profile.lastName || ""}`.trim());
          }
          if (data.profile.age) setAge(data.profile.age);
          if (data.profile.gender) setGender(data.profile.gender);
          if (data.profile.heightCm) {
            const totalIn = Math.round(data.profile.heightCm / 2.54);
            setHeightFt(Math.floor(totalIn / 12));
            setHeightIn(totalIn % 12);
          }
          if (data.profile.weightKg) setCurrentWeightLbs(Math.round(data.profile.weightKg * 2.20462));
          if (data.profile.goalWeightKg) setGoalWeightLbs(Math.round(data.profile.goalWeightKg * 2.20462));
          if (data.profile.goal) setGoal(data.profile.goal === "LOSE_WEIGHT" ? "CUT" : data.profile.goal === "BUILD_MUSCLE" ? "BULK" : "MAINTAIN");
          if (data.profile.activityLevel) setActivityLevel(data.profile.activityLevel);
          if (data.profile.splitDays) setUserSplitDays(data.profile.splitDays);
          if (data.profile.splitType) setUserSplitType(data.profile.splitType);

          // Sync local storage so other components & tabs remain perfectly aligned
          if (typeof window !== "undefined") {
            try {
              const currentStored = localStorage.getItem("sw_athlete_profile");
              const parsedExisting = currentStored ? JSON.parse(currentStored) : {};
              const totalIn = data.profile.heightCm ? Math.round(data.profile.heightCm / 2.54) : 75;
              const hFt = data.profile.heightCm ? Math.floor(totalIn / 12) : (parsedExisting.heightFt || 6);
              const hIn = data.profile.heightCm ? (totalIn % 12) : (parsedExisting.heightIn ?? 3);
              const localPayload = {
                ...parsedExisting,
                isCompleted: true,
                fullName: data.user?.name || (data.profile.firstName ? `${data.profile.firstName} ${data.profile.lastName || ""}`.trim() : parsedExisting.fullName),
                avatar: parsedExisting.avatar || avatar,
                age: data.profile.age || parsedExisting.age,
                gender: data.profile.gender || parsedExisting.gender,
                heightFt: hFt,
                heightIn: hIn,
                heightCm: data.profile.heightCm || (hFt * 12 + hIn) * 2.54,
                weightLbs: data.profile.weightKg ? Math.round(data.profile.weightKg * 2.20462) : parsedExisting.weightLbs,
                goalWeightLbs: data.profile.goalWeightKg ? Math.round(data.profile.goalWeightKg * 2.20462) : parsedExisting.goalWeightLbs,
                goal: data.profile.goal === "LOSE_WEIGHT" ? "CUT" : data.profile.goal === "BUILD_MUSCLE" ? "BULK" : "MAINTAIN",
                activityLevel: data.profile.activityLevel || parsedExisting.activityLevel,
                splitDays: data.profile.splitDays || parsedExisting.splitDays || 4,
                splitType: data.profile.splitType || parsedExisting.splitType || "Upper / Lower Power & Hypertrophy",
                updatedAt: new Date().toISOString(),
              };
              localStorage.setItem("sw_athlete_profile", JSON.stringify(localPayload));
            } catch {}
          }
          return true;
        }
      }
    } catch {
      // Fallback to local storage
    }

    const stored = typeof window !== "undefined" ? localStorage.getItem("sw_athlete_profile") : null;
    if (stored) {
      try {
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
          if (p.heightIn !== undefined && p.heightIn !== null && p.heightIn !== "") setHeightIn(p.heightIn);
          if (p.weightLbs) setCurrentWeightLbs(p.weightLbs);
          if (p.goalWeightLbs) setGoalWeightLbs(p.goalWeightLbs);
          if (p.goal) setGoal(p.goal);
          if (p.activityLevel) setActivityLevel(p.activityLevel);
          if (p.splitDays) setUserSplitDays(p.splitDays);
          if (p.splitType || p.targets?.splitInfo?.name) setUserSplitType(p.splitType || p.targets?.splitInfo?.name);
          return true;
        }
      } catch {}
    }

    setHasProfile(false);
    setShowProfileForm(true);
    return false;
  };

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
          await loadProfileForUser(currentUser);
          await fetchLoggedMeals();
          await fetchLoggedWorkouts();

          if (typeof window !== "undefined") {
            const loadedCustom = loadCustomSplit();
            setCustomSplit(loadedCustom);
          }
        } else {
          // Guest state: no profile allowed without an account
          setHasProfile(false);
          setShowProfileForm(false);
          if (typeof window !== "undefined") {
            localStorage.removeItem("sw_athlete_profile");
            document.cookie = "sw_athlete_profile=; path=/; max-age=0";
            window.dispatchEvent(new Event("sw_profile_updated"));
          }
        }
      } catch (err) {
        console.warn("Init session error:", err);
      }
    }

    initSessionAndProfile();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event: AuthChangeEvent, session: Session | null) => {
      if (session?.user) {
        setAuthUser(session.user);
        if (session.user.email) setEmail(session.user.email);
        if (session.user.user_metadata?.full_name) setFullName(session.user.user_metadata.full_name);
        await loadProfileForUser(session.user);
        await fetchLoggedMeals();
        await fetchLoggedWorkouts();
      } else {
        setAuthUser(null);
        setHasProfile(false);
        setShowProfileForm(false);
        if (typeof window !== "undefined") {
          localStorage.removeItem("sw_athlete_profile");
          document.cookie = "sw_athlete_profile=; path=/; max-age=0";
          window.dispatchEvent(new Event("sw_profile_updated"));
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Real-time synchronization when profile is updated from /profile or another tab
  useEffect(() => {
    const handleProfileUpdate = () => {
      if (authUser) {
        loadProfileForUser(authUser);
        fetchLoggedWorkouts();
      }
    };

    window.addEventListener("sw_profile_updated", handleProfileUpdate);
    window.addEventListener("storage", handleProfileUpdate);
    return () => {
      window.removeEventListener("sw_profile_updated", handleProfileUpdate);
      window.removeEventListener("storage", handleProfileUpdate);
    };
  }, [authUser]);

  // 2. Google OAuth Handler (Step 1)
  const handleGoogleSignIn = async () => {
    setAuthErrorMsg(null);
    setGoogleLoading(true);

    try {
      const origin = window.location.origin;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/auth/callback?next=/profile`,
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

  // 3. Step 1: Account Creation & Sign In Handler
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthErrorMsg(null);
    setSaveSuccessMsg(null);
    setAuthSubmitting(true);

    try {
      if (!email || !password) {
        setAuthErrorMsg("Please enter both an email and password.");
        setAuthSubmitting(false);
        return;
      }

      if (password.length < 6) {
        setAuthErrorMsg("Password must be at least 6 characters long.");
        setAuthSubmitting(false);
        return;
      }

      const origin = window.location.origin;

      if (authMode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName || email.split("@")[0],
            },
            emailRedirectTo: `${origin}/auth/callback`,
          },
        });

        if (error) {
          setAuthErrorMsg(error.message);
          setAuthSubmitting(false);
          return;
        }

        if (data.session?.user) {
          setAuthUser(data.session.user);
          setSaveSuccessMsg("Account created! Now complete Step 2 below to set up your athlete profile.");
          setShowProfileForm(true);
          setHasProfile(false);
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
            setAuthErrorMsg("Email address has not been confirmed yet. Click 'Instant Verify' to activate.");
          } else {
            setAuthErrorMsg(error.message);
          }
          setAuthSubmitting(false);
          return;
        }

        if (data.session?.user) {
          setAuthUser(data.session.user);
          const hasExisting = await loadProfileForUser(data.session.user);
          if (hasExisting) {
            setSaveSuccessMsg("Signed in successfully! Welcome back.");
          } else {
            setSaveSuccessMsg("Signed in successfully! Please complete your athlete profile in Step 2 below.");
            setShowProfileForm(true);
          }
        }
      }
    } catch (err: unknown) {
      setAuthErrorMsg(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setAuthSubmitting(false);
    }
  };

  // 4. Instant Dev Verification Handler
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
          const hasExisting = await loadProfileForUser(signData.session.user);
          if (hasExisting) {
            setSaveSuccessMsg("Account verified and signed in! Welcome back.");
          } else {
            setSaveSuccessMsg("Account verified! Now proceed with Step 2 below to configure your athlete profile.");
            setShowProfileForm(true);
          }
          return;
        }
      }
      setEmailConfirmationSent(false);
      setAuthMode("signin");
      setSaveSuccessMsg("Account verified! Enter your password and click 'Sign In' below.");
    } catch (err: unknown) {
      setAuthErrorMsg(err instanceof Error ? err.message : "Verification failed.");
    } finally {
      setIsVerifyingDev(false);
    }
  };

  // 5. Sign Out Handler
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setAuthUser(null);
      setHasProfile(false);
      setShowProfileForm(false);
      if (typeof window !== "undefined") {
        localStorage.removeItem("sw_athlete_profile");
        document.cookie = "sw_athlete_profile=; path=/; max-age=0";
        window.dispatchEvent(new Event("sw_profile_updated"));
      }
    } catch (err) {
      console.warn("Sign out error:", err);
    }
  };

  // 6. Commit Profile to Supabase & Database (Step 2)
  const commitProfileToDatabase = async (activeUser: User) => {
    const profilePayload = {
      fullName: fullName || activeUser.email?.split("@")[0] || "Athlete",
      name: fullName || activeUser.email?.split("@")[0] || "Athlete",
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
      fullName: fullName || (activeUser.email ? activeUser.email.split("@")[0] : "Athlete"),
      email: activeUser.email || email || "",
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
    setSaveSuccessMsg("🎉 Athlete profile created & saved to your account! Meals, Workouts, Progress, and AI Coach unlocked.");

    setTimeout(() => {
      const mealsEl = document.getElementById("meals");
      if (mealsEl) {
        mealsEl.scrollIntoView({ behavior: "smooth" });
      }
    }, 600);
  };

  // 7. Handle Step 2 Athlete Profile Form Submit
  const handleSaveAthleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthErrorMsg(null);
    setSaveSuccessMsg(null);

    if (!authUser) {
      setAuthErrorMsg("Please create an account or sign in first (Step 1) before configuring your athlete profile.");
      return;
    }

    setIsSaving(true);
    try {
      await commitProfileToDatabase(authUser);
    } catch (err: unknown) {
      setAuthErrorMsg(err instanceof Error ? err.message : "Failed to save athlete profile.");
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
  const [userSplitDays, setUserSplitDays] = useState<number>(4);
  const [userSplitType, setUserSplitType] = useState<string>("Upper / Lower Power & Hypertrophy");

  const activeSplit = useMemo<"ppl" | "upper_lower" | "full_body" | "hybrid_ppl" | "custom">(() => {
    if (userSplitType.toLowerCase().includes("custom")) return "custom";
    if (userSplitDays === 3 || userSplitType.toLowerCase().includes("full body")) return "full_body";
    if (userSplitDays === 4 || userSplitType.toLowerCase().includes("upper") || userSplitType.toLowerCase().includes("lower")) return "upper_lower";
    if (userSplitDays === 5 || userSplitType.toLowerCase().includes("hybrid")) return "hybrid_ppl";
    if (userSplitDays === 6 || userSplitType.toLowerCase().includes("ppl")) return "ppl";
    return "upper_lower";
  }, [userSplitDays, userSplitType]);

  const splitDetails: Record<
    "ppl" | "upper_lower" | "full_body" | "hybrid_ppl",
    {
      name: string;
      frequency: string;
      badge: string;
      description: string;
      days: { name: string; lifts: string }[];
      targetSets: number;
    }
  > = {
    upper_lower: {
      name: "Upper / Lower Split",
      frequency: "4 Days / Week",
      badge: "Upper / Lower (4-Day)",
      description: "Ideal balance of high mechanical load, heavy compound progression, and optimal systemic neurological recovery.",
      days: [
        { name: "Upper A (Strength)", lifts: "Flat Barbell Bench (4×5 @ RPE 8.5), Weighted Chin-ups (4×6), Seated Cable Row (3×8), Skull Crushers (3×10)" },
        { name: "Lower A (Quad Bias)", lifts: "Back Squat (4×6 @ RPE 8), Leg Press (3×10), Walking Lunges (3×12), Seated Leg Curls (4×12)" },
        { name: "Upper B (Hypertrophy)", lifts: "Incline DB Press (3×10), Chest-Supported T-Bar Row (3×10), DB Lateral Raises (4×15), Hammer Curls (3×12)" },
        { name: "Lower B (Posterior)", lifts: "Romanian Deadlift (4×8 @ RPE 8), Hack Squat (3×10), Lying Leg Curl (4×12), Standing Calf Raise (4×15)" },
      ],
      targetSets: 14,
    },
    ppl: {
      name: "Push / Pull / Legs (PPL)",
      frequency: "6 Days / Week",
      badge: "Push / Pull / Legs (PPL)",
      description: "Gold standard for hypertrophy. Groups muscles by movement pattern, providing 48-72h recovery per muscle group.",
      days: [
        { name: "Push Day", lifts: "Incline DB Press (4×8 @ RPE 8), Overhead Press (3×10), Cable Lateral Raises (4×15), Tricep Pressdowns (3×12)" },
        { name: "Pull Day", lifts: "Barbell Row (4×6-8 @ RPE 8.5), Neutral Lat Pulldown (3×10), Face Pulls (4×15), Incline Dumbbell Curls (3×12)" },
        { name: "Legs Day", lifts: "Barbell Squat (4×6-8 @ RPE 8), Romanian Deadlift (3×8-10), Bulgarian Split Squat (3×10/leg), Standing Calf Raises (4×15)" },
      ],
      targetSets: 16,
    },
    hybrid_ppl: {
      name: "PPL + Upper / Lower Hybrid Split",
      frequency: "5 Days / Week",
      badge: "Hybrid PPL (5-Day)",
      description: "High-frequency protocol combining dedicated push/pull/legs sessions with targeted upper/lower volume.",
      days: [
        { name: "Push Day", lifts: "Incline Barbell Bench (4×6-8), DB Shoulder Press (3×10), Lateral Raises (4×15), Tricep Dips (3×10)" },
        { name: "Pull Day", lifts: "Barbell Deadlift (3×5), Chest-Supported Row (4×8), Lat Pulldown (3×10), Incline DB Curls (3×12)" },
        { name: "Legs Day", lifts: "Back Squat (4×6-8), Romanian Deadlift (3×8), Bulgarian Split Squats (3×10/leg), Calf Raises (4×15)" },
        { name: "Upper Focus", lifts: "Overhead Press (4×6), Weighted Pull-ups (3×6), Cable Flyes (3×12), Hammer Curls (3×12)" },
        { name: "Lower & Core", lifts: "Front Squat (3×8), Lying Hamstring Curl (4×10), Hanging Leg Raises (4×12), Ab Wheel (3×15)" },
      ],
      targetSets: 15,
    },
    full_body: {
      name: "Full Body Frequency",
      frequency: "3 Days / Week",
      badge: "Full Body Frequency (3-Day)",
      description: "High-efficiency periodization that stimulates muscle protein synthesis across the entire kinetic chain every 48 hours.",
      days: [
        { name: "Session A", lifts: "Front Squat (3×8 @ RPE 8), Flat DB Bench (3×8), Chest-Supported Row (3×10), DB Lateral Raises (3×15)" },
        { name: "Session B", lifts: "Trap Bar Deadlift (3×6 @ RPE 8), Overhead Press (3×8), Lat Pulldown (3×10), Lying Leg Curl (3×12)" },
        { name: "Session C", lifts: "Bulgarian Split Squat (3×10/leg), Incline DB Bench (3×10), Cable Rows (3×12), DB Bicep / Tricep Superset (3×12)" },
      ],
      targetSets: 12,
    },
  };

  const currentSplit = useMemo(() => {
    if (activeSplit === "custom") {
      return {
        name: customSplit.name || "Custom Split",
        frequency: `${customSplit.daysCount || customSplit.days.length} Days / Week`,
        badge: `Custom Split (${customSplit.daysCount || customSplit.days.length}-Day)`,
        description:
          customSplit.description ||
          "Personalized split tailored to specific weak-points and weekly schedule.",
        days: customSplit.days.map((d) => ({ name: d.name, lifts: d.lifts })),
        targetSets: customSplit.targetSets || 14,
      };
    }
    return splitDetails[activeSplit] || splitDetails.upper_lower;
  }, [activeSplit, customSplit, splitDetails]);

  const handleSelectSplit = (splitKey: "full_body" | "upper_lower" | "hybrid_ppl" | "ppl" | "custom") => {
    if (splitKey === "custom") {
      setUserSplitType("CUSTOM");
      const d = customSplit.daysCount || customSplit.days.length || 4;
      setUserSplitDays(d);
      try {
        const stored = localStorage.getItem("sw_athlete_profile");
        if (stored) {
          const p = JSON.parse(stored);
          p.splitType = "CUSTOM";
          p.splitDays = d;
          localStorage.setItem("sw_athlete_profile", JSON.stringify(p));
        }
      } catch {}
    } else {
      const daysMap = { full_body: 3, upper_lower: 4, hybrid_ppl: 5, ppl: 6 };
      const nameMap = {
        full_body: "Full Body Foundation Split",
        upper_lower: "Upper / Lower Power & Hypertrophy",
        hybrid_ppl: "PPL + Upper / Lower Hybrid Split",
        ppl: "Push / Pull / Legs (PPL x 2) Elite Split",
      };
      setUserSplitType(nameMap[splitKey]);
      setUserSplitDays(daysMap[splitKey]);
      try {
        const stored = localStorage.getItem("sw_athlete_profile");
        if (stored) {
          const p = JSON.parse(stored);
          p.splitType = nameMap[splitKey];
          p.splitDays = daysMap[splitKey];
          localStorage.setItem("sw_athlete_profile", JSON.stringify(p));
        }
      } catch {}
    }
  };

  // --- AI Coach Athlete Biometric & Split Context ---
  const coachAthleteContext: CoachAthleteContext = useMemo(() => ({
    fullName: fullName || (authUser?.email ? authUser.email.split("@")[0] : "Athlete"),
    weightLbs: numWeightLbs,
    weightKg: numWeightKg,
    heightCm: heightCm,
    age: Number(age) || undefined,
    gender,
    goal,
    activityLevel,
    splitType: userSplitType,
    splitDays: userSplitDays,
    targetCalories: calculated.targetCalories,
    targetProtein: calculated.targetProtein,
    targetCarbs: calculated.targetCarbs,
    targetFat: calculated.targetFat,
  }), [fullName, authUser, numWeightLbs, numWeightKg, heightCm, age, gender, goal, activityLevel, userSplitType, userSplitDays, calculated]);

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
              <span>
                {hasProfile
                  ? "View / Edit Athlete Profile"
                  : authUser
                  ? "Complete Athlete Profile (Step 2)"
                  : "Create Account to Get Started"}
              </span>
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

          {/* 2-Step Workflow Progress Stepper */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800/80">
            {/* Step 1 Pill */}
            <div className={`flex items-center gap-3 p-3 rounded-xl border transition ${
              authUser
                ? "bg-emerald-950/30 border-emerald-500/30"
                : "bg-emerald-500/10 border-emerald-500/40 shadow-sm shadow-emerald-500/10"
            }`}>
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold font-mono transition ${
                authUser
                  ? "bg-emerald-500 text-neutral-950"
                  : "bg-emerald-500 text-neutral-950 animate-pulse"
              }`}>
                {authUser ? <CheckCircle2 className="h-4 w-4" /> : "1"}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Step 1: Account Authentication</span>
                  {authUser ? (
                    <span className="text-[10px] text-emerald-400 font-semibold">(Complete)</span>
                  ) : (
                    <span className="text-[10px] text-emerald-400 font-semibold">(Current Step)</span>
                  )}
                </div>
                <div className="text-[11px] text-neutral-400 truncate">
                  {authUser ? authUser.email : "Create account or sign in first"}
                </div>
              </div>
            </div>

            {/* Step 2 Pill */}
            <div className={`flex items-center gap-3 p-3 rounded-xl border transition ${
              hasProfile
                ? "bg-emerald-950/30 border-emerald-500/30"
                : authUser
                ? "bg-emerald-500/10 border-emerald-500/40 shadow-sm shadow-emerald-500/10"
                : "bg-neutral-950 border-neutral-800/60 opacity-60"
            }`}>
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold font-mono transition ${
                hasProfile
                  ? "bg-emerald-500 text-neutral-950"
                  : authUser
                  ? "bg-emerald-500 text-neutral-950 animate-pulse"
                  : "bg-neutral-800 text-neutral-500"
              }`}>
                {hasProfile ? <CheckCircle2 className="h-4 w-4" /> : !authUser ? <Lock className="h-3.5 w-3.5" /> : "2"}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Step 2: Athlete Profile &amp; Biometrics</span>
                  {hasProfile ? (
                    <span className="text-[10px] text-emerald-400 font-semibold">(Active)</span>
                  ) : authUser ? (
                    <span className="text-[10px] text-emerald-400 font-semibold">(Next Step)</span>
                  ) : (
                    <span className="text-[10px] text-neutral-500 font-normal">Locked</span>
                  )}
                </div>
                <div className="text-[11px] text-neutral-400">
                  {hasProfile ? "Macros & training calibrated" : !authUser ? "Requires account created in Step 1" : "Configure biometrics & macros"}
                </div>
              </div>
            </div>
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

          {/* Main 2-Step Interactive Flow */}
          {!emailConfirmationSent && (
            <>
              {/* ============================================================== */}
              {/* CASE 1: GUEST USER (NOT AUTHENTICATED)                         */}
              {/* Step 1 is ACTIVE, Step 2 is LOCKED                             */}
              {/* ============================================================== */}
              {!authUser ? (
                <div className="space-y-8">
                  {/* Step 1: Account Creation & Sign In Box */}
                  <div className="space-y-6 rounded-2xl border border-emerald-500/30 bg-neutral-950/70 p-5 sm:p-6 shadow-xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800/80 pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-400 uppercase">
                            Step 1 of 2
                          </span>
                          <h3 className="text-base font-bold text-white">Create Account or Sign In</h3>
                        </div>
                        <p className="text-xs text-neutral-400 mt-1">
                          An account is required first because your athlete profile and metabolic data are securely linked to your account.
                        </p>
                      </div>

                      <div className="flex rounded-lg bg-neutral-900 p-1 border border-neutral-800 self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={() => setAuthMode("signup")}
                          className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                            authMode === "signup" ? "bg-emerald-500 text-neutral-950 shadow-sm" : "text-neutral-400 hover:text-white"
                          }`}
                        >
                          Create Account
                        </button>
                        <button
                          type="button"
                          onClick={() => setAuthMode("signin")}
                          className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                            authMode === "signin" ? "bg-emerald-500 text-neutral-950 shadow-sm" : "text-neutral-400 hover:text-white"
                          }`}
                        >
                          Sign In
                        </button>
                      </div>
                    </div>

                    {/* Google OAuth Quick Connect */}
                    <div className="space-y-3 rounded-xl border border-neutral-800/80 bg-neutral-900/60 p-4">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="space-y-0.5 text-center sm:text-left">
                          <div className="text-xs font-bold text-white flex items-center justify-center sm:justify-start gap-1.5">
                            <Zap className="h-3.5 w-3.5 text-emerald-400" />
                            <span>Quick Sign-In with Google</span>
                          </div>
                          <div className="text-[11px] text-neutral-400">
                            Instantly authenticate and advance to Step 2 profile configuration.
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleGoogleSignIn}
                          disabled={googleLoading}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-xl border border-neutral-700 bg-neutral-950 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-neutral-800 hover:border-neutral-600 transition disabled:opacity-50"
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
                        <span className="absolute bg-neutral-900 px-2.5 text-[10px] uppercase tracking-wider text-neutral-500 font-semibold">
                          Or Continue with Email &amp; Password
                        </span>
                      </div>
                    </div>

                    {/* Email/Password Auth Form */}
                    <form onSubmit={handleAuthSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {authMode === "signup" && (
                          <div className="space-y-1.5 sm:col-span-2">
                            <label className="text-xs font-semibold text-neutral-300">Your Full Name</label>
                            <input
                              type="text"
                              required
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              placeholder="e.g. Alex Smith"
                              className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2.5 text-xs text-neutral-100 placeholder:text-neutral-600 focus:border-emerald-500 focus:outline-none transition"
                            />
                          </div>
                        )}

                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-neutral-300">Email Address</label>
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="alex.smith@example.com"
                            className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2.5 text-xs text-neutral-100 placeholder:text-neutral-600 focus:border-emerald-500 focus:outline-none transition"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-neutral-300">
                              {authMode === "signup" ? "Set Account Password" : "Password"}
                            </label>
                            {authMode === "signup" && <span className="text-[11px] text-neutral-500">Min 6 chars</span>}
                          </div>
                          <div className="relative">
                            <input
                              type={showPassword ? "text" : "password"}
                              required
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="••••••••"
                              className="w-full rounded-xl border border-neutral-800 bg-neutral-900 py-2.5 pl-3.5 pr-10 text-xs text-neutral-100 placeholder:text-neutral-600 focus:border-emerald-500 focus:outline-none transition"
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
                      </div>

                      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="text-xs text-neutral-400">
                          {authMode === "signup"
                            ? "Step 1 of 2: Create your account, then calibrate your athlete profile in Step 2."
                            : "Sign in to access your linked athlete profile and training dashboard."}
                        </div>

                        <button
                          type="submit"
                          disabled={authSubmitting}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-2.5 text-xs font-bold text-neutral-950 shadow-md shadow-emerald-500/25 hover:bg-emerald-400 hover:scale-[1.02] transition active:scale-[0.98] disabled:opacity-50"
                        >
                          {authSubmitting ? (
                            <>
                              <RefreshCw className="h-3.5 w-3.5 animate-spin text-neutral-950" />
                              <span>{authMode === "signup" ? "Creating Account..." : "Signing In..."}</span>
                            </>
                          ) : (
                            <>
                              <span>{authMode === "signup" ? "Create Account & Proceed to Step 2" : "Sign In & Continue"}</span>
                              <ArrowRight className="h-3.5 w-3.5" />
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Step 2: Locked Athlete Profile Preview Box */}
                  <div className="relative rounded-2xl border border-neutral-800 bg-neutral-950/40 p-6 overflow-hidden">
                    {/* Glassmorphic Lock Overlay */}
                    <div className="absolute inset-0 z-10 backdrop-blur-[2px] bg-neutral-950/70 flex flex-col items-center justify-center p-6 text-center">
                      <div className="max-w-md space-y-3">
                        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                          <Lock className="h-5 w-5" />
                        </div>
                        <h4 className="text-base font-bold text-white">Step 2: Athlete Profile &amp; Biometrics (Locked)</h4>
                        <p className="text-xs text-neutral-300 leading-relaxed">
                          Your athlete profile can only be created once an account is established. Complete Step 1 above to unlock this section.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            const el = document.getElementById("profile-setup");
                            if (el) el.scrollIntoView({ behavior: "smooth" });
                          }}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition"
                        >
                          <span>Complete Step 1 Above to Unlock</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Dimmed Preview of Step 2 Content */}
                    <div className="opacity-25 pointer-events-none space-y-6 select-none">
                      <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="rounded-md bg-neutral-800 px-2 py-0.5 text-[10px] font-mono text-neutral-400">
                            Step 2 of 2
                          </span>
                          <span className="text-sm font-bold text-neutral-400">Athlete Profile &amp; Biometrics</span>
                        </div>
                        <span className="text-xs text-neutral-500">Mifflin-St Jeor Engine</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-3 space-y-1">
                          <div className="text-[10px] text-neutral-500">Age</div>
                          <div className="text-sm font-bold text-neutral-300">26 yrs</div>
                        </div>
                        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-3 space-y-1">
                          <div className="text-[10px] text-neutral-500">Biological Sex</div>
                          <div className="text-sm font-bold text-neutral-300">Female / Male</div>
                        </div>
                        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-3 space-y-1">
                          <div className="text-[10px] text-neutral-500">Height &amp; Weight</div>
                          <div className="text-sm font-bold text-neutral-300">5&apos;8&quot; • 155 lbs</div>
                        </div>
                        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-3 space-y-1">
                          <div className="text-[10px] text-neutral-500">Calorie Target</div>
                          <div className="text-sm font-bold text-emerald-400">Calculated on Unlock</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : showProfileForm ? (
                /* ============================================================== */
                /* CASE 2: AUTHENTICATED USER CONFIGURING OR EDITING PROFILE       */
                /* Step 1 is COMPLETED, Step 2 Form is ACTIVE                     */
                /* ============================================================== */
                <div className="space-y-6">
                  {/* Step 1 Completed Ribbon */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-emerald-500/25 bg-emerald-950/25 p-3.5 text-xs">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span className="text-neutral-300">
                        <strong className="text-white">Step 1 Complete:</strong> Signed in as{" "}
                        <span className="font-mono text-emerald-400 font-semibold">{authUser.email}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href="/profile"
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-1 text-[11px] font-bold text-emerald-400 hover:bg-emerald-500/30 transition"
                      >
                        <UserIcon className="h-3 w-3" />
                        <span>Open Profile & Split Studio</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="text-[11px] font-medium text-neutral-400 hover:text-white underline underline-offset-2 transition ml-2"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>

                  {/* Step 2 Form */}
                  <form onSubmit={handleSaveAthleteProfile} className="space-y-8">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-400 uppercase">
                          Step 2 of 2
                        </span>
                        <h3 className="text-base font-bold text-white">Athlete Biometrics &amp; Metabolic Calibration</h3>
                      </div>
                      <span className="text-xs text-neutral-500 hidden sm:inline">Linked to {authUser.email}</span>
                    </div>

                    {/* Profile Picture & Identity */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 font-mono">
                        Profile Avatar &amp; Identity
                      </h4>

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
                            Upload your photo or choose an avatar preset below:
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

                      {/* Name & Linked Email */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-neutral-300">Athlete Display Name</label>
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
                          <label className="text-xs font-semibold text-neutral-300">Linked Account Email</label>
                          <input
                            type="email"
                            disabled
                            value={authUser.email || email}
                            className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-xs text-neutral-400 opacity-70 cursor-not-allowed font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Biometrics Inputs */}
                    <div className="space-y-4 pt-4 border-t border-neutral-800/80">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 font-mono">
                        Biometrics &amp; Physiological Parameters
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Age */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-neutral-300">Age (years)</label>
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

                    {/* Live Metabolic Preview Card */}
                    <div className="rounded-2xl border border-emerald-500/25 bg-emerald-950/20 p-4 space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold text-white">
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Live Mifflin-St Jeor Engine Calculations</span>
                        </span>
                        <span className="font-mono text-emerald-400 font-bold">
                          {calculated.targetCalories} kcal / day
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-2">
                          <div className="text-[10px] text-neutral-400">Protein (40%)</div>
                          <div className="text-xs font-bold text-emerald-400 font-mono">{calculated.targetProtein}g</div>
                        </div>
                        <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-2">
                          <div className="text-[10px] text-neutral-400">Carbs (35%)</div>
                          <div className="text-xs font-bold text-cyan-400 font-mono">{calculated.targetCarbs}g</div>
                        </div>
                        <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-2">
                          <div className="text-[10px] text-neutral-400">Fats (25%)</div>
                          <div className="text-xs font-bold text-amber-400 font-mono">{calculated.targetFat}g</div>
                        </div>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-4 border-t border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="text-xs text-neutral-400 text-center sm:text-left">
                        Saves biometrics and target macros to your account and database.
                      </div>

                      <button
                        type="submit"
                        disabled={isSaving}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 px-7 py-3 text-xs font-bold text-neutral-950 shadow-lg shadow-emerald-500/25 hover:from-emerald-400 hover:to-emerald-300 hover:scale-[1.02] transition active:scale-[0.98] disabled:opacity-50"
                      >
                        {isSaving ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin text-neutral-950" />
                            <span>Saving Athlete Profile...</span>
                          </>
                        ) : (
                          <>
                            <Zap className="h-4 w-4 fill-current" />
                            <span>{hasProfile ? "Update Athlete Profile & Save" : "Save Athlete Profile & Unlock Dashboard"}</span>
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                /* ============================================================== */
                /* CASE 3: AUTHENTICATED USER WITH PROFILE SAVED (COLLAPSED VIEW)  */
                /* ============================================================== */
                <div className="space-y-6">
                  {/* Step 1 Completed Ribbon */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-emerald-500/25 bg-emerald-950/25 p-3.5 text-xs">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span className="text-neutral-300">
                        <strong className="text-white">Step 1 Complete:</strong> Signed in as{" "}
                        <span className="font-mono text-emerald-400 font-semibold">{authUser.email}</span>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="text-[11px] font-medium text-neutral-400 hover:text-white underline underline-offset-2 transition"
                    >
                      Sign out / Switch account
                    </button>
                  </div>

                  {/* Collapsed Profile Summary Card */}
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
                          <span className="text-[10px] text-cyan-400 font-mono bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded">
                            Supabase Synced
                          </span>
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
                </div>
              )}
            </>
          )}
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
                <span>{authUser ? "Complete Athlete Profile to Unlock" : "Create Account to Unlock"}</span>
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

        {/* ========================================================================= */}
        {/* LIVE DAILY FOOD & MACRO TRACKER STUDIO (USDA + BARCODE/LABEL SCANNER)     */}
        {/* ========================================================================= */}
        <Card className="bg-neutral-900/90 border-neutral-800 p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h3 className="text-base font-bold text-white">Daily Food &amp; Macro Intake Log</h3>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                  USDA Verified
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                Log meals via precision barcode scanner, Nutrition Facts OCR, or 3M+ food database search
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setScannerInitialMeal("LUNCH");
                  setScannerInitialTab("scan");
                  setIsScannerOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 px-4 py-2 text-xs font-bold text-neutral-950 shadow-md shadow-emerald-500/20 hover:from-emerald-400 hover:to-emerald-300 transition active:scale-[0.98]"
              >
                <Scan className="h-4 w-4" />
                <span>Scan Food / Barcode</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setScannerInitialMeal("LUNCH");
                  setScannerInitialTab("search");
                  setIsScannerOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-700 bg-neutral-800 px-3.5 py-2 text-xs font-semibold text-neutral-200 hover:bg-neutral-700 hover:text-white transition"
              >
                <Search className="h-3.5 w-3.5 text-cyan-400" />
                <span>Search Database</span>
              </button>
            </div>
          </div>

          {/* Daily Progress Bars vs Mifflin-St Jeor Targets */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 rounded-2xl bg-neutral-950/80 border border-neutral-800">
            {/* Calories Progress */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-neutral-300 font-semibold flex items-center gap-1">
                  <Flame className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Calories</span>
                </span>
                <span className="font-mono text-emerald-400 font-bold">
                  {loggedMealsData.totals.calories} / {calculated.targetCalories} kcal
                </span>
              </div>
              <ProgressBar
                value={Math.min(100, Math.round((loggedMealsData.totals.calories / (calculated.targetCalories || 2000)) * 100))}
                color="emerald"
                className="h-2 rounded-full"
              />
              <div className="text-[10px] text-neutral-500 font-mono">
                {Math.max(0, calculated.targetCalories - loggedMealsData.totals.calories)} kcal remaining
              </div>
            </div>

            {/* Protein Progress */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-neutral-300 font-semibold">Protein</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {loggedMealsData.totals.protein}g / {calculated.targetProtein}g
                </span>
              </div>
              <ProgressBar
                value={Math.min(100, Math.round((loggedMealsData.totals.protein / (calculated.targetProtein || 150)) * 100))}
                color="emerald"
                className="h-2 rounded-full"
              />
              <div className="text-[10px] text-neutral-500 font-mono">
                {Math.max(0, Math.round((calculated.targetProtein - loggedMealsData.totals.protein) * 10) / 10)}g remaining
              </div>
            </div>

            {/* Carbs Progress */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-neutral-300 font-semibold">Carbs</span>
                <span className="font-mono text-cyan-400 font-bold">
                  {loggedMealsData.totals.carbs}g / {calculated.targetCarbs}g
                </span>
              </div>
              <ProgressBar
                value={Math.min(100, Math.round((loggedMealsData.totals.carbs / (calculated.targetCarbs || 200)) * 100))}
                color="cyan"
                className="h-2 rounded-full"
              />
              <div className="text-[10px] text-neutral-500 font-mono">
                {Math.max(0, Math.round((calculated.targetCarbs - loggedMealsData.totals.carbs) * 10) / 10)}g remaining
              </div>
            </div>

            {/* Fats Progress */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-neutral-300 font-semibold">Fats</span>
                <span className="font-mono text-amber-400 font-bold">
                  {loggedMealsData.totals.fat}g / {calculated.targetFat}g
                </span>
              </div>
              <ProgressBar
                value={Math.min(100, Math.round((loggedMealsData.totals.fat / (calculated.targetFat || 60)) * 100))}
                color="amber"
                className="h-2 rounded-full"
              />
              <div className="text-[10px] text-neutral-500 font-mono">
                {Math.max(0, Math.round((calculated.targetFat - loggedMealsData.totals.fat) * 10) / 10)}g remaining
              </div>
            </div>
          </div>

          {/* Meal Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(
              [
                { type: "BREAKFAST" as const, label: "Breakfast", icon: "🍳", color: "text-amber-400" },
                { type: "LUNCH" as const, label: "Lunch", icon: "🥗", color: "text-emerald-400" },
                { type: "DINNER" as const, label: "Dinner", icon: "🥩", color: "text-cyan-400" },
                { type: "SNACK" as const, label: "Snacks", icon: "🍎", color: "text-purple-400" },
              ]
            ).map((cat) => {
              const items = loggedMealsData.grouped[cat.type] || [];
              const catCalories = items.reduce((sum, i) => sum + (i.calories || 0), 0);
              const catProtein = Math.round(items.reduce((sum, i) => sum + (i.protein || 0), 0) * 10) / 10;

              return (
                <div
                  key={cat.type}
                  className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-4 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{cat.icon}</span>
                        <h4 className="text-xs font-bold text-white">{cat.label}</h4>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-mono font-bold text-white">{catCalories} kcal</div>
                        <div className="text-[9px] text-neutral-500 font-mono">{catProtein}g protein</div>
                      </div>
                    </div>

                    {/* Food Items List */}
                    <div className="space-y-1.5 min-h-[90px]">
                      {items.length === 0 ? (
                        <div className="py-6 text-center text-[11px] text-neutral-600 italic">
                          No foods logged yet.
                        </div>
                      ) : (
                        items.map((item) => (
                          <div
                            key={item.id}
                            className="group flex items-center justify-between p-2 rounded-xl bg-neutral-900/80 border border-neutral-800/80 hover:border-neutral-700 transition"
                          >
                            <div className="overflow-hidden pr-1">
                              <div className="text-[11px] font-semibold text-neutral-200 truncate">
                                {item.name}
                              </div>
                              <div className="text-[9px] text-neutral-500 font-mono">
                                {item.calories} kcal • P: {item.protein}g • C: {item.carbs}g • F: {item.fat}g
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteMeal(item.id)}
                              title="Delete food entry"
                              className="text-neutral-600 hover:text-red-400 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition shrink-0"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Add Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setScannerInitialMeal(cat.type);
                      setIsScannerOpen(true);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-neutral-800 bg-neutral-900 hover:border-emerald-500/30 hover:bg-neutral-800 text-[11px] font-semibold text-neutral-300 hover:text-white transition"
                  >
                    <Plus className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Log to {cat.label}</span>
                  </button>
                </div>
              );
            })}
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
                <span>{authUser ? "Complete Athlete Profile to Unlock" : "Create Account to Unlock"}</span>
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

        {/* Split Switcher Tabs & Active Program */}
        <div className="space-y-3">
          {/* Split Mode Switcher Pills */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 p-1.5 rounded-2xl bg-neutral-900/90 border border-neutral-800 max-w-2xl mx-auto shadow-inner">
            {[
              { id: "full_body", label: "Full Body", days: "3-Day" },
              { id: "upper_lower", label: "Upper / Lower", days: "4-Day" },
              { id: "hybrid_ppl", label: "Hybrid PPL", days: "5-Day" },
              { id: "ppl", label: "PPL x 2", days: "6-Day" },
              { id: "custom", label: "Custom Split", days: `${customSplit.daysCount || customSplit.days.length}D` },
            ].map((s) => {
              const isSelected = activeSplit === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleSelectSplit(s.id as any)}
                  className={`flex-1 min-w-[100px] text-xs font-semibold py-2 px-3 rounded-xl transition text-center flex items-center justify-center gap-1.5 ${
                    isSelected
                      ? "bg-emerald-500 text-neutral-950 font-bold shadow-md shadow-emerald-500/20"
                      : "text-neutral-400 hover:text-white hover:bg-neutral-800/60"
                  }`}
                >
                  <span>{s.label}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      isSelected ? "bg-neutral-950/20 text-neutral-950" : "bg-neutral-800 text-neutral-400"
                    }`}
                  >
                    {s.days}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Actions Bar */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
            {activeSplit === "custom" ? (
              <button
                type="button"
                onClick={() => setIsCustomSplitModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-500/15 px-4 py-2.5 text-xs font-bold text-cyan-300 hover:bg-cyan-500/25 transition shadow-sm"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Customize Split &amp; Days</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  handleSelectSplit("custom");
                  setIsCustomSplitModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-800 bg-neutral-900/80 px-3.5 py-2.5 text-xs font-semibold text-neutral-400 hover:text-white hover:border-neutral-700 transition"
              >
                <Sliders className="h-3.5 w-3.5 text-cyan-400" />
                <span>Build Custom Split</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setWorkoutModalPresetName(currentSplit.days[0]?.name || "Workout Session");
                setWorkoutModalPresetNotes(currentSplit.days[0]?.lifts || "");
                setWorkoutModalInitialMode("routine");
                setIsWorkoutModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-xs font-bold text-neutral-950 hover:bg-cyan-400 transition shadow-lg shadow-cyan-500/20"
            >
              <Plus className="h-3.5 w-3.5 stroke-[3]" />
              <span>Track Routine Split</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setWorkoutModalInitialMode("random");
                setIsWorkoutModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-neutral-700 bg-neutral-900/90 px-4 py-2.5 text-xs font-bold text-neutral-200 hover:text-white hover:border-cyan-500/50 hover:bg-neutral-800 transition shadow-sm"
            >
              <Shuffle className="h-3.5 w-3.5 text-cyan-400" />
              <span>Log Random / Freeform</span>
            </button>
          </div>
        </div>

        {/* Split Detail Card */}
        <Card className="bg-neutral-900/70 border-neutral-800 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800/80 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-white tracking-tight">
                  {currentSplit.name}
                </h3>
                {activeSplit === "custom" && (
                  <button
                    type="button"
                    onClick={() => setIsCustomSplitModalOpen(true)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-400 hover:underline bg-cyan-500/10 border border-cyan-500/25 px-2 py-0.5 rounded-lg"
                  >
                    <Edit3 className="h-3 w-3" />
                    <span>Edit</span>
                  </button>
                )}
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                {currentSplit.description}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="rounded-lg bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 text-xs font-mono font-semibold text-cyan-400">
                {currentSplit.frequency}
              </span>
              <span className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-mono font-semibold text-emerald-400">
                ~{currentSplit.targetSets} Weekly Sets / Muscle
              </span>
            </div>
          </div>

          {/* Routine Sessions */}
          <div
            className={`grid grid-cols-1 gap-4 ${
              currentSplit.days.length === 4
                ? "sm:grid-cols-2 lg:grid-cols-4"
                : currentSplit.days.length === 5
                ? "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
                : "md:grid-cols-3"
            }`}
          >
            {currentSplit.days.map((day, idx) => (
              <div key={idx} className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
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
                <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between">
                  <span className="text-[10px] text-neutral-500 font-mono">Autoregulated</span>
                  <button
                    type="button"
                    onClick={() => {
                      setWorkoutModalPresetName(day.name);
                      setWorkoutModalPresetNotes(day.lifts);
                      setIsWorkoutModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg bg-cyan-500/10 border border-cyan-500/25 px-2.5 py-1 text-[11px] font-semibold text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-300 transition"
                  >
                    <Plus className="h-3 w-3 stroke-[2.5]" />
                    <span>Track Session</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Logged Workouts & Activity Telemetry Card */}
        <Card className="bg-neutral-900/70 border-neutral-800 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800/80 pb-4">
            <div>
              <div className="inline-flex items-center gap-2 text-xs uppercase font-mono tracking-wider text-cyan-400 font-bold mb-1">
                <Dumbbell className="h-3.5 w-3.5" />
                <span>Training Telemetry &amp; Log</span>
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Logged Workouts
              </h3>
              <p className="text-xs text-neutral-400 mt-1">
                Real-time volume accumulation, training duration, and caloric output logged to your account.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  setWorkoutModalPresetName(currentSplit.days[0]?.name || "Workout Session");
                  setWorkoutModalPresetNotes(currentSplit.days[0]?.lifts || "");
                  setWorkoutModalInitialMode("routine");
                  setIsWorkoutModalOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 text-xs font-bold text-neutral-950 hover:bg-cyan-400 transition shadow-lg shadow-cyan-500/20"
              >
                <Plus className="h-3.5 w-3.5 stroke-[3]" />
                <span>Track Routine</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setWorkoutModalInitialMode("random");
                  setIsWorkoutModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-700 bg-neutral-900/90 px-3 py-2 text-xs font-bold text-neutral-200 hover:text-white hover:border-cyan-500/50 hover:bg-neutral-800 transition shadow-sm"
              >
                <Shuffle className="h-3.5 w-3.5 text-cyan-400" />
                <span>Random / Freeform</span>
              </button>
            </div>
          </div>

          {/* Telemetry Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-4 space-y-1">
              <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
                Sessions This Week
              </div>
              <div className="text-2xl font-black text-white font-mono flex items-baseline gap-1.5">
                <span>{loggedWorkoutsData.summary.thisWeekCount}</span>
                <span className="text-xs text-neutral-500 font-normal">/ {userSplitDays} target</span>
              </div>
              <div className="text-[10px] text-cyan-400 font-mono">
                {loggedWorkoutsData.summary.thisWeekCount >= userSplitDays
                  ? "Weekly Target Reached! 🔥"
                  : `${Math.max(0, userSplitDays - loggedWorkoutsData.summary.thisWeekCount)} sessions remaining`}
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-4 space-y-1">
              <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
                Weekly Training Time
              </div>
              <div className="text-2xl font-black text-white font-mono flex items-baseline gap-1.5">
                <span>{loggedWorkoutsData.summary.weeklyMinutes}</span>
                <span className="text-xs text-neutral-500 font-normal">minutes</span>
              </div>
              <div className="text-[10px] text-neutral-500 font-mono">
                {loggedWorkoutsData.summary.totalMinutes} total minutes recorded
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-4 space-y-1">
              <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
                Energy Expended
              </div>
              <div className="text-2xl font-black text-white font-mono flex items-baseline gap-1.5">
                <span>{loggedWorkoutsData.summary.weeklyCalories}</span>
                <span className="text-xs text-neutral-500 font-normal">kcal</span>
              </div>
              <div className="text-[10px] text-amber-400 font-mono">
                Resistance expenditure calculated
              </div>
            </div>
          </div>

          {/* Logged Workouts Feed */}
          <div className="space-y-2.5">
            <div className="text-xs font-bold text-neutral-300 uppercase tracking-wider font-mono">
              Recent Training Sessions
            </div>
            {loggedWorkoutsData.workouts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-neutral-800 bg-neutral-950/40 p-8 text-center space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  <Dumbbell className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">No workouts recorded yet</h4>
                  <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                    Track your first training session to unlock weekly volume monitoring and adherence metrics.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setWorkoutModalPresetName(currentSplit.days[0]?.name || "Workout Session");
                      setWorkoutModalPresetNotes(currentSplit.days[0]?.lifts || "");
                      setWorkoutModalInitialMode("routine");
                      setIsWorkoutModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 px-4 py-2 text-xs font-bold text-cyan-300 hover:bg-cyan-500/25 transition"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Track Split Session</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setWorkoutModalInitialMode("random");
                      setIsWorkoutModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-neutral-800/80 border border-neutral-700 px-4 py-2 text-xs font-bold text-neutral-300 hover:text-white hover:border-neutral-600 transition"
                  >
                    <Shuffle className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Roll Random Workout</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {loggedWorkoutsData.workouts.map((w) => (
                  <div
                    key={w.id}
                    className="group rounded-2xl border border-neutral-800 bg-neutral-950/80 p-4 space-y-2.5 hover:border-neutral-700 transition"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-bold text-white flex items-center gap-2">
                          <span>{w.name}</span>
                          {w.caloriesBurned && (
                            <span className="text-[10px] text-amber-400 font-mono bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                              {w.caloriesBurned} kcal
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-neutral-500 font-mono mt-0.5 flex items-center gap-2">
                          <span>{new Date(w.loggedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
                          {w.durationMinutes && (
                            <>
                              <span>•</span>
                              <span className="text-cyan-400">{w.durationMinutes} mins</span>
                            </>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteWorkout(w.id)}
                        className="rounded-lg p-1.5 text-neutral-600 hover:text-red-400 hover:bg-neutral-800/80 transition opacity-80 group-hover:opacity-100"
                        title="Delete workout"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {w.notes && (
                      <div className="rounded-xl bg-neutral-900/90 border border-neutral-800/80 p-2.5 text-xs text-neutral-300 font-mono leading-relaxed whitespace-pre-line text-[11px]">
                        {w.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
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
                <span>{authUser ? "Complete Athlete Profile to Unlock" : "Create Account to Unlock"}</span>
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
                <span>{authUser ? "Complete Athlete Profile to Unlock" : "Create Account to Unlock"}</span>
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
            24/7 AI Strength &amp; Nutrition Specialist Chatbot
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400">
            Live interactive consultation for acute exercise substitutions, joint discomfort adaptations, progressive overload, and peri-workout fueling.
          </p>
        </div>

        {/* Interactive AI Coach Chatbot */}
        <CoachChat athleteContext={coachAthleteContext} hasProfile={hasProfile} />
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

      {/* 100% Accurate Food & Macro Scanner Modal */}
      <FoodScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onMealLogged={fetchLoggedMeals}
        initialMealType={scannerInitialMeal}
        initialTab={scannerInitialTab}
      />

      {/* Interactive Workout Tracking Modal */}
      <WorkoutModal
        isOpen={isWorkoutModalOpen}
        onClose={() => setIsWorkoutModalOpen(false)}
        onWorkoutLogged={fetchLoggedWorkouts}
        initialWorkoutName={workoutModalPresetName}
        initialNotes={workoutModalPresetNotes}
        presetSessions={currentSplit.days}
        athleteWeightKg={numWeightKg}
        initialMode={workoutModalInitialMode}
      />

      {/* Custom Split Builder Modal */}
      <CustomSplitModal
        isOpen={isCustomSplitModalOpen}
        onClose={() => setIsCustomSplitModalOpen(false)}
        initialSplit={customSplit}
        onSplitSaved={(saved) => {
          setCustomSplit(saved);
          setUserSplitType("CUSTOM");
          setUserSplitDays(saved.daysCount || saved.days.length || 4);
          try {
            const stored = localStorage.getItem("sw_athlete_profile");
            if (stored) {
              const p = JSON.parse(stored);
              p.splitType = "CUSTOM";
              p.splitDays = saved.daysCount || saved.days.length || 4;
              localStorage.setItem("sw_athlete_profile", JSON.stringify(p));
            }
          } catch {}
        }}
      />
    </div>
  );
}
