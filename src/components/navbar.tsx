"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronRight,
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

  const navRef = useRef<HTMLElement | null>(null);
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const barRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    const currentActiveId = getActiveSectionId(pathname);
    setActiveSection(currentActiveId);

    const updateSlidingBar = () => {
      const navEl = navRef.current;
      const barEl = barRef.current;
      if (!navEl || !barEl) return;

      const activeIdx = navLinks.findIndex((l) => l.id === currentActiveId);
      if (activeIdx < 0 || !linkRefs.current[activeIdx]) {
        barEl.style.opacity = "0";
        return;
      }

      const linkEl = linkRefs.current[activeIdx]!;
      const navRect = navEl.getBoundingClientRect();
      const linkRect = linkEl.getBoundingClientRect();
      const targetX = linkRect.left - navRect.left;
      const targetWidth = linkRect.width;

      barEl.style.opacity = "1";
      barEl.style.transform = `translateX(${targetX}px)`;
      barEl.style.width = `${targetWidth}px`;
    };

    updateSlidingBar();
    const timer = setTimeout(updateSlidingBar, 100);
    window.addEventListener("resize", updateSlidingBar);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateSlidingBar);
    };
  }, [pathname]);

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
    <header className="sticky top-0 z-50 w-full border-b border-neutral-800/80 bg-neutral-950/85 backdrop-blur-xl transition-all duration-300 shadow-lg shadow-black/40">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Brand / Logo + Sports Engine Badge */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-bold tracking-tight text-white hover:opacity-90 transition group"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-neutral-950 shadow-md shadow-emerald-500/20 group-hover:scale-105 transition">
              <Dumbbell className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm sm:text-base font-black tracking-tight leading-tight whitespace-nowrap">
                Strength<span className="text-emerald-400">Wise</span>
              </span>
              <span className="text-[9px] uppercase tracking-wider text-emerald-400/90 font-mono font-bold whitespace-nowrap">
                AI Coach
              </span>
            </div>
          </Link>

          {/* Engine Status Pill — Desktop */}
          <div className="hidden lg:flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1 text-[10px] font-mono font-semibold text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>Sports Science Engine</span>
          </div>
        </div>

        {/* Center: Horizontal Navigation Links with Sliding Pill */}
        <nav
          ref={navRef}
          className="relative flex items-center gap-1 p-1 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 overflow-x-auto no-scrollbar"
        >
          {/* Real-time sliding glowing indicator pill */}
          <div
            ref={barRef}
            className="absolute top-1 bottom-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 shadow-[0_0_12px_rgba(52,211,153,0.25)] pointer-events-none z-0 will-change-transform"
            style={{
              left: 0,
              transform: "translateX(0px)",
              transition: "transform 200ms cubic-bezier(0.2, 0, 0, 1), width 200ms cubic-bezier(0.2, 0, 0, 1), opacity 150ms ease",
            }}
          />

          {navLinks.map(({ href, label, icon: Icon, id }, index) => {
            const isActive = activeSection === id;
            const targetHref = user ? href : "/profile";

            return (
              <Link
                key={href}
                ref={(el) => {
                  linkRefs.current[index] = el as unknown as HTMLAnchorElement;
                }}
                href={targetHref}
                title={user ? label : `${label} (Sign up required)`}
                className={`group relative z-10 flex items-center gap-1.5 sm:gap-2 rounded-xl px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? "text-emerald-400 font-bold"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                    isActive ? "text-emerald-400 scale-110" : "text-neutral-400 group-hover:text-white"
                  }`}
                />
                <span>{label}</span>
                {isActive ? (
                  <span className="relative flex h-1.5 w-1.5 shrink-0 ml-0.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                  </span>
                ) : !user && !loading ? (
                  <Lock className="h-2.5 w-2.5 text-neutral-600 group-hover:text-emerald-400/80 transition ml-0.5" />
                ) : null}
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
                className={`flex items-center gap-2 rounded-xl border px-2.5 py-1.5 transition group cursor-pointer ${
                  pathname.startsWith("/profile")
                    ? "border-emerald-500/50 bg-emerald-950/30 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500/30"
                    : "border-neutral-800 bg-neutral-900/70 hover:border-emerald-500/40 hover:bg-neutral-900"
                }`}
              >
                {athleteAvatar?.startsWith("data:") || athleteAvatar?.startsWith("http") ? (
                  <img src={athleteAvatar} alt="Avatar" className="h-6 w-6 rounded-lg object-cover" />
                ) : athleteAvatar ? (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-neutral-800 text-sm shadow-inner group-hover:scale-105 transition">
                    {athleteAvatar}
                  </div>
                ) : (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 text-neutral-950 font-bold text-xs uppercase shadow-sm group-hover:scale-105 transition">
                    {((athleteName || user?.email || "A")).charAt(0)}
                  </div>
                )}
                <div className="hidden sm:flex flex-col text-left leading-tight">
                  <span className="max-w-[110px] truncate text-xs text-neutral-200 font-semibold group-hover:text-emerald-300 transition">
                    {athleteName || user?.email?.split("@")[0] || "Athlete"}
                  </span>
                  <span className="text-[9px] text-emerald-400 font-mono flex items-center gap-0.5">
                    <span>{hasProfile ? "Profile Active" : "Setup Profile"}</span>
                    <ChevronRight className="h-2 w-2 opacity-60 group-hover:translate-x-0.5 transition" />
                  </span>
                </div>
              </Link>

              {/* Sign Out Button */}
              <button
                onClick={handleSignOut}
                title="Sign Out"
                className="flex items-center gap-1.5 rounded-xl border border-neutral-800 bg-neutral-900/80 px-2.5 py-1.5 text-xs font-medium text-neutral-400 hover:bg-neutral-800 hover:text-red-400 hover:border-red-500/30 transition shadow-sm"
              >
                <LogOut className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden md:inline whitespace-nowrap">Sign Out</span>
              </button>
            </div>
          ) : (
            <Link
              href="/profile"
              title="Create Profile or Sign In"
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 px-3.5 py-2 text-xs font-bold text-neutral-950 shadow-md shadow-emerald-500/20 hover:from-emerald-400 hover:to-emerald-300 hover:scale-[1.02] transition active:scale-[0.98]"
            >
              <UserIcon className="h-3.5 w-3.5 shrink-0" />
              <span className="whitespace-nowrap">Sign In / Sign Up</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
