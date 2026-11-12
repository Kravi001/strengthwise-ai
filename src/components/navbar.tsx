"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronRight,
  Dumbbell,
  Home,
  LogOut,
  Sparkles,
  TrendingUp,
  User as UserIcon,
  Utensils,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";

export function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const [athleteAvatar, setAthleteAvatar] = useState<string | null>(null);
  const [athleteName, setAthleteName] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const navLinks = [
    { href: "/", label: "Home", icon: Home, id: "home" },
    { href: "/meals", label: "Meals", icon: Utensils, id: "meals" },
    { href: "/workouts", label: "Workouts", icon: Dumbbell, id: "workouts" },
    { href: "/progress", label: "Progress", icon: TrendingUp, id: "progress" },
    { href: "/coach", label: "Coach", icon: Sparkles, id: "coach" },
  ];

  const getActiveSectionId = (path: string) => {
    if (path === "/" || path === "") return "home";
    if (path.startsWith("/meals")) return "meals";
    if (path.startsWith("/workouts")) return "workouts";
    if (path.startsWith("/progress")) return "progress";
    if (path.startsWith("/coach")) return "coach";
    if (path.startsWith("/profile")) return "profile";
    return "";
  };

  // Derived directly from the URL so the correct tab is highlighted on the very first render.
  const activeSection = getActiveSectionId(pathname);

  useEffect(() => {
    // Check if athlete profile exists
    const syncProfileState = () => {
      try {
        const stored = typeof window !== "undefined" ? localStorage.getItem("sw_athlete_profile") : null;
        if (stored && user) {
          const parsed = JSON.parse(stored);
          setHasProfile(Boolean(parsed.isCompleted || parsed.age || parsed.weightLbs || parsed.weightKg));
          setAthleteAvatar(parsed.avatar || null);
          setAthleteName(parsed.fullName || null);
        } else {
          setHasProfile(false);
          setAthleteAvatar(null);
          setAthleteName(null);
        }
      } catch {
        setHasProfile(false);
      }
    };

    syncProfileState();
    window.addEventListener("sw_profile_updated", syncProfileState);
    window.addEventListener("storage", syncProfileState);

    return () => {
      window.removeEventListener("sw_profile_updated", syncProfileState);
      window.removeEventListener("storage", syncProfileState);
    };
  }, [user]);

  useEffect(() => {
    async function checkUser() {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();
        setUser(currentUser);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setHasProfile(false);
    if (typeof window !== "undefined") {
      localStorage.removeItem("sw_athlete_profile");
      document.cookie = "sw_athlete_profile=; path=/; max-age=0";
      window.dispatchEvent(new Event("sw_profile_updated"));
    }
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-800 bg-neutral-950 shadow-sm">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Brand / Logo + Sports Engine Badge */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-bold tracking-tight text-white hover:opacity-90 transition-opacity duration-150 ease-out group"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-neutral-900 border border-neutral-800 text-emerald-400 shadow-sm">
              <Dumbbell className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm sm:text-base font-black tracking-tight leading-tight whitespace-nowrap">
                Strength<span className="text-emerald-400">Wise</span>
              </span>
              <span className="text-[10px] tracking-wide text-neutral-400 font-medium whitespace-nowrap">
                AI Coach
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Horizontal Navigation Links with Sliding Pill (Desktop md:flex) */}
        <nav
          aria-label="Main navigation"
          className="relative hidden md:flex items-center gap-1 p-1 rounded-xl bg-neutral-900 border border-neutral-800 overflow-x-auto no-scrollbar"
        >
          {navLinks.map(({ href, label, icon: Icon, id }) => {
            const isActive = activeSection === id;

            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={`group relative flex items-center gap-1.5 sm:gap-2 rounded-lg px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-medium transition-colors duration-150 ease-out whitespace-nowrap ${
                  isActive
                    ? "bg-neutral-800 text-white font-semibold"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 transition-colors duration-150 ease-out ${
                    isActive ? "text-emerald-400" : "text-neutral-400 group-hover:text-white"
                  }`}
                />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right: Athlete Profile Badge & Sign Out Button */}
        <div className="flex items-center gap-2 shrink-0">
          {loading ? (
            <div className="h-8 w-24 animate-pulse rounded-xl bg-neutral-800/50" />
          ) : user ? (
            <div className="flex items-center gap-2">
              {/* Athlete Profile Pill */}
              <Link
                href="/profile"
                title="Open Athlete Profile & Settings"
                className={`flex items-center gap-2 rounded-xl border px-2.5 py-1.5 transition-colors duration-150 ease-out group cursor-pointer ${
                  pathname.startsWith("/profile")
                    ? "border-neutral-700 bg-neutral-800 shadow-sm"
                    : "border-neutral-800 bg-neutral-900 hover:border-neutral-700"
                }`}
              >
                {athleteAvatar?.startsWith("data:") || athleteAvatar?.startsWith("http") ? (
                  <img src={athleteAvatar} alt="Avatar" className="h-6 w-6 rounded-lg object-cover" />
                ) : athleteAvatar ? (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-neutral-800 text-sm shadow-inner">
                    {athleteAvatar}
                  </div>
                ) : (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-200 font-bold text-xs uppercase shadow-sm">
                    {((athleteName || user?.email || "A")).charAt(0)}
                  </div>
                )}
                <div className="hidden sm:flex flex-col text-left leading-tight">
                  <span className="max-w-[110px] truncate text-xs text-neutral-200 font-semibold group-hover:text-white transition">
                    {athleteName || user?.email?.split("@")[0] || "Athlete"}
                  </span>
                  <span className="text-[9px] text-emerald-400 font-mono flex items-center gap-0.5">
                    <span>{hasProfile ? "View profile" : "Finish setup"}</span>
                    <ChevronRight className="h-2 w-2 opacity-60 group-hover:translate-x-0.5 transition" />
                  </span>
                </div>
              </Link>

              {/* Sign Out Button */}
              <button
                onClick={handleSignOut}
                title="Sign Out"
                className="flex items-center gap-1.5 rounded-xl border border-neutral-800 bg-neutral-900 px-2.5 py-1.5 text-xs font-medium text-neutral-400 hover:bg-neutral-800 hover:text-red-400 hover:border-red-500/30 transition-colors duration-150 ease-out shadow-sm"
              >
                <LogOut className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden md:inline whitespace-nowrap">Sign Out</span>
              </button>
            </div>
          ) : (
            <Link
              href={pathname !== "/" && !pathname.startsWith("/profile") ? `/profile?redirect=${encodeURIComponent(pathname)}` : "/profile"}
              title="Create Profile or Sign In"
              className="flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-3.5 py-2 text-xs font-semibold text-neutral-950 shadow-sm transition-colors duration-150 ease-out"
            >
              <UserIcon className="h-3.5 w-3.5 shrink-0" />
              <span className="whitespace-nowrap">Sign in</span>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Fixed Bottom Navigation Bar (< 768px) */}
      <nav
        aria-label="Mobile navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-neutral-950 border-t border-neutral-800 px-2 py-1.5 pb-[max(0.6rem,env(safe-area-inset-bottom))] shadow-2xl"
      >
        <div className="grid grid-cols-5 items-center">
          {navLinks.map(({ href, label, icon: Icon, id }) => {
            const isActive = activeSection === id;
            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={`flex flex-col items-center justify-center py-1 rounded-lg text-[10px] font-semibold transition-colors duration-150 ease-out ${
                  isActive
                    ? "text-emerald-400 font-bold"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                <Icon
                  className={`h-5 w-5 mb-0.5 transition-colors duration-150 ease-out ${
                    isActive ? "text-emerald-400" : "text-neutral-400"
                  }`}
                />
                <span className="truncate max-w-[56px] text-center">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
