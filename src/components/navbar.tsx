"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Dumbbell,
  Home,
  Lock,
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
  const [activeSection, setActiveSection] = useState("home");
  const [hasProfile, setHasProfile] = useState(false);
  const [athleteAvatar, setAthleteAvatar] = useState<string | null>(null);
  const [athleteName, setAthleteName] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    // Listen for hash change & scroll to detect active section
    const updateActiveSection = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash && ["home", "meals", "workouts", "progress", "coach"].includes(hash)) {
        setActiveSection(hash);
      } else {
        // Check scroll position of sections
        const sections = ["home", "meals", "workouts", "progress", "coach"];
        for (const section of sections) {
          const el = document.getElementById(section);
          if (el) {
            const rect = el.getBoundingClientRect();
            if (rect.top <= 200 && rect.bottom >= 100) {
              setActiveSection(section);
              break;
            }
          }
        }
      }
    };

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("hashchange", updateActiveSection);

    return () => {
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("hashchange", updateActiveSection);
    };
  }, []);

  useEffect(() => {
    // Check if athlete profile exists
    const syncProfileState = () => {
      try {
        const stored = typeof window !== "undefined" ? localStorage.getItem("sw_athlete_profile") : null;
        if (stored) {
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
  }, []);

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
    router.push("/login");
    router.refresh();
  };

  const navLinks = [
    { href: "/#home", label: "Home", icon: Home, id: "home", requiresProfile: false },
    { href: "/#meals", label: "Meals", icon: Utensils, id: "meals", requiresProfile: true },
    { href: "/#workouts", label: "Workouts", icon: Dumbbell, id: "workouts", requiresProfile: true },
    { href: "/#progress", label: "Progress", icon: TrendingUp, id: "progress", requiresProfile: true },
    { href: "/#coach", label: "Coach", icon: Sparkles, id: "coach", requiresProfile: true },
  ];

  return (
    <aside className="sticky top-0 h-screen shrink-0 flex flex-col justify-between border-r border-neutral-800/80 bg-neutral-950/95 backdrop-blur-xl z-50 w-14 md:w-60 transition-all duration-300">

      {/* Top: Brand + Nav Links */}
      <div className="flex flex-col gap-6 overflow-hidden">

        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-3 px-3 pt-5 font-bold tracking-tight text-white hover:opacity-90 transition group"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-neutral-950 shadow-md shadow-emerald-500/20 group-hover:scale-105 transition">
            <Dumbbell className="h-5 w-5" />
          </div>
          <div className="hidden md:flex flex-col">
            <span className="text-sm font-black tracking-tight leading-tight whitespace-nowrap">
              Strength<span className="text-emerald-400">Wise</span>
            </span>
            <span className="text-[10px] uppercase tracking-wider text-emerald-400/90 font-mono font-bold whitespace-nowrap">
              AI Coach
            </span>
          </div>
        </Link>

        {/* Status Pill Badge — Desktop */}
        <div className="hidden md:block mx-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-2">
          <div className="flex items-center gap-1.5 text-[10px] font-mono font-semibold text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>Sports Science Engine</span>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex flex-col gap-1 px-2">
          <div className="hidden md:block px-2 text-[10px] uppercase font-bold tracking-wider text-neutral-500 mb-1">
            Navigation
          </div>
          {navLinks.map(({ href, label, icon: Icon, id, requiresProfile }) => {
            const isLocked = requiresProfile && !hasProfile;
            const isActive = activeSection === id;
            const targetHref = isLocked ? "/#profile-setup" : href;

            return (
              <Link
                key={href}
                href={targetHref}
                onClick={() => {
                  if (isLocked) {
                    setActiveSection("home");
                    const el = document.getElementById("profile-setup");
                    if (el) {
                      el.scrollIntoView({ behavior: "smooth" });
                    }
                  } else {
                    setActiveSection(id);
                  }
                }}
                title={isLocked ? `${label} (Create Profile to Unlock)` : label}
                className={`group flex items-center justify-between rounded-xl px-2.5 py-2.5 text-xs font-semibold transition ${
                  isActive
                    ? "bg-neutral-900 text-emerald-400 border border-neutral-700/80 shadow-sm shadow-emerald-500/10"
                    : isLocked
                    ? "text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900/30"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-900/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-[18px] w-[18px] shrink-0 ${
                      isActive
                        ? "text-emerald-400"
                        : isLocked
                        ? "text-neutral-600 group-hover:text-neutral-400"
                        : "text-neutral-400 group-hover:text-white"
                    }`}
                  />
                  <span className="hidden md:block whitespace-nowrap">{label}</span>
                </div>
                {isLocked && (
                  <Lock className="hidden md:block h-3.5 w-3.5 text-neutral-600 group-hover:text-amber-400 transition shrink-0" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom: User Session */}
      <div className="border-t border-neutral-800/80 p-2 md:p-3 space-y-2">
        {loading ? (
          <div className="h-8 w-full animate-pulse rounded-lg bg-neutral-800/50" />
        ) : (
          <div className="space-y-2">
            {/* Athlete Profile / User Session */}
            <div
              title={athleteName || user?.email || "Athlete Profile"}
              className="flex items-center gap-2.5 rounded-xl border border-neutral-800 bg-neutral-900/60 px-2 py-1.5"
            >
              {athleteAvatar?.startsWith("data:") || athleteAvatar?.startsWith("http") ? (
                <img src={athleteAvatar} alt="Avatar" className="h-7 w-7 rounded-lg object-cover" />
              ) : athleteAvatar ? (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-neutral-800 text-base shadow-inner">
                  {athleteAvatar}
                </div>
              ) : (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 text-neutral-950 font-bold text-xs uppercase shadow-sm">
                  {((athleteName || user?.email || "A")).charAt(0)}
                </div>
              )}
              <div className="hidden md:flex flex-col overflow-hidden text-left">
                <span className="max-w-[120px] truncate text-xs text-neutral-200 font-semibold">
                  {athleteName || user?.email?.split("@")[0] || "Guest Athlete"}
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">
                  {hasProfile ? "Profile Active" : "No Profile"}
                </span>
              </div>
            </div>

            {user ? (
              <button
                onClick={handleSignOut}
                title="Sign Out"
                className="w-full flex items-center justify-center md:justify-start gap-2 rounded-xl border border-neutral-800/80 bg-neutral-900/80 px-2 py-2 text-xs font-medium text-neutral-400 hover:bg-neutral-800 hover:text-red-400 transition"
              >
                <LogOut className="h-[18px] w-[18px] shrink-0" />
                <span className="hidden md:block whitespace-nowrap">Sign Out</span>
              </button>
            ) : (
              <Link
                href="/login"
                title="Sign In"
                className="flex items-center justify-center md:justify-start gap-2 rounded-xl bg-emerald-500 px-2.5 py-2 text-xs font-bold text-neutral-950 shadow-sm shadow-emerald-500/25 hover:bg-emerald-400 transition"
              >
                <UserIcon className="h-[18px] w-[18px] shrink-0" />
                <span className="hidden md:block whitespace-nowrap">Sign In</span>
              </Link>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
