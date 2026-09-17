"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Dumbbell, Home, LogOut, User as UserIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";

export function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

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
    { href: "/", label: "Home", icon: Home, exact: true },
    { href: "/profile", label: "Profile", icon: UserIcon, exact: false },
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
          {navLinks.map(({ href, label, icon: Icon, exact }) => {
            const isActive = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                title={label}
                className={`group flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-xs font-semibold transition ${
                  isActive
                    ? "bg-neutral-900 text-emerald-400 border border-neutral-700/80 shadow-sm shadow-emerald-500/10"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-900/50"
                }`}
              >
                <Icon className={`h-[18px] w-[18px] shrink-0 ${isActive ? "text-emerald-400" : "text-neutral-400 group-hover:text-white"}`} />
                <span className="hidden md:block whitespace-nowrap">{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom: User Session */}
      <div className="border-t border-neutral-800/80 p-2 md:p-3 space-y-2">
        {loading ? (
          <div className="h-8 w-full animate-pulse rounded-lg bg-neutral-800/50" />
        ) : user ? (
          <>
            {/* User avatar / email */}
            <Link
              href="/profile"
              title={user.email}
              className="flex items-center gap-2.5 rounded-xl border border-neutral-800 bg-neutral-900/60 px-2 py-1.5 hover:border-neutral-700 transition"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 text-neutral-950 font-bold text-xs uppercase shadow-sm">
                {(user.email ?? "A").charAt(0)}
              </div>
              <span className="hidden md:block max-w-[130px] truncate text-xs text-neutral-300 font-medium">
                {user.email}
              </span>
            </Link>

            {/* Sign Out */}
            <button
              onClick={handleSignOut}
              title="Sign Out"
              className="w-full flex items-center justify-center md:justify-start gap-2 rounded-xl border border-neutral-800/80 bg-neutral-900/80 px-2 py-2 text-xs font-medium text-neutral-400 hover:bg-neutral-800 hover:text-red-400 transition"
            >
              <LogOut className="h-[18px] w-[18px] shrink-0" />
              <span className="hidden md:block whitespace-nowrap">Sign Out</span>
            </button>
          </>
        ) : (
          <Link
            href="/login"
            title="Sign In"
            className="flex items-center justify-center md:justify-start gap-2 rounded-xl bg-emerald-500 px-2.5 py-2.5 text-xs font-bold text-neutral-950 shadow-sm shadow-emerald-500/25 hover:bg-emerald-400 transition"
          >
            <UserIcon className="h-[18px] w-[18px] shrink-0" />
            <span className="hidden md:block whitespace-nowrap">Sign In</span>
          </Link>
        )}
      </div>
    </aside>
  );
}
