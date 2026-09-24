"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Database,
  Dumbbell,
  ExternalLink,
  Flame,
  Heart,
  HelpCircle,
  Info,
  Layers,
  Lock,
  LogOut,
  RefreshCw,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  User as UserIcon,
  Utensils,
  Zap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  calculateNutritionTargets,
  SPLIT_DETAILS,
  type CalculatedTargets,
} from "@/lib/calc";
import type { FoodItem } from "@/lib/usda-foods";
import type { User } from "@supabase/supabase-js";

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

  // Auth User
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Form Fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState("🏋️‍♂️");
  const [age, setAge] = useState<number | string>(26);
  const [gender, setGender] = useState<"MALE" | "FEMALE">("MALE");
  const [heightFt, setHeightFt] = useState<number | string>(5);
  const [heightIn, setHeightIn] = useState<number | string>(10);
  const [currentWeightLbs, setCurrentWeightLbs] = useState<number | string>(175);
  const [goalWeightLbs, setGoalWeightLbs] = useState<number | string>(170);
  const [equipment, setEquipment] = useState<string>("COMMERCIAL_GYM");
  const [splitDays, setSplitDays] = useState<number>(4);
  const [activityLevel, setActivityLevel] = useState<string>("MODERATE");
  const [goal, setGoal] = useState<"CUT" | "MAINTAIN" | "BULK">("MAINTAIN");
  const [dietPreference, setDietPreference] = useState<string>("HIGH_PROTEIN");

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

  // 1. Convert height and weight to metric for sports science formulas
  const numWeightLbs = Number(currentWeightLbs) || 175;
  const numWeightKg = numWeightLbs / 2.20462;
  const totalInches = (Number(heightFt) || 5) * 12 + (Number(heightIn) || 10);
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

  // 3. Load initial Auth & Profile data
  useEffect(() => {
    async function loadUserAndProfile() {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        if (!currentUser) {
          // Check session fallback
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData.session?.user) {
            setUser(sessionData.session.user);
            hydrateFromGoogle(sessionData.session.user);
          } else {
            setUser(null);
          }
        } else {
          setUser(currentUser);
          hydrateFromGoogle(currentUser);
        }

        // Fetch existing database profile
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
        console.warn("Failed to load user or profile:", err);
      } finally {
        setAuthLoading(false);
      }
    }

    loadUserAndProfile();
  }, [supabase]);

  // Extract Google OAuth metadata if available
  const hydrateFromGoogle = (u: User) => {
    if (u.email) setEmail(u.email);

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

  // 4. Fetch USDA Reference Foods
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
        splitDays,
        splitType: calculatedTargets.splitInfo.name,
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

      // Sync local storage for navbar & instant client feedback
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
          splitDays,
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

      setSaveSuccess("Profile and macro calibration successfully saved to PostgreSQL!");
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
    if (typeof window !== "undefined") {
      localStorage.removeItem("sw_athlete_profile");
      document.cookie = "sw_athlete_profile=; path=/; max-age=0";
      window.dispatchEvent(new Event("sw_profile_updated"));
    }
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 pb-20">
      {/* Top Bar Header */}
      <header className="sticky top-0 z-40 border-b border-neutral-800/80 bg-neutral-950/80 backdrop-blur-xl px-4 lg:px-8 py-3.5">
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
              Athlete Profile &amp; Macro Calibration
            </span>
          </div>

          {user && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-neutral-400 hidden sm:inline">
                Signed in as <strong className="text-neutral-200">{user.email}</strong>
              </span>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center gap-1 text-[11px] text-neutral-400 hover:text-red-400 transition"
                title="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 lg:px-8 pt-8 space-y-8">
        {/* Onboarding Welcome Banner if newly authenticated */}
        <div className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-neutral-900 to-cyan-950/30 p-6 md:p-8 shadow-2xl">
          <div className="absolute -top-12 -right-12 h-44 w-44 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-mono font-bold text-emerald-400">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Google Account Authenticated</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Athlete Profile &amp; Nutritional Calibration
              </h1>
              <p className="text-sm text-neutral-300 max-w-2xl leading-relaxed">
                Your name and email have been pre-filled from your Google credentials. Complete your physical
                biometrics, available equipment, and preferred weekly split below. Our sports-nutrition engine
                instantly calculates your optimal calories and macros, calibrated against USDA FoodData Central standards.
              </p>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
              <div className="flex items-center gap-2 rounded-2xl border border-neutral-800 bg-neutral-900/80 px-4 py-2.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-mono text-neutral-300">USDA AMDR Certified Engine</span>
              </div>
              <div className="text-[11px] text-neutral-500 font-mono">Mifflin-St Jeor + WHO Ratios</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation: Profile Form vs USDA Food Database Explorer */}
        <div className="flex items-center gap-2 border-b border-neutral-800 pb-2">
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === "profile"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm"
                : "text-neutral-400 hover:text-white hover:bg-neutral-900"
            }`}
          >
            <UserIcon className="h-4 w-4" />
            <span>Profile &amp; Split Configuration</span>
          </button>

          <button
            onClick={() => setActiveTab("usda-database")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === "usda-database"
                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-sm"
                : "text-neutral-400 hover:text-white hover:bg-neutral-900"
            }`}
          >
            <Database className="h-4 w-4" />
            <span>USDA FoodData Central Reference Database</span>
            <span className="rounded bg-cyan-500/20 px-1.5 py-0.5 text-[10px] text-cyan-300 font-mono">Live</span>
          </button>
        </div>

        {/* Success / Error Messages */}
        {saveSuccess && (
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/40 bg-emerald-950/40 p-4 text-xs text-emerald-300 shadow-lg">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            <div className="flex-1">
              <strong>Success:</strong> {saveSuccess}
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-1 font-bold text-white bg-emerald-500 hover:bg-emerald-400 px-3 py-1.5 rounded-lg text-neutral-950 transition"
            >
              <span>View Dashboard</span>
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

        {activeTab === "profile" ? (
          <form onSubmit={handleSaveProfile} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 7 Columns: Profile & Biometrics Form */}
            <div className="lg:col-span-7 space-y-6">
              {/* Section 1: Google Identity & Name */}
              <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 md:p-6 space-y-5">
                <div className="flex items-center gap-2 pb-3 border-b border-neutral-800">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                    <UserIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">Google Identity &amp; Athlete Name</h2>
                    <p className="text-[11px] text-neutral-400">Pre-populated directly from your Google OAuth account</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                  {/* Avatar Picker */}
                  <div className="relative shrink-0">
                    <div className="h-16 w-16 rounded-2xl border-2 border-emerald-500/40 bg-neutral-950 flex items-center justify-center overflow-hidden text-2xl shadow-inner">
                      {avatar.startsWith("data:") || avatar.startsWith("http") ? (
                        <img src={avatar} alt="Profile" className="h-full w-full object-cover" />
                      ) : (
                        <span>{avatar}</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-xs font-semibold text-neutral-200">Avatar Icon Preset</div>
                    <div className="flex flex-wrap gap-1.5">
                      {AVATAR_PRESETS.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setAvatar(p)}
                          className={`h-8 w-8 rounded-lg border text-base flex items-center justify-center transition ${
                            avatar === p
                              ? "border-emerald-500 bg-emerald-500/20 scale-105"
                              : "border-neutral-800 bg-neutral-950 hover:border-neutral-700"
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* First Name, Last Name, Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-300">
                      First Name <span className="text-emerald-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="e.g. Alex"
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-xs text-white placeholder:text-neutral-600 focus:border-emerald-500 focus:outline-none transition font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-300">
                      Last Name <span className="text-emerald-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="e.g. Mercer"
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-xs text-white placeholder:text-neutral-600 focus:border-emerald-500 focus:outline-none transition font-medium"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
                      <span>Linked Google Email</span>
                      <span className="text-[10px] text-emerald-400 font-mono">Verified by Google OAuth</span>
                    </label>
                    <input
                      type="email"
                      disabled
                      value={user?.email || email}
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-950/80 px-3.5 py-2.5 text-xs text-neutral-400 font-mono opacity-80 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Biometrics (Height, Weight, Age, Biological Sex) */}
              <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 md:p-6 space-y-5">
                <div className="flex items-center gap-2 pb-3 border-b border-neutral-800">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
                    <Scale className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">Physical Biometrics</h2>
                    <p className="text-[11px] text-neutral-400">
                      Used to calculate your Basal Metabolic Rate (Mifflin-St Jeor formula)
                    </p>
                  </div>
                </div>

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
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none transition font-mono"
                    />
                  </div>

                  {/* Biological Sex */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-300">Biological Sex</label>
                    <div className="grid grid-cols-2 gap-2">
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
                    </div>
                  </div>

                  {/* Height Feet & Inches */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
                      <span>Height (ft &amp; in)</span>
                      <span className="text-[10px] text-cyan-400 font-mono">{Math.round(heightCm)} cm</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="relative">
                        <input
                          type="number"
                          min={3}
                          max={7}
                          required
                          value={heightFt}
                          onChange={(e) => setHeightFt(e.target.value)}
                          className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                        />
                        <span className="absolute right-3 top-2.5 text-xs text-neutral-500 pointer-events-none">ft</span>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          min={0}
                          max={11}
                          required
                          value={heightIn}
                          onChange={(e) => setHeightIn(e.target.value)}
                          className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                        />
                        <span className="absolute right-3 top-2.5 text-xs text-neutral-500 pointer-events-none">in</span>
                      </div>
                    </div>
                  </div>

                  {/* Weight (Current & Goal) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
                      <span>Current Weight (lbs)</span>
                      <span className="text-[10px] text-emerald-400 font-mono">{Math.round(numWeightKg * 10) / 10} kg</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min={70}
                        max={450}
                        required
                        value={currentWeightLbs}
                        onChange={(e) => setCurrentWeightLbs(e.target.value)}
                        className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-neutral-500 pointer-events-none">lbs</span>
                    </div>
                  </div>

                  {/* Goal Weight */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-300">Target / Goal Weight (lbs)</label>
                    <div className="relative">
                      <input
                        type="number"
                        min={70}
                        max={450}
                        required
                        value={goalWeightLbs}
                        onChange={(e) => setGoalWeightLbs(e.target.value)}
                        className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-neutral-500 pointer-events-none">lbs</span>
                    </div>
                  </div>

                  {/* Primary Goal Phase */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-300">Primary Goal Phase</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setGoal("CUT")}
                        className={`rounded-xl py-2 px-2 text-[11px] font-bold transition border ${
                          goal === "CUT"
                            ? "bg-amber-500/20 border-amber-500 text-amber-400 shadow-sm"
                            : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white"
                        }`}
                      >
                        Cut (-20%)
                      </button>
                      <button
                        type="button"
                        onClick={() => setGoal("MAINTAIN")}
                        className={`rounded-xl py-2 px-2 text-[11px] font-bold transition border ${
                          goal === "MAINTAIN"
                            ? "bg-cyan-500/20 border-cyan-500 text-cyan-400 shadow-sm"
                            : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white"
                        }`}
                      >
                        Maintain
                      </button>
                      <button
                        type="button"
                        onClick={() => setGoal("BULK")}
                        className={`rounded-xl py-2 px-2 text-[11px] font-bold transition border ${
                          goal === "BULK"
                            ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-sm"
                            : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white"
                        }`}
                      >
                        Bulk (+10%)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Activity Level Selector */}
                <div className="space-y-2 pt-2">
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
                      Workouts and exercise selections are automatically filtered to match your gear
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

              {/* Section 4: What Kind of Split (3, 4, 5, or 6 days) */}
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

                {/* Day Buttons */}
                <div className="grid grid-cols-4 gap-2">
                  {[3, 4, 5, 6].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setSplitDays(days)}
                      className={`py-3 px-2 rounded-xl border text-center transition ${
                        splitDays === days
                          ? "border-emerald-500 bg-emerald-500/20 shadow-md shadow-emerald-500/20"
                          : "border-neutral-800 bg-neutral-950/60 hover:border-neutral-700"
                      }`}
                    >
                      <div className="text-lg font-black text-white font-mono">{days} Days</div>
                      <div className="text-[10px] text-neutral-400">
                        {days === 3
                          ? "Full Body"
                          : days === 4
                          ? "Upper / Lower"
                          : days === 5
                          ? "Hybrid PPL"
                          : "PPL x 2"}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Selected Split Details Card */}
                {calculatedTargets.splitInfo && (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono">
                        {calculatedTargets.splitInfo.name}
                      </span>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        {calculatedTargets.splitInfo.tagline}
                      </span>
                    </div>

                    <p className="text-xs text-neutral-300 leading-relaxed">
                      {calculatedTargets.splitInfo.focus}
                    </p>

                    <div className="space-y-1.5 pt-2 border-t border-emerald-500/20">
                      <div className="text-[10px] uppercase font-mono text-neutral-400 font-bold">
                        Weekly Microcycle Schedule
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-neutral-300 font-mono">
                        {calculatedTargets.splitInfo.schedule.map((item, idx) => (
                          <div
                            key={idx}
                            className="rounded-lg bg-neutral-950/80 border border-neutral-800/80 px-2.5 py-1.5 text-[11px]"
                          >
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Save Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-400 px-8 py-4 text-sm font-bold text-neutral-950 shadow-xl shadow-emerald-500/25 hover:from-emerald-400 hover:to-emerald-300 hover:scale-[1.01] transition active:scale-[0.99] disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin text-neutral-950" />
                      <span>Saving Profile &amp; Calibrating Database...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 fill-current" />
                      <span>Save Profile &amp; Calibrate Macros</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right 5 Columns: Live Nutrition & Macro Recommendation Dashboard */}
            <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-20">
              {/* Macro Engine Card */}
              <div className="rounded-3xl border border-neutral-800 bg-neutral-900/90 p-6 space-y-6 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <h3 className="text-sm font-bold text-white">Live Macro Recommendations</h3>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 rounded">
                    Mifflin-St Jeor + USDA
                  </span>
                </div>

                {/* Big Calorie Display */}
                <div className="text-center rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-emerald-950/30 to-neutral-950 p-6 space-y-1">
                  <div className="text-[11px] uppercase tracking-wider text-neutral-400 font-mono font-bold">
                    Target Daily Energy Intake
                  </div>
                  <div className="text-4xl sm:text-5xl font-black text-emerald-400 font-mono tracking-tight">
                    {calculatedTargets.targetCalories}
                    <span className="text-base sm:text-lg font-normal text-neutral-400 ml-1.5">kcal / day</span>
                  </div>
                  <div className="text-[11px] text-neutral-400 pt-1">
                    BMR: <span className="font-mono text-neutral-200">{calculatedTargets.bmr} kcal</span> • TDEE:{" "}
                    <span className="font-mono text-neutral-200">{calculatedTargets.tdee} kcal</span>
                  </div>
                </div>

                {/* Macro Breakdown Pillars */}
                <div className="grid grid-cols-3 gap-3">
                  {/* Protein */}
                  <div className="rounded-2xl border border-emerald-500/30 bg-neutral-950 p-3.5 text-center space-y-1">
                    <div className="text-[10px] uppercase font-mono font-bold text-emerald-400">Protein</div>
                    <div className="text-xl sm:text-2xl font-black text-white font-mono">
                      {calculatedTargets.targetProtein}g
                    </div>
                    <div className="text-[10px] text-neutral-400 font-mono">
                      {calculatedTargets.usdaBenchmark.proteinPercent}% Cals
                    </div>
                    <div className="text-[9px] text-emerald-400/80">~2.2g / kg</div>
                  </div>

                  {/* Carbohydrates */}
                  <div className="rounded-2xl border border-cyan-500/30 bg-neutral-950 p-3.5 text-center space-y-1">
                    <div className="text-[10px] uppercase font-mono font-bold text-cyan-400">Carbs</div>
                    <div className="text-xl sm:text-2xl font-black text-white font-mono">
                      {calculatedTargets.targetCarbs}g
                    </div>
                    <div className="text-[10px] text-neutral-400 font-mono">
                      {calculatedTargets.usdaBenchmark.carbsPercent}% Cals
                    </div>
                    <div className="text-[9px] text-cyan-400/80">Glycogen &amp; Split</div>
                  </div>

                  {/* Healthy Fats */}
                  <div className="rounded-2xl border border-amber-500/30 bg-neutral-950 p-3.5 text-center space-y-1">
                    <div className="text-[10px] uppercase font-mono font-bold text-amber-400">Fats</div>
                    <div className="text-xl sm:text-2xl font-black text-white font-mono">
                      {calculatedTargets.targetFat}g
                    </div>
                    <div className="text-[10px] text-neutral-400 font-mono">
                      {calculatedTargets.usdaBenchmark.fatPercent}% Cals
                    </div>
                    <div className="text-[9px] text-amber-400/80">Hormone Health</div>
                  </div>
                </div>

                {/* Fiber and Hydration Targets */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="rounded-xl border border-neutral-800 bg-neutral-950/80 p-3 flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-[10px] text-neutral-400 uppercase font-mono">USDA Dietary Fiber</div>
                      <div className="text-sm font-bold text-white font-mono">{calculatedTargets.targetFiber}g / day</div>
                      <div className="text-[9px] text-neutral-500">14g / 1,000 kcal standard</div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-neutral-800 bg-neutral-950/80 p-3 flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0">
                      <Flame className="h-4 w-4 text-cyan-400" />
                    </div>
                    <div>
                      <div className="text-[10px] text-neutral-400 uppercase font-mono">Daily Hydration</div>
                      <div className="text-sm font-bold text-white font-mono">{calculatedTargets.targetWaterLiters} L / day</div>
                      <div className="text-[9px] text-neutral-500">ACSM Sports Guideline</div>
                    </div>
                  </div>
                </div>

                {/* USDA AMDR Standards Compliance Ribbon */}
                <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-neutral-200 flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-emerald-400" />
                      <span>USDA AMDR Compliance</span>
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                      Verified
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Macronutrient distribution adheres to the Acceptable Macronutrient Distribution Ranges (AMDR)
                    defined by the Food and Nutrition Board of the National Academies &amp; USDA FoodData Central.
                  </p>
                </div>

                {/* Quick Link to Food DB Explorer */}
                <button
                  type="button"
                  onClick={() => setActiveTab("usda-database")}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-neutral-800 bg-neutral-950 hover:border-cyan-500/40 text-left transition group"
                >
                  <div className="flex items-center gap-2.5">
                    <BookOpen className="h-4 w-4 text-cyan-400" />
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-cyan-400 transition">
                        Explore USDA Food Reference Foods
                      </div>
                      <div className="text-[10px] text-neutral-500">
                        See high-protein, clean carb, and fat sources
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-neutral-500 group-hover:text-white transition" />
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* =================================================================== */
          /* TAB 2: USDA FOODDATA CENTRAL WORLD-RENOWNED FOOD DATABASE EXPLORER  */
          /* =================================================================== */
          <div className="space-y-6">
            <div className="rounded-3xl border border-neutral-800 bg-neutral-900/60 p-6 md:p-8 space-y-6 shadow-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-cyan-400" />
                    <h2 className="text-lg font-bold text-white">USDA FoodData Central Reference Standard</h2>
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">
                    Connects directly to the globally recognized USDA Agricultural Research Service database
                    (SR Legacy &amp; Foundation Foods) to power your macro-balanced meal planning.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href="https://fdc.nal.usda.gov/"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-700 bg-neutral-800 px-3 py-2 text-xs font-medium text-neutral-200 hover:text-white transition"
                  >
                    <span>Official USDA Portal</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-3 h-4 w-4 text-neutral-500" />
                  <input
                    type="text"
                    value={foodSearchQuery}
                    onChange={(e) => setFoodSearchQuery(e.target.value)}
                    placeholder="Search foods (e.g. Chicken, Oats, Salmon, Rice, Avocado)..."
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-neutral-500 focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  {["ALL", "PROTEIN", "CARB", "FAT", "VEGETABLE"].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedFoodCategory(cat)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                        selectedFoodCategory === cat
                          ? "bg-cyan-500 text-neutral-950"
                          : "border border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white"
                      }`}
                    >
                      {cat === "ALL" ? "All Sources" : cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Food Items Grid */}
              {loadingFoods ? (
                <div className="py-16 text-center text-xs text-neutral-500 flex items-center justify-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin text-cyan-400" />
                  <span>Loading USDA Nutritional Records...</span>
                </div>
              ) : foodDatabase.length === 0 ? (
                <div className="py-16 text-center text-xs text-neutral-500">
                  No food items found matching your query.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {foodDatabase.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-neutral-800/80 bg-neutral-950 p-4 space-y-3 hover:border-cyan-500/40 transition group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span
                            className={`rounded px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase ${
                              item.category === "PROTEIN"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : item.category === "CARB"
                                ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                                : item.category === "FAT"
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                            }`}
                          >
                            {item.category}
                          </span>
                          <h4 className="text-xs font-bold text-white mt-1.5 line-clamp-1 group-hover:text-cyan-300 transition">
                            {item.name}
                          </h4>
                          <div className="text-[10px] text-neutral-500">Serving: {item.serving}</div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-sm font-black text-white font-mono">{item.calories}</div>
                          <div className="text-[9px] text-neutral-500 font-mono">kcal</div>
                        </div>
                      </div>

                      {/* Nutrient Bars */}
                      <div className="grid grid-cols-4 gap-1.5 text-center pt-2 border-t border-neutral-900">
                        <div className="rounded-lg bg-neutral-900/80 p-1.5">
                          <div className="text-[9px] text-emerald-400 font-mono">Protein</div>
                          <div className="text-xs font-bold text-white font-mono">{item.protein}g</div>
                        </div>
                        <div className="rounded-lg bg-neutral-900/80 p-1.5">
                          <div className="text-[9px] text-cyan-400 font-mono">Carbs</div>
                          <div className="text-xs font-bold text-white font-mono">{item.carbs}g</div>
                        </div>
                        <div className="rounded-lg bg-neutral-900/80 p-1.5">
                          <div className="text-[9px] text-amber-400 font-mono">Fats</div>
                          <div className="text-xs font-bold text-white font-mono">{item.fat}g</div>
                        </div>
                        <div className="rounded-lg bg-neutral-900/80 p-1.5">
                          <div className="text-[9px] text-purple-400 font-mono">Fiber</div>
                          <div className="text-xs font-bold text-white font-mono">{item.fiber}g</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[9px] text-neutral-600 font-mono pt-1">
                        <span>{item.source}</span>
                        {item.fdcId && <span>FDC #{item.fdcId}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
