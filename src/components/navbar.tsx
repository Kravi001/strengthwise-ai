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

  useEffect(() => {
    const getScrollContainer = () => {
      return document.getElementById("main-content") || document.querySelector("main");
    };

    const sections = [
      { id: "home" },
      { id: "meals" },
      { id: "workouts" },
      { id: "progress" },
      { id: "coach" },
    ];

    let rAF: number | null = null;

    const updateSlidingBar = () => {
      const navEl = navRef.current;
      const barEl = barRef.current;
      const links = linkRefs.current;
      if (!navEl || !barEl || links.length < 5) return;

      const mainEl = document.getElementById("main-content");
      const scrollTop =
        window.scrollY ||
        document.documentElement.scrollTop ||
        (mainEl ? mainEl.scrollTop : 0);

      const clientHeight = window.innerHeight;
      const scrollHeight = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight,
        mainEl ? mainEl.scrollHeight : 0
      );
      const maxScroll = Math.max(1, scrollHeight - clientHeight);

      // 1. Get Y coordinates of all 5 nav links relative to <nav> container
      const navRect = navEl.getBoundingClientRect();
      const barHeight = barEl.offsetHeight || 24;
      const linkYs = links.map((link) => {
        if (!link) return 0;
        const r = link.getBoundingClientRect();
        return r.top - navRect.top + (r.height - barHeight) / 2;
      });

      // 2. Measure document offsetTop of each section
      const triggerOffset = 80;

      const sectionScrollTops = sections.map((s, idx) => {
        if (idx === 0) return 0;
        const el = document.getElementById(s.id);
        if (!el) return 0;
        const elRect = el.getBoundingClientRect();
        const docTop = elRect.top + scrollTop;
        return Math.max(0, docTop - triggerOffset);
      });

      // Ensure monotonically increasing scroll targets
      for (let i = 1; i < sectionScrollTops.length; i++) {
        if (sectionScrollTops[i] <= sectionScrollTops[i - 1]) {
          sectionScrollTops[i] = sectionScrollTops[i - 1] + 120;
        }
      }

      // 3. Compute continuous fractional position p in [0, 4]
      let p = 0;
      if (scrollTop <= sectionScrollTops[0]) {
        p = 0;
      } else if (scrollTop >= sectionScrollTops[4] || scrollTop >= maxScroll - 60) {
        p = 4;
      } else {
        for (let i = 0; i < 4; i++) {
          const sCurr = sectionScrollTops[i];
          const sNext = sectionScrollTops[i + 1];
          if (scrollTop >= sCurr && scrollTop <= sNext) {
            const ratio = (scrollTop - sCurr) / (sNext - sCurr);
            p = i + ratio;
            break;
          }
        }
      }

      p = Math.max(0, Math.min(4, p));

      // 4. Interpolate bar position Y between linkYs[k] and linkYs[k+1]
      const k = Math.floor(p);
      const frac = p - k;
      let targetY = linkYs[0];
      if (k >= 4) {
        targetY = linkYs[4];
      } else {
        targetY = linkYs[k] + frac * (linkYs[k + 1] - linkYs[k]);
      }

      // Apply transform directly for smooth 120Hz rendering
      barEl.style.transform = `translateY(${targetY}px)`;

      // 5. Update active link highlight
      const activeIdx = Math.min(4, Math.max(0, Math.round(p)));
      const newActiveId = sections[activeIdx].id;
      setActiveSection(newActiveId);
    };

    const handleScroll = () => {
      if (rAF !== null) cancelAnimationFrame(rAF);
      rAF = requestAnimationFrame(updateSlidingBar);
    };

    // Run initially & after short layout delay
    updateSlidingBar();
    const timer = setTimeout(updateSlidingBar, 150);

    const mainEl = getScrollContainer();
    if (mainEl) {
      mainEl.addEventListener("scroll", handleScroll, { passive: true });
    }
    document.addEventListener("scroll", handleScroll, { capture: true, passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });

    return () => {
      clearTimeout(timer);
      if (rAF !== null) cancelAnimationFrame(rAF);
      if (mainEl) {
        mainEl.removeEventListener("scroll", handleScroll);
      }
      document.removeEventListener("scroll", handleScroll, { capture: true });
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

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

  const handleNavClick = (e: React.MouseEvent, id: string, requiresProfile: boolean) => {
    e.preventDefault();
    const isLocked = requiresProfile && !hasProfile;
    const targetId = isLocked ? "profile-setup" : id;

    if (pathname === "/") {
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      setActiveSection(isLocked ? "home" : id);
      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", `#${targetId}`);
      }
    } else {
      router.push(`/#${targetId}`);
    }
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
              transition: "transform 75ms cubic-bezier(0.2, 0, 0, 1)",
            }}
          />

          <div className="hidden md:block px-2 text-[10px] uppercase font-bold tracking-wider text-neutral-500 mb-1">
            Navigation
          </div>
          {navLinks.map(({ href, label, icon: Icon, id, requiresProfile }, index) => {
            const isLocked = requiresProfile && !hasProfile;
            const isActive = activeSection === id;
            const targetHref = isLocked ? "/#profile-setup" : href;

            return (
              <a
                key={href}
                ref={(el) => {
                  linkRefs.current[index] = el;
                }}
                href={targetHref}
                onClick={(e) => handleNavClick(e, id, requiresProfile)}
                title={isLocked ? `${label} (Create Profile to Unlock)` : label}
                className={`group relative flex items-center justify-between rounded-xl pl-3.5 pr-2.5 py-2.5 text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-md shadow-emerald-500/10 font-bold"
                    : isLocked
                    ? "text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900/30 border border-transparent"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-900/50 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`h-[18px] w-[18px] shrink-0 transition-transform duration-200 ${
                      isActive
                        ? "text-emerald-400 scale-110"
                        : isLocked
                        ? "text-neutral-600 group-hover:text-neutral-400"
                        : "text-neutral-400 group-hover:text-white"
                    }`}
                  />
                  <span className="hidden md:block whitespace-nowrap">{label}</span>
                </div>
                {isLocked ? (
                  <Lock className="hidden md:block h-3.5 w-3.5 text-neutral-600 group-hover:text-amber-400 transition shrink-0" />
                ) : isActive ? (
                  <span className="hidden md:flex relative h-1.5 w-1.5 shrink-0 mr-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                  </span>
                ) : null}
              </a>
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
              className="flex items-center gap-2.5 rounded-xl border border-neutral-800 bg-neutral-900/60 hover:border-emerald-500/50 hover:bg-neutral-900 px-2 py-1.5 transition group cursor-pointer"
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
