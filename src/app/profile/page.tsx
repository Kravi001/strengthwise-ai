"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  AtSign,
  Award,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Database,
  Dumbbell,
  ExternalLink,
  Eye,
  EyeOff,
  Flame,
  Lock,
  LogOut,
  Mail,
  MailCheck,
  Plus,
  RefreshCw,
  Scale,
  Scan,
  Search,
  ShieldCheck,
  Sliders,
  Sparkles,
  TrendingUp,
  User as UserIcon,
  UserCheck,
  Utensils,
  Zap,
} from "lucide-react";
import { FoodScannerModal } from "@/components/food-scanner-modal";
import { CustomSplitModal } from "@/components/custom-split-modal";
import {
  CustomSplit,
  DEFAULT_CUSTOM_SPLIT,
  loadCustomSplit,
  saveCustomSplit,
} from "@/lib/custom-split";
import { createClient } from "@/lib/supabase/client";
import {
  calculateNutritionTargets,
  SPLIT_DETAILS,
  type CalculatedTargets,
} from "@/lib/calc";
import { Card, DonutChart, ProgressBar } from "@/components/tremor";
import type { FoodItem } from "@/lib/usda-foods";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";

const AVATAR_PRESETS = ["🏋️‍♂️", "🦾", "⚡", "🥗", "🧘", "🏆", "🔥", "🥇"];

interface EquipmentOption {
  id: string;
  name: string;
  badge: string;
  description: string;
  icon: string;
}

const EQUIPMENT_OPTIONS: EquipmentOption[] = [
  {
    id: "COMMERCIAL_GYM",
    name: "Commercial Gym",
    badge: "Full Access",
    description: "Olympic Barbells, Dumbbells, Power Racks, Cables, Leg Press & Plate Machines.",
    icon: "🏢",
  },
  {
    id: "BARBELL_HOME",
    name: "Home Gym with Barbell & Rack",
    badge: "Compound Heavy",
    description: "Power rack or half-rack, Olympic barbell, bumper plates, and flat/incline bench.",
    icon: "🏋️",
  },
  {
    id: "DUMBBELLS",
    name: "Dumbbells & Adjustable Bench",
    badge: "Hypertrophy",
    description: "Pair of adjustable or fixed dumbbells (up to 50+ lbs), adjustable bench, pull-up bar.",
    icon: "💪",
  },
  {
    id: "BANDS_BODYWEIGHT",
    name: "Resistance Bands & Pull-Up Bar",
    badge: "Portable",
    description: "Heavy loop resistance bands, door anchor, suspension straps, and pull-up bar.",
    icon: "🪢",
  },
  {
    id: "BODYWEIGHT",
    name: "Bodyweight / Calisthenics Only",
    badge: "Zero Equipment",
    description: "Floor exercises, push-ups, dips, pull-ups, squats, and bodyweight progressions.",
    icon: "🤸",
  },
];

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  // --- Auth User State ---
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Auth Form State (for landing / unauthenticated state)
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");
  const [authIdentifier, setAuthIdentifier] = useState("");
  const [authUsername, setAuthUsername] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authFullName, setAuthFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authErrorMsg, setAuthErrorMsg] = useState<string | null>(null);
  const [authSuccessMsg, setAuthSuccessMsg] = useState<string | null>(null);
  const [emailConfirmationSent, setEmailConfirmationSent] = useState(false);
  const [isVerifyingDev, setIsVerifyingDev] = useState(false);

  // --- Profile Fields ---
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState("🏋️‍♂️");
  const [age, setAge] = useState<number | string>(26);
  const [gender, setGender] = useState<"MALE" | "FEMALE">("MALE");
  const [heightFt, setHeightFt] = useState<number | string>(6);
  const [heightIn, setHeightIn] = useState<number | string>(3);
  const [currentWeightLbs, setCurrentWeightLbs] = useState<number | string>(185);
  const [goalWeightLbs, setGoalWeightLbs] = useState<number | string>(175);
  const [equipment, setEquipment] = useState<string>("COMMERCIAL_GYM");
  const [splitDays, setSplitDays] = useState<number>(4);
  const [isCustomSplit, setIsCustomSplit] = useState(false);
  const [isCustomSplitModalOpen, setIsCustomSplitModalOpen] = useState(false);
  const [customSplit, setCustomSplit] = useState<CustomSplit>(DEFAULT_CUSTOM_SPLIT);
  const [activityLevel, setActivityLevel] = useState<string>("MODERATE");
  const [goal, setGoal] = useState<"CUT" | "MAINTAIN" | "BULK">("BULK");
  const [dietPreference, setDietPreference] = useState<string>("STANDARD");

  // Status & Notifications
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"profile" | "usda-database">("profile");

  // USDA Food Database Explorer State
  const [foodSearchQuery, setFoodSearchQuery] = useState("");
  const [selectedFoodCategory, setSelectedFoodCategory] = useState<string>("ALL");
  const [foodDatabase, setFoodDatabase] = useState<FoodItem[]>([]);
  const [loadingFoods, setLoadingFoods] = useState(false);

  // Food & Macro Scanner Modal State
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerFood, setScannerFood] = useState<FoodItem | null>(null);

  // 1. Metric conversions for sports science formulas
  const numWeightLbs = Number(currentWeightLbs) || 185;
  const numWeightKg = numWeightLbs / 2.20462;
  const parsedFt = Number(heightFt) > 0 ? Number(heightFt) : 6;
  const parsedIn = !isNaN(Number(heightIn)) && Number(heightIn) >= 0 ? Number(heightIn) : 0;
  const totalInches = parsedFt * 12 + parsedIn;
  const heightCm = totalInches * 2.54;

  // 2. Compute live scientific macro recommendations
  const calculatedTargets: CalculatedTargets = useMemo(() => {
    return calculateNutritionTargets({
      age: Number(age) || 26,
      gender,
      heightCm,
      weightKg: numWeightKg,
      goalWeightKg: (Number(goalWeightLbs) || 170) / 2.20462,
      activityLevel,
      goal: goal === "CUT" ? "LOSE_WEIGHT" : goal === "BULK" ? "BUILD_MUSCLE" : "MAINTAIN",
      dietPreference,
      equipment,
      splitDays,
    });
  }, [age, gender, heightCm, numWeightKg, goalWeightLbs, activityLevel, goal, dietPreference, equipment, splitDays]);

  const macroChartData = useMemo(() => [
    { name: "Protein", value: calculatedTargets.targetProtein, color: "#06b6d4" },
    { name: "Carbs", value: calculatedTargets.targetCarbs, color: "#ec4899" },
    { name: "Fats", value: calculatedTargets.targetFat, color: "#f59e0b" },
  ], [calculatedTargets]);

  // Extract Google OAuth metadata if available
  const hydrateFromGoogle = (u: User) => {
    if (u.email) {
      setEmail(u.email);
      setAuthEmail(u.email);
    }

    const meta = u.user_metadata || {};
    if (meta.given_name) {
      setFirstName((prev) => prev || meta.given_name);
    }
    if (meta.family_name) {
      setLastName((prev) => prev || meta.family_name);
    }
    if (meta.full_name && !meta.given_name) {
      const parts = meta.full_name.trim().split(" ");
      setFirstName((prev) => prev || parts[0]);
      if (parts.length > 1) {
        setLastName((prev) => prev || parts.slice(1).join(" "));
      }
    }
    if (meta.avatar_url || meta.picture) {
      setAvatar(meta.avatar_url || meta.picture);
    }
  };

  // 3. Load initial Auth & Profile data
  useEffect(() => {
    document.title = "Athlete Profile & Settings — StrengthWise AI";

    async function loadUserAndProfile() {
      try {
        setAuthLoading(true);
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        if (currentUser) {
          setUser(currentUser);
          hydrateFromGoogle(currentUser);
          await fetchProfileFromDb();
        } else {
          // Check session fallback
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData.session?.user) {
            setUser(sessionData.session.user);
            hydrateFromGoogle(sessionData.session.user);
            await fetchProfileFromDb();
          } else {
            setUser(null);
          }
        }

        // Local storage cache fallback
        if (typeof window !== "undefined") {
          const loadedCustom = loadCustomSplit();
          setCustomSplit(loadedCustom);
          const stored = localStorage.getItem("sw_athlete_profile");
          if (stored) {
            try {
              const p = JSON.parse(stored);
              if (p.avatar) setAvatar(p.avatar);
              if (p.firstName) setFirstName((prev) => prev || p.firstName);
              if (p.lastName) setLastName((prev) => prev || p.lastName);
              if (p.age) setAge(p.age);
              if (p.gender) setGender(p.gender);
              if (p.heightFt) setHeightFt(p.heightFt);
              if (p.heightIn !== undefined && p.heightIn !== null) setHeightIn(p.heightIn);
              if (p.weightLbs) setCurrentWeightLbs(p.weightLbs);
              if (p.goalWeightLbs) setGoalWeightLbs(p.goalWeightLbs);
              if (p.equipment) setEquipment(p.equipment);
              if (p.splitDays) setSplitDays(p.splitDays);
              if (p.activityLevel) setActivityLevel(p.activityLevel);
              if (p.goal) setGoal(p.goal);
              if (p.dietPreference) setDietPreference(p.dietPreference);
              if (p.splitType && p.splitType.toUpperCase().includes("CUSTOM")) {
                setIsCustomSplit(true);
              }
            } catch {}
          }
        }
      } catch (err) {
        console.warn("Failed to load user or profile:", err);
      } finally {
        setAuthLoading(false);
      }
    }

    loadUserAndProfile();

    // Listen to real-time auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event: AuthChangeEvent, session: Session | null) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        hydrateFromGoogle(currentUser);
        await fetchProfileFromDb();
      }
      setAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const fetchProfileFromDb = async () => {
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        if (data.profile) {
          if (data.profile.firstName) setFirstName(data.profile.firstName);
          if (data.profile.lastName) setLastName(data.profile.lastName);
          if (data.profile.age) setAge(data.profile.age);
          if (data.profile.gender) setGender(data.profile.gender);
          if (data.profile.heightCm) {
            const totalIn = Math.round(data.profile.heightCm / 2.54);
            setHeightFt(Math.floor(totalIn / 12));
            setHeightIn(totalIn % 12);
          }
          if (data.profile.weightKg) {
            setCurrentWeightLbs(Math.round(data.profile.weightKg * 2.20462));
          }
          if (data.profile.goalWeightKg) {
            setGoalWeightLbs(Math.round(data.profile.goalWeightKg * 2.20462));
          }
          if (data.profile.equipment) setEquipment(data.profile.equipment);
          if (data.profile.splitDays) setSplitDays(data.profile.splitDays);
          if (data.profile.splitType) {
            if (data.profile.splitType.toUpperCase().includes("CUSTOM")) {
              setIsCustomSplit(true);
            }
          }
          if (data.profile.activityLevel) setActivityLevel(data.profile.activityLevel);
          if (data.profile.goal) {
            setGoal(
              data.profile.goal === "LOSE_WEIGHT"
                ? "CUT"
                : data.profile.goal === "BUILD_MUSCLE"
                ? "BULK"
                : "MAINTAIN"
            );
          }
          if (data.profile.dietPreference) setDietPreference(data.profile.dietPreference);
        }
      }
    } catch (err) {
      console.warn("Could not fetch DB profile:", err);
    }
  };

  // 4. Fetch USDA Reference Foods for explorer tab
  useEffect(() => {
    async function fetchFoods() {
      setLoadingFoods(true);
      try {
        const categoryParam = selectedFoodCategory !== "ALL" ? `&category=${selectedFoodCategory}` : "";
        const queryParam = foodSearchQuery ? `&q=${encodeURIComponent(foodSearchQuery)}` : "";
        const res = await fetch(`/api/food-database?${categoryParam}${queryParam}`);
        if (res.ok) {
          const data = await res.json();
          setFoodDatabase(data.foods || []);
        }
      } catch (err) {
        console.warn("Food DB fetch error:", err);
      } finally {
        setLoadingFoods(false);
      }
    }

    fetchFoods();
  }, [foodSearchQuery, selectedFoodCategory]);

  // --- Auth Handlers ---
  const handleGoogleSignIn = async () => {
    setAuthErrorMsg(null);
    setGoogleLoading(true);

    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
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

  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthErrorMsg(null);
    setAuthSuccessMsg(null);
    setAuthSubmitting(true);

    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";

      if (authMode === "signup") {
        if (!authUsername.trim()) {
          setAuthErrorMsg("Please choose a username.");
          setAuthSubmitting(false);
          return;
        }

        if (!authEmail.trim() || !authPassword) {
          setAuthErrorMsg("Please enter both an email and password.");
          setAuthSubmitting(false);
          return;
        }

        if (authPassword.length < 6) {
          setAuthErrorMsg("Password must be at least 6 characters long.");
          setAuthSubmitting(false);
          return;
        }

        const usernameClean = authUsername.trim();
        const fullNameClean = authFullName.trim() || usernameClean;

        const { data, error } = await supabase.auth.signUp({
          email: authEmail.trim(),
          password: authPassword,
          options: {
            data: {
              username: usernameClean,
              full_name: fullNameClean,
              name: fullNameClean,
            },
            emailRedirectTo: `${origin}/auth/callback?next=/profile`,
          },
        });

        if (error) {
          setAuthErrorMsg(error.message);
          setAuthSubmitting(false);
          return;
        }

        if (data.session?.user) {
          setUser(data.session.user);
          hydrateFromGoogle(data.session.user);
          setFirstName(fullNameClean.split(" ")[0] || usernameClean);
          setAuthSuccessMsg("Account created and profile ready to customize!");
        } else {
          setEmailConfirmationSent(true);
          setAuthSuccessMsg("Account created! Check your email or use Instant Dev Verify below.");
        }
      } else {
        // Sign In mode: Username or Email + Password
        if (!authIdentifier.trim() || !authPassword) {
          setAuthErrorMsg("Please enter your username or email and password.");
          setAuthSubmitting(false);
          return;
        }

        let targetEmail = authIdentifier.trim();

        // If it doesn't contain '@', resolve the registered email for this username
        if (!targetEmail.includes("@")) {
          try {
            const res = await fetch("/api/auth/resolve-email", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ identifier: targetEmail }),
            });
            const lookup = await res.json();
            if (!res.ok || !lookup.email) {
              setAuthErrorMsg(lookup.error || `No registered account found with username "${targetEmail}".`);
              setAuthSubmitting(false);
              return;
            }
            targetEmail = lookup.email;
          } catch {
            setAuthErrorMsg("Could not verify username. Please enter your email address.");
            setAuthSubmitting(false);
            return;
          }
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email: targetEmail,
          password: authPassword,
        });

        if (error) {
          if (error.message.toLowerCase().includes("email not confirmed")) {
            setEmailConfirmationSent(true);
            setAuthEmail(targetEmail);
            setAuthErrorMsg("Email address has not been confirmed yet. Click 'Instant Dev Verify' below.");
          } else {
            setAuthErrorMsg(error.message);
          }
          setAuthSubmitting(false);
          return;
        }

        if (data.user) {
          setUser(data.user);
          hydrateFromGoogle(data.user);
          setAuthSuccessMsg("Signed in! Loading your profile...");
        }
      }
    } catch (err: unknown) {
      setAuthErrorMsg(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleDevVerify = async () => {
    const emailToVerify = authEmail.trim() || authIdentifier.trim();
    if (!emailToVerify || !emailToVerify.includes("@")) {
      setAuthErrorMsg("Please provide a valid email address to verify.");
      return;
    }

    setIsVerifyingDev(true);
    setAuthErrorMsg(null);

    try {
      const res = await fetch("/api/auth/dev-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailToVerify }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to verify account.");
      }

      setAuthSuccessMsg("Email verified! Signing you in now...");
      // Auto sign-in
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: emailToVerify,
        password: authPassword,
      });

      if (!signInError && signInData.user) {
        setUser(signInData.user);
        hydrateFromGoogle(signInData.user);
        setEmailConfirmationSent(false);
      } else {
        setAuthMode("signin");
        setAuthIdentifier(emailToVerify);
        setEmailConfirmationSent(false);
      }
    } catch (err: unknown) {
      setAuthErrorMsg(err instanceof Error ? err.message : "Dev verify failed.");
    } finally {
      setIsVerifyingDev(false);
    }
  };

  // 5. Handle Save Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    const fullNameCombined = `${firstName.trim()} ${lastName.trim()}`.trim();

    try {
      const payload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        fullName: fullNameCombined,
        name: fullNameCombined,
        avatar,
        age: Number(age),
        gender,
        heightCm,
        weightKg: numWeightKg,
        goalWeightKg: (Number(goalWeightLbs) || 170) / 2.20462,
        equipment,
        splitDays: isCustomSplit ? (customSplit.daysCount || customSplit.days.length || 4) : splitDays,
        splitType: isCustomSplit ? "CUSTOM" : calculatedTargets.splitInfo.name,
        activityLevel,
        goal: goal === "CUT" ? "LOSE_WEIGHT" : goal === "BULK" ? "BUILD_MUSCLE" : "MAINTAIN",
        dietPreference,
        experienceLevel: "INTERMEDIATE",
      };

      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save profile.");
      }

      // Sync local storage & cookies for navbar and instant client feedback
      if (typeof window !== "undefined") {
        const localData = {
          isCompleted: true,
          fullName: fullNameCombined,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: user?.email || email,
          avatar,
          age: Number(age),
          gender,
          heightFt,
          heightIn,
          weightLbs: numWeightLbs,
          goalWeightLbs: Number(goalWeightLbs),
          equipment,
          splitDays: isCustomSplit ? (customSplit.daysCount || customSplit.days.length || 4) : splitDays,
          splitType: isCustomSplit ? "CUSTOM" : calculatedTargets.splitInfo.name,
          activityLevel,
          goal,
          dietPreference,
          targets: calculatedTargets,
          updatedAt: new Date().toISOString(),
        };
        localStorage.setItem("sw_athlete_profile", JSON.stringify(localData));
        document.cookie = `sw_athlete_profile=${encodeURIComponent(JSON.stringify(localData))}; path=/; max-age=31536000; SameSite=Lax`;
        window.dispatchEvent(new Event("sw_profile_updated"));
      }

      setSaveSuccess("Athlete profile saved successfully!");
      setTimeout(() => {
        router.refresh();
      }, 500);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Failed to save profile. Please verify your connection.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("sw_athlete_profile");
      document.cookie = "sw_athlete_profile=; path=/; max-age=0";
      window.dispatchEvent(new Event("sw_profile_updated"));
    }
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 pb-20 animate-in fade-in duration-300">
      {/* Top Subheader Navigation */}
      <header className="border-b border-neutral-800/80 bg-neutral-950/60 backdrop-blur-xl px-4 lg:px-8 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Link>
            <span className="text-neutral-700">/</span>
            <span className="text-xs font-bold text-emerald-400 font-mono uppercase tracking-wider">
              {user ? "Athlete Profile & Settings" : "Athlete Profile Portal"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {user && (
              <button
                type="button"
                onClick={() => {
                  setScannerFood(null);
                  setIsScannerOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 px-3.5 py-1.5 text-xs font-bold text-neutral-950 shadow-md shadow-emerald-500/20 hover:from-emerald-400 hover:to-emerald-300 transition"
              >
                <Scan className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Barcode &amp; Macro Scanner</span>
                <span className="sm:hidden">Scanner</span>
              </button>
            )}

            {user && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-400 hidden md:inline">
                  Signed in as <strong className="text-neutral-200">{user.email}</strong>
                </span>
                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-1 text-xs text-neutral-400 hover:text-red-400 transition border border-neutral-800 bg-neutral-900/60 px-2.5 py-1.5 rounded-lg"
                  title="Sign out"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 lg:px-8 pt-8 space-y-8">

        {/* ========================================================================= */}
        {/* UNAUTHENTICATED STATE: PROFILE SIGN IN & ACCOUNT CREATION BOX           */}
        {/* ========================================================================= */}
        {!user && !authLoading && (
          <div className="max-w-md mx-auto py-8 sm:py-16 space-y-6">
            {/* Header */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-bold text-emerald-400 shadow-sm">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Supabase Cloud Authentication</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {authMode === "signup" ? "Create Your Athlete Profile" : "Sign In to Your Profile"}
              </h1>
              <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                {authMode === "signup"
                  ? "Create your account to configure your biometrics, custom split periodization, and metabolic targets."
                  : "Sign in with Google, username, or email to access and customize your athlete profile."}
              </p>
            </div>

            {/* Profile Auth Card */}
            <Card className="bg-neutral-900/90 border-neutral-800 p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-xl rounded-2xl">
              {/* Google OAuth Button */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading}
                  className="w-full flex items-center justify-center gap-3 rounded-xl border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 hover:border-emerald-500/40 px-5 py-3 text-sm font-semibold text-white shadow-lg transition active:scale-[0.99] disabled:opacity-50"
                >
                  {googleLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin text-emerald-400" />
                  ) : (
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
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
                  <span>{googleLoading ? "Connecting with Google..." : "Sign in with Google"}</span>
                </button>
              </div>

              {/* Divider */}
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-800" />
                </div>
                <span className="relative bg-neutral-900 px-3 text-[11px] text-neutral-500 uppercase tracking-wider font-mono font-semibold">
                  or continue with credentials
                </span>
              </div>

              {/* Auth Mode Toggle */}
              <div className="flex rounded-xl bg-neutral-950 p-1 border border-neutral-800">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("signin");
                    setAuthErrorMsg(null);
                    setAuthSuccessMsg(null);
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                    authMode === "signin"
                      ? "bg-neutral-800 text-white shadow-sm border border-neutral-700"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("signup");
                    setAuthErrorMsg(null);
                    setAuthSuccessMsg(null);
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                    authMode === "signup"
                      ? "bg-neutral-800 text-white shadow-sm border border-neutral-700"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  Create Account
                </button>
              </div>

              {/* Auth Form */}
              <form onSubmit={handleEmailAuthSubmit} className="space-y-4">
                {/* Sign In Mode: Username or Email */}
                {authMode === "signin" ? (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-300">
                      Username or Email
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-3.5 top-3 h-4 w-4 text-neutral-500" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. alex_lifts or athlete@domain.com"
                        value={authIdentifier}
                        onChange={(e) => setAuthIdentifier(e.target.value)}
                        className="w-full rounded-xl border border-neutral-800 bg-neutral-950/80 pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none transition"
                      />
                    </div>
                  </div>
                ) : (
                  /* Sign Up Mode: Username, Email, and Name */
                  <>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-neutral-300">
                        Username
                      </label>
                      <div className="relative">
                        <AtSign className="absolute left-3.5 top-3 h-4 w-4 text-neutral-500" />
                        <input
                          type="text"
                          required
                          placeholder="e.g. alex_lifts"
                          value={authUsername}
                          onChange={(e) => setAuthUsername(e.target.value)}
                          className="w-full rounded-xl border border-neutral-800 bg-neutral-950/80 pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none transition"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-neutral-300">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-3 h-4 w-4 text-neutral-500" />
                        <input
                          type="email"
                          required
                          placeholder="athlete@domain.com"
                          value={authEmail}
                          onChange={(e) => setAuthEmail(e.target.value)}
                          className="w-full rounded-xl border border-neutral-800 bg-neutral-950/80 pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none transition"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-neutral-300">
                        Display Name <span className="text-neutral-500 font-normal">(Optional)</span>
                      </label>
                      <div className="relative">
                        <UserCheck className="absolute left-3.5 top-3 h-4 w-4 text-neutral-500" />
                        <input
                          type="text"
                          placeholder="e.g. Alex Morgan"
                          value={authFullName}
                          onChange={(e) => setAuthFullName(e.target.value)}
                          className="w-full rounded-xl border border-neutral-800 bg-neutral-950/80 pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none transition"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Password field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-300">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-neutral-500" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder={authMode === "signup" ? "At least 6 characters" : "Your password"}
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-950/80 pl-10 pr-10 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none transition"
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

                {/* Status Messages */}
                {authErrorMsg && (
                  <div className="rounded-xl border border-red-500/30 bg-red-950/40 p-3 text-xs text-red-300 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                    <span>{authErrorMsg}</span>
                  </div>
                )}

                {authSuccessMsg && (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-3 text-xs text-emerald-300 flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{authSuccessMsg}</span>
                  </div>
                )}

                {/* Dev Verify Bypass */}
                {emailConfirmationSent && (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-950/30 p-3.5 space-y-2">
                    <div className="text-xs text-amber-300 font-semibold flex items-center gap-1.5">
                      <MailCheck className="h-4 w-4" />
                      <span>Confirmation email sent</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      In development mode, verify instantly without checking your email:
                    </p>
                    <button
                      type="button"
                      onClick={handleDevVerify}
                      disabled={isVerifyingDev}
                      className="w-full rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs py-2 transition shadow"
                    >
                      {isVerifyingDev ? "Verifying..." : "Instant Dev Verify & Continue"}
                    </button>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={authSubmitting}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 px-5 py-3 text-sm font-bold text-neutral-950 shadow-lg shadow-emerald-500/20 transition active:scale-[0.99] disabled:opacity-50"
                >
                  {authSubmitting ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                  <span>
                    {authSubmitting
                      ? "Connecting to Supabase..."
                      : authMode === "signup"
                      ? "Create Profile & Get Started"
                      : "Sign In to Profile"}
                  </span>
                </button>
              </form>

              {/* Bottom Toggle */}
              <div className="text-center pt-2 border-t border-neutral-800/80">
                {authMode === "signin" ? (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("signup");
                      setAuthErrorMsg(null);
                      setAuthSuccessMsg(null);
                    }}
                    className="text-xs text-neutral-400 hover:text-emerald-400 transition"
                  >
                    Don&apos;t have a profile yet?{" "}
                    <span className="font-bold text-emerald-400 underline underline-offset-2">
                      Create an account
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("signin");
                      setAuthErrorMsg(null);
                      setAuthSuccessMsg(null);
                    }}
                    className="text-xs text-neutral-400 hover:text-emerald-400 transition"
                  >
                    Already have a profile?{" "}
                    <span className="font-bold text-emerald-400 underline underline-offset-2">
                      Sign in
                    </span>
                  </button>
                )}
              </div>
            </Card>

            <div className="text-center">
              <p className="text-[11px] text-neutral-500 font-mono">
                Secured by Supabase PostgreSQL Auth • Instant Multi-Device Sync
              </p>
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {authLoading && (
          <div className="py-24 flex flex-col items-center justify-center space-y-4">
            <RefreshCw className="h-8 w-8 text-emerald-400 animate-spin" />
            <p className="text-xs font-mono text-neutral-400">Loading Supabase athlete session...</p>
          </div>
        )}

        {/* ========================================================================= */}
        {/* AUTHENTICATED STATE: FULL ATHLETE PROFILE & MACRO CALIBRATION            */}
        {/* ========================================================================= */}
        {user && !authLoading && (
          <div className="space-y-8">
            {/* Authenticated Identity Banner */}
            <div className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-neutral-900 to-cyan-950/30 p-6 md:p-8 shadow-2xl">
              <div className="absolute -top-12 -right-12 h-44 w-44 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                <div className="flex items-center gap-4">
                  {avatar?.startsWith("data:") || avatar?.startsWith("http") ? (
                    <img src={avatar} alt="Avatar" className="h-16 w-16 rounded-2xl object-cover border-2 border-emerald-500/40 shadow-lg" />
                  ) : (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-neutral-900 border border-emerald-500/30 text-3xl shadow-inner">
                      {avatar || "🏋️‍♂️"}
                    </div>
                  )}
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-mono font-bold text-emerald-400">
                      <ShieldCheck className="h-3 w-3" />
                      <span>{user.app_metadata?.provider === "google" ? "Google Verified Athlete" : "Supabase Account Connected"}</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                      {firstName || lastName ? `${firstName} ${lastName}`.trim() : user.email?.split("@")[0] || "Athlete"}
                    </h1>
                    <p className="text-xs text-neutral-400 font-mono">
                      {user.email} • ID: {user.id.slice(0, 8)}...
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="rounded-2xl border border-neutral-800 bg-neutral-950/80 px-4 py-2 text-center">
                    <div className="text-[10px] uppercase font-mono text-neutral-400">Calculated Intake</div>
                    <div className="text-lg font-black font-mono text-emerald-400">
                      {calculatedTargets.targetCalories} <span className="text-xs text-neutral-500 font-normal">kcal</span>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-neutral-800 bg-neutral-950/80 px-4 py-2 text-center">
                    <div className="text-[10px] uppercase font-mono text-neutral-400">Active Split</div>
                    <div className="text-lg font-black font-mono text-cyan-400 truncate max-w-[130px]">
                      {isCustomSplit ? "Custom Split" : `${splitDays}D Split`}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tab Navigation: Profile Form vs USDA Database */}
            <div className="flex items-center gap-2 border-b border-neutral-800 pb-2">
              <button
                type="button"
                onClick={() => setActiveTab("profile")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === "profile"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-900"
                }`}
              >
                <UserIcon className="h-4 w-4" />
                <span>Biometrics &amp; Split Configuration</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("usda-database")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === "usda-database"
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-sm"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-900"
                }`}
              >
                <Database className="h-4 w-4" />
                <span>USDA FoodData Central Reference Explorer</span>
              </button>
            </div>

            {/* Notification Messages */}
            {saveSuccess && (
              <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/40 bg-emerald-950/40 p-4 text-xs text-emerald-300 shadow-lg">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                <div className="flex-1">
                  <strong>Success:</strong> {saveSuccess}
                </div>
                <Link
                  href="/"
                  className="inline-flex items-center gap-1 font-bold text-neutral-950 bg-emerald-500 hover:bg-emerald-400 px-3 py-1.5 rounded-lg transition"
                >
                  <span>Dashboard</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            )}

            {saveError && (
              <div className="flex items-center gap-3 rounded-2xl border border-red-500/40 bg-red-950/40 p-4 text-xs text-red-300 shadow-lg">
                <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
                <div>
                  <strong>Error:</strong> {saveError}
                </div>
              </div>
            )}

            {/* Active Tab: Profile Form */}
            {activeTab === "profile" ? (
              <form onSubmit={handleSaveProfile} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left 7 Columns: Biometrics & Preferences */}
                <div className="lg:col-span-7 space-y-6">

                  {/* Section 1: Avatar & Identity */}
                  <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 md:p-6 space-y-5">
                    <div className="flex items-center gap-2 pb-3 border-b border-neutral-800">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                        <UserIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-white">Athlete Identity</h2>
                        <p className="text-[11px] text-neutral-400">Your profile credentials authenticated with Supabase</p>
                      </div>
                    </div>

                    {/* Avatar selection */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-neutral-300">Choose Profile Avatar</label>
                      <div className="flex flex-wrap items-center gap-2">
                        {AVATAR_PRESETS.map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setAvatar(p)}
                            className={`flex h-11 w-11 items-center justify-center rounded-xl border text-xl transition hover:scale-105 ${
                              avatar === p
                                ? "border-emerald-500 bg-emerald-500/20 shadow-md shadow-emerald-500/20"
                                : "border-neutral-800 bg-neutral-950/60 hover:border-neutral-700"
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-neutral-300">First Name</label>
                        <input
                          type="text"
                          required
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="First Name"
                          className="w-full rounded-xl border border-neutral-800 bg-neutral-950/80 px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-neutral-300">Last Name</label>
                        <input
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Last Name"
                          className="w-full rounded-xl border border-neutral-800 bg-neutral-950/80 px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Physical Biometrics */}
                  <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 md:p-6 space-y-5">
                    <div className="flex items-center gap-2 pb-3 border-b border-neutral-800">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                        <Scale className="h-4 w-4" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-white">Physical Biometrics</h2>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-neutral-300">Age</label>
                        <input
                          type="number"
                          min="14"
                          max="99"
                          required
                          value={age}
                          onChange={(e) => setAge(e.target.value)}
                          className="w-full rounded-xl border border-neutral-800 bg-neutral-950/80 px-3 py-2 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-neutral-300">Biological Sex</label>
                        <select
                          value={gender}
                          onChange={(e) => setGender(e.target.value as "MALE" | "FEMALE")}
                          className="w-full rounded-xl border border-neutral-800 bg-neutral-950/80 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                        >
                          <option value="MALE">Male (+5 kcal)</option>
                          <option value="FEMALE">Female (-161 kcal)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-neutral-300">Height (Feet)</label>
                        <input
                          type="number"
                          min="3"
                          max="7"
                          required
                          value={heightFt}
                          onChange={(e) => setHeightFt(e.target.value)}
                          className="w-full rounded-xl border border-neutral-800 bg-neutral-950/80 px-3 py-2 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-neutral-300">Height (Inches)</label>
                        <input
                          type="number"
                          min="0"
                          max="11"
                          required
                          value={heightIn}
                          onChange={(e) => setHeightIn(e.target.value)}
                          className="w-full rounded-xl border border-neutral-800 bg-neutral-950/80 px-3 py-2 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-xs font-semibold text-neutral-300">
                          <span>Current Scale Weight (lbs)</span>
                          <span className="font-mono text-neutral-500">{Math.round(numWeightKg * 10) / 10} kg</span>
                        </div>
                        <input
                          type="number"
                          step="0.5"
                          min="70"
                          max="450"
                          required
                          value={currentWeightLbs}
                          onChange={(e) => setCurrentWeightLbs(e.target.value)}
                          className="w-full rounded-xl border border-neutral-800 bg-neutral-950/80 px-3.5 py-2.5 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-xs font-semibold text-neutral-300">
                          <span>Target Goal Weight (lbs)</span>
                          <span className="font-mono text-neutral-500">
                            {Math.round(((Number(goalWeightLbs) || 170) / 2.20462) * 10) / 10} kg
                          </span>
                        </div>
                        <input
                          type="number"
                          step="0.5"
                          min="70"
                          max="450"
                          required
                          value={goalWeightLbs}
                          onChange={(e) => setGoalWeightLbs(e.target.value)}
                          className="w-full rounded-xl border border-neutral-800 bg-neutral-950/80 px-3.5 py-2.5 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Activity Level Selector */}
                    <div className="space-y-2 pt-1">
                      <label className="text-xs font-semibold text-neutral-300">Daily Activity Level</label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {[
                          { id: "SEDENTARY", label: "Sedentary", desc: "Desk job, little movement" },
                          { id: "LIGHT", label: "Lightly Active", desc: "1-2 light workouts/wk" },
                          { id: "MODERATE", label: "Moderately Active", desc: "3-5 resistance sessions/wk" },
                          { id: "ACTIVE", label: "Very Active", desc: "6-7 hard training days/wk" },
                          { id: "VERY_ACTIVE", label: "Extra Active / Athlete", desc: "Physical job + 2x daily training" },
                        ].map((lvl) => (
                          <button
                            key={lvl.id}
                            type="button"
                            onClick={() => setActivityLevel(lvl.id)}
                            className={`text-left p-3 rounded-xl border transition ${
                              activityLevel === lvl.id
                                ? "border-emerald-500 bg-emerald-500/10 text-white shadow-sm"
                                : "border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:border-neutral-700"
                            }`}
                          >
                            <div className="text-xs font-bold text-neutral-200">{lvl.label}</div>
                            <div className="text-[10px] text-neutral-500 mt-0.5">{lvl.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Available Equipment */}
                  <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 md:p-6 space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-neutral-800">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                        <Dumbbell className="h-4 w-4" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-white">Available Equipment</h2>
                        <p className="text-[11px] text-neutral-400">
                          Workouts and exercise substitutions are automatically filtered to match your gear
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5">
                      {EQUIPMENT_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setEquipment(opt.id)}
                          className={`w-full text-left p-3.5 rounded-xl border flex items-center justify-between gap-3 transition ${
                            equipment === opt.id
                              ? "border-emerald-500 bg-emerald-500/15 shadow-sm"
                              : "border-neutral-800 bg-neutral-950/60 hover:border-neutral-700"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{opt.icon}</span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-white">{opt.name}</span>
                                <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-[9px] font-mono font-semibold text-neutral-300">
                                  {opt.badge}
                                </span>
                              </div>
                              <div className="text-[11px] text-neutral-400 mt-0.5">{opt.description}</div>
                            </div>
                          </div>
                          <div className="shrink-0">
                            {equipment === opt.id ? (
                              <div className="h-4 w-4 rounded-full bg-emerald-500 flex items-center justify-center text-neutral-950">
                                <CheckCircle2 className="h-4 w-4 fill-current" />
                              </div>
                            ) : (
                              <div className="h-4 w-4 rounded-full border border-neutral-700" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Section 4: Training Split Frequency */}
                  <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 md:p-6 space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-neutral-800">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-white">Preferred Training Split Frequency</h2>
                        <p className="text-[11px] text-neutral-400">
                          Choose between 3, 4, 5, or 6 days per week based on your weekly schedule
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {[
                        { days: 3, label: "Full Body" },
                        { days: 4, label: "Upper / Lower" },
                        { days: 5, label: "Hybrid PPL" },
                        { days: 6, label: "PPL x 2" },
                      ].map((s) => (
                        <button
                          key={s.days}
                          type="button"
                          onClick={() => {
                            setIsCustomSplit(false);
                            setSplitDays(s.days);
                          }}
                          className={`py-3 px-2 rounded-xl border text-center transition ${
                            !isCustomSplit && splitDays === s.days
                              ? "border-emerald-500 bg-emerald-500/20 shadow-md shadow-emerald-500/20"
                              : "border-neutral-800 bg-neutral-950/60 hover:border-neutral-700"
                          }`}
                        >
                          <div className="text-base sm:text-lg font-black text-white font-mono">{s.days} Days</div>
                          <div className="text-[10px] text-neutral-400">{s.label}</div>
                        </button>
                      ))}

                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomSplit(true);
                          setSplitDays(customSplit.daysCount || customSplit.days.length || 4);
                        }}
                        className={`py-3 px-2 rounded-xl border text-center transition col-span-2 sm:col-span-1 ${
                          isCustomSplit
                            ? "border-cyan-500 bg-cyan-500/20 shadow-md shadow-cyan-500/20"
                            : "border-neutral-800 bg-neutral-950/60 hover:border-neutral-700"
                        }`}
                      >
                        <div className="text-base sm:text-lg font-black text-cyan-400 font-mono flex items-center justify-center gap-1">
                          <Sliders className="h-4 w-4" />
                          <span>Custom</span>
                        </div>
                        <div className="text-[10px] text-neutral-400">
                          {customSplit.daysCount || customSplit.days.length}D Split
                        </div>
                      </button>
                    </div>

                    {isCustomSplit && (
                      <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-cyan-400 font-mono">{customSplit.name}</span>
                          <button
                            type="button"
                            onClick={() => setIsCustomSplitModalOpen(true)}
                            className="text-xs text-cyan-300 underline font-semibold"
                          >
                            Edit Custom Split Days
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Save Profile Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 px-6 py-3.5 text-sm font-bold text-neutral-950 shadow-lg shadow-emerald-500/20 transition active:scale-[0.99] disabled:opacity-50"
                    >
                      {isSaving ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      <span>{isSaving ? "Saving Profile & Macros..." : "Save Athlete Profile to Cloud"}</span>
                    </button>
                  </div>
                </div>

                {/* Right 5 Columns: Calculated Macro Summary */}
                <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-20">
                  <Card className="bg-neutral-900/80 border-neutral-800 p-6 space-y-6 shadow-2xl">
                    <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
                      <div>
                        <div className="inline-flex items-center gap-1 text-xs uppercase font-mono tracking-wider text-emerald-400 font-bold mb-1">
                          <Sparkles className="h-3.5 w-3.5" />
                          <span>Mifflin-St Jeor Engine</span>
                        </div>
                        <h3 className="text-xl font-bold text-white tracking-tight">
                          Your Target Calorie Profile
                        </h3>
                      </div>
                      <span className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-xs font-mono font-semibold text-emerald-400">
                        {goal === "CUT" ? "-20% Deficit" : goal === "BULK" ? "+10% Surplus" : "Maintenance"}
                      </span>
                    </div>

                    <div className="rounded-2xl bg-neutral-950 p-4 border border-neutral-800/80 space-y-3">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-neutral-400">Daily Target Calories:</span>
                        <div className="text-right">
                          <span className="text-3xl font-black font-mono text-emerald-400">
                            {calculatedTargets.targetCalories}
                          </span>
                          <span className="text-xs text-neutral-500 font-mono ml-1">kcal</span>
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-neutral-500 font-mono border-t border-neutral-800 pt-2">
                        <span>BMR: {calculatedTargets.bmr} kcal</span>
                        <span>TDEE: {calculatedTargets.tdee} kcal</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="text-xs font-bold text-neutral-300 uppercase tracking-wider font-mono">
                        Target Macronutrient Breakdown
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3 text-center">
                          <div className="text-xs font-bold text-cyan-400">Protein</div>
                          <div className="text-xl font-black text-white font-mono mt-0.5">{calculatedTargets.targetProtein}g</div>
                          <div className="text-[10px] text-neutral-400 font-mono">{calculatedTargets.usdaBenchmark.proteinPercent}% kcal</div>
                        </div>
                        <div className="rounded-xl border border-pink-500/30 bg-pink-500/10 p-3 text-center">
                          <div className="text-xs font-bold text-pink-400">Carbs</div>
                          <div className="text-xl font-black text-white font-mono mt-0.5">{calculatedTargets.targetCarbs}g</div>
                          <div className="text-[10px] text-neutral-400 font-mono">{calculatedTargets.usdaBenchmark.carbsPercent}% kcal</div>
                        </div>
                        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-center">
                          <div className="text-xs font-bold text-amber-400">Fats</div>
                          <div className="text-xl font-black text-white font-mono mt-0.5">{calculatedTargets.targetFat}g</div>
                          <div className="text-[10px] text-neutral-400 font-mono">{calculatedTargets.usdaBenchmark.fatPercent}% kcal</div>
                        </div>
                      </div>

                      <DonutChart
                        data={macroChartData}
                        label="Macro Split"
                        valueFormatter={(num: number) => `${num}g`}
                        className="w-full mt-2"
                      />
                    </div>

                    <div className="pt-2 border-t border-neutral-800 flex items-center justify-between text-xs">
                      <Link href="/meals" className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1">
                        <span>Go to Meals Tracker</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                      <Link href="/workouts" className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1">
                        <span>Go to Workouts</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </Card>
                </div>
              </form>
            ) : (
              /* Active Tab: USDA FoodData Central Explorer */
              <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">USDA FoodData Central Reference Standard</h3>
                    <p className="text-xs text-neutral-400">Search verified sports nutrition staples with exact macro density</p>
                  </div>
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3.5 top-3 h-4 w-4 text-neutral-500" />
                    <input
                      type="text"
                      placeholder="Search chicken breast, oats..."
                      value={foodSearchQuery}
                      onChange={(e) => setFoodSearchQuery(e.target.value)}
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-950 pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>

                {loadingFoods ? (
                  <div className="py-12 flex items-center justify-center space-y-2">
                    <RefreshCw className="h-6 w-6 text-cyan-400 animate-spin" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-neutral-800 text-[11px] uppercase font-mono text-neutral-400">
                        <tr>
                          <th className="py-3 px-3">Food Item</th>
                          <th className="py-3 px-3">Serving</th>
                          <th className="py-3 px-3">Calories</th>
                          <th className="py-3 px-3 text-emerald-400">Protein</th>
                          <th className="py-3 px-3 text-cyan-400">Carbs</th>
                          <th className="py-3 px-3 text-amber-400">Fat</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800/60 font-mono">
                        {foodDatabase.slice(0, 15).map((f) => (
                          <tr key={f.id} className="hover:bg-neutral-800/40 transition">
                            <td className="py-3 px-3 font-sans font-medium text-white">{f.name}</td>
                            <td className="py-3 px-3 text-neutral-400">{f.serving}</td>
                            <td className="py-3 px-3 font-bold text-white">{f.calories}</td>
                            <td className="py-3 px-3 text-emerald-400 font-bold">{f.protein}g</td>
                            <td className="py-3 px-3 text-cyan-400 font-bold">{f.carbs}g</td>
                            <td className="py-3 px-3 text-amber-400 font-bold">{f.fat}g</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Food Scanner Modal */}
      <FoodScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onMealLogged={() => {}}
        initialMealType="LUNCH"
        initialTab="scan"
      />

      {/* Custom Split Modal */}
      <CustomSplitModal
        isOpen={isCustomSplitModalOpen}
        onClose={() => setIsCustomSplitModalOpen(false)}
        initialSplit={customSplit}
        onSplitSaved={(saved) => {
          setCustomSplit(saved);
          setIsCustomSplit(true);
          setSplitDays(saved.daysCount || saved.days.length || 4);
          if (typeof window !== "undefined") {
            try {
              const stored = localStorage.getItem("sw_athlete_profile");
              if (stored) {
                const p = JSON.parse(stored);
                p.splitType = "CUSTOM";
                p.splitDays = saved.daysCount || saved.days.length || 4;
                localStorage.setItem("sw_athlete_profile", JSON.stringify(p));
              }
            } catch {}
          }
        }}
      />
    </div>
  );
}
