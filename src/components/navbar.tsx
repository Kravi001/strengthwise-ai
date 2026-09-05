"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Dumbbell, Info, LogOut, User as UserIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

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
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

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

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-800/80 bg-neutral-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-2.5 font-bold tracking-tight text-white transition hover:opacity-90"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-neutral-950 shadow-md shadow-emerald-500/20">
            <Dumbbell className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-extrabold leading-tight">
              Strength<span className="text-emerald-400">Wise</span>
            </span>
            <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold">
              AI Coach
            </span>
          </div>
        </Link>

        {/* Navigation Tabs: About & Profile */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/"
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs sm:text-sm font-semibold transition ${
              pathname === "/"
                ? "bg-neutral-800 text-emerald-400 border border-neutral-700 shadow-sm"
                : "text-neutral-400 hover:text-white hover:bg-neutral-900/60"
            }`}
          >
            <Info className="h-3.5 w-3.5" />
            <span>About</span>
          </Link>
          <Link
            href="/profile"
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs sm:text-sm font-semibold transition ${
              pathname.startsWith("/profile")
                ? "bg-neutral-800 text-emerald-400 border border-neutral-700 shadow-sm"
                : "text-neutral-400 hover:text-white hover:bg-neutral-900/60"
            }`}
          >
            <UserIcon className="h-3.5 w-3.5" />
            <span>Profile</span>
          </Link>
        </nav>

        {/* User Session CTA */}
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="h-8 w-20 animate-pulse rounded-lg bg-neutral-800/50" />
          ) : user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/profile"
                className="hidden sm:flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900/60 px-2.5 py-1 text-xs text-neutral-300 hover:border-neutral-700 transition"
                title={user.email}
              >
                <UserIcon className="h-3.5 w-3.5 text-emerald-400" />
                <span className="max-w-[140px] truncate">{user.email}</span>
              </Link>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900/80 px-3 py-1.5 text-xs font-medium text-neutral-400 hover:bg-neutral-800 hover:text-red-400 transition"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-1.5 text-xs sm:text-sm font-medium text-neutral-950 shadow-sm shadow-emerald-500/25 hover:bg-emerald-400 transition"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
