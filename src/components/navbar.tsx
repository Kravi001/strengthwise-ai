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
      const barHeight = barEl.offsetHeight || 24;
      const targetY = linkRect.top - navRect.top + (linkRect.height - barHeight) / 2;

      barEl.style.opacity = "1";
      barEl.style.transform = `translateY(${targetY}px)`;
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
        <nav ref={navRef} className="relative flex flex-col gap-1 px-2">
          {/* Subtle background rail line */}
          <div className="absolute left-[7px] top-3 bottom-3 w-[2px] bg-neutral-800/50 rounded-full pointer-events-none" />

          {/* Dynamic real-time sliding glowing green bar */}
          <div
            ref={barRef}
            className="absolute left-[5.5px] w-[5px] h-6 rounded-full bg-gradient-to-b from-emerald-300 via-emerald-400 to-emerald-500 shadow-[0_0_14px_rgba(52,211,153,0.95)] pointer-events-none z-20 will-change-transform"
            style={{
              top: 0,
              transform: "translateY(0px)",
              transition: "transform 150ms cubic-bezier(0.2, 0, 0, 1), opacity 150ms ease",
            }}
          />

          <div className="hidden md:block px-2 text-[10px] uppercase font-bold tracking-wider text-neutral-500 mb-1">
            Navigation
          </div>
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
                className={`group relative flex items-center justify-center md:justify-between rounded-xl px-2.5 md:pl-3.5 md:pr-2.5 py-2.5 text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-md shadow-emerald-500/10 font-bold"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-900/50 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`h-[18px] w-[18px] shrink-0 transition-transform duration-200 ${
                      isActive
                        ? "text-emerald-400 scale-110"
                        : "text-neutral-400 group-hover:text-white"
                    }`}
                  />
                  <span className="hidden md:block whitespace-nowrap">{label}</span>
                </div>
                {isActive ? (
                  <span className="hidden md:flex relative h-1.5 w-1.5 shrink-0 mr-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                  </span>
                ) : !user && !loading ? (
                  <Lock className="hidden md:block h-3 w-3 text-neutral-600 group-hover:text-emerald-400/80 transition" />
                ) : null}
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
            <Link
              href="/profile"
              title="Open Athlete Profile & Macro Settings"
              className={`flex items-center gap-2.5 rounded-xl border px-2 py-1.5 transition group cursor-pointer ${
                pathname.startsWith("/profile")
                  ? "border-emerald-500/50 bg-neutral-900 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500/30"
                  : "border-neutral-800 bg-neutral-900/60 hover:border-emerald-500/50 hover:bg-neutral-900"
              }`}
            >
              {athleteAvatar?.startsWith("data:") || athleteAvatar?.startsWith("http") ? (
                <img src={athleteAvatar} alt="Avatar" className="h-7 w-7 rounded-lg object-cover" />
              ) : athleteAvatar ? (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-neutral-800 text-base shadow-inner group-hover:scale-105 transition">
                  {athleteAvatar}
                </div>
              ) : (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 text-neutral-950 font-bold text-xs uppercase shadow-sm group-hover:scale-105 transition">
                  {((athleteName || user?.email || "A")).charAt(0)}
                </div>
              )}
              <div className="hidden md:flex flex-col overflow-hidden text-left">
                <span className="max-w-[120px] truncate text-xs text-neutral-200 font-semibold group-hover:text-emerald-300 transition">
                  {athleteName || user?.email?.split("@")[0] || "Guest Athlete"}
                </span>
                <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                  <span>{hasProfile ? "Profile Active" : "Setup Profile"}</span>
                  <ChevronRight className="h-2.5 w-2.5 opacity-60 group-hover:translate-x-0.5 transition" />
                </span>
              </div>
            </Link>

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
                href="/profile"
                title="Create Profile or Sign In"
                className="flex items-center justify-center md:justify-start gap-2 rounded-xl bg-emerald-500 px-2.5 py-2 text-xs font-bold text-neutral-950 shadow-sm shadow-emerald-500/25 hover:bg-emerald-400 transition"
              >
                <UserIcon className="h-[18px] w-[18px] shrink-0" />
                <span className="hidden md:block whitespace-nowrap">Sign In / Sign Up</span>
              </Link>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
