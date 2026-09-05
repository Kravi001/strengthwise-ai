"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Database,
  Dumbbell,
  Flame,
  Layers,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  User,
  Utensils,
  XCircle,
} from "lucide-react";

interface HealthStatus {
  timestamp: string;
  services: {
    supabaseAuth: {
      configured: boolean;
      status: string;
      error: string | null;
    };
    postgresPrisma: {
      configured: boolean;
      status: string;
      error: string | null;
    };
  };
}

export default function Home() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const checkHealth = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/health");
      const data = await res.json();
      setHealth(data);
    } catch {
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <main className="relative min-h-screen bg-neutral-950 px-4 py-12 sm:px-6 lg:px-8 text-neutral-100 selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Background glow effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-[38rem] rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute top-1/3 right-10 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl space-y-12">
        {/* Header / Hero */}
        <header className="space-y-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
            <Sparkles className="h-3.5 w-3.5" />
            <span>StrengthWise v2 — Fresh Architecture</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-white">
            Built for Peak <span className="text-emerald-400">Strength & Nutrition</span>
          </h1>
          <p className="mx-auto max-w-2xl text-base sm:text-lg text-neutral-400">
            Freshly initialized on Next.js 15, TypeScript, Tailwind CSS, Supabase, and PostgreSQL via Prisma ORM.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/profile"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-2.5 text-sm font-semibold text-neutral-950 shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-emerald-500 transition"
            >
              <User className="h-4 w-4" />
              <span>Set Up Athlete Profile</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900/80 px-4 py-2.5 text-sm font-medium text-neutral-200 hover:bg-neutral-800 hover:text-white transition"
            >
              <span>Sign In / Create Account</span>
            </Link>
          </div>
        </header>

        {/* Live System Connectivity Card */}
        <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 backdrop-blur-xl shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4 mb-6">
            <div>
              <h2 className="text-lg font-semibold text-neutral-100 flex items-center gap-2">
                <Activity className="h-5 w-5 text-emerald-400" />
                Live Connection Verification
              </h2>
              <p className="text-xs text-neutral-400 mt-1">
                Real-time validation against your Supabase instance and PostgreSQL database.
              </p>
            </div>
            <button
              onClick={checkHealth}
              disabled={loading}
              className="inline-flex items-center gap-2 self-start rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs font-medium text-neutral-200 hover:bg-neutral-700 hover:text-white transition disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-emerald-400" : ""}`} />
              Recheck Status
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Supabase Card */}
            <div className="rounded-xl border border-neutral-800/80 bg-neutral-950/60 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Supabase Authentication</h3>
                    <p className="text-xs text-neutral-400">SSR Auth & User Sessions</p>
                  </div>
                </div>
                <div>
                  {loading ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-800 px-2.5 py-1 text-xs text-neutral-400 font-mono">
                      Checking...
                    </span>
                  ) : health?.services.supabaseAuth.status === "connected" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Connected
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-400">
                      <XCircle className="h-3.5 w-3.5" /> Error
                    </span>
                  )}
                </div>
              </div>
              {health?.services.supabaseAuth.error && (
                <p className="mt-3 text-xs text-red-400/90 font-mono bg-red-950/30 p-2 rounded border border-red-900/40">
                  {health.services.supabaseAuth.error}
                </p>
              )}
            </div>

            {/* Prisma + Postgres Card */}
            <div className="rounded-xl border border-neutral-800/80 bg-neutral-950/60 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
                    <Database className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">PostgreSQL via Prisma</h3>
                    <p className="text-xs text-neutral-400">Relational Database & Connection Pool</p>
                  </div>
                </div>
                <div>
                  {loading ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-800 px-2.5 py-1 text-xs text-neutral-400 font-mono">
                      Checking...
                    </span>
                  ) : health?.services.postgresPrisma.status === "connected" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Connected
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-400">
                      <XCircle className="h-3.5 w-3.5" /> Error
                    </span>
                  )}
                </div>
              </div>
              {health?.services.postgresPrisma.error && (
                <p className="mt-3 text-xs text-red-400/90 font-mono bg-red-950/30 p-2 rounded border border-red-900/40">
                  {health.services.postgresPrisma.error}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Core Architecture Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-5 hover:border-neutral-700 transition">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 mb-3">
              <Layers className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-sm text-neutral-200">Next.js 15 App Router</h3>
            <p className="text-xs text-neutral-400 mt-1">
              React 19 Server Components, Streaming, and server actions for maximum speed.
            </p>
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-5 hover:border-neutral-700 transition">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 mb-3">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-sm text-neutral-200">Supabase SSR Auth</h3>
            <p className="text-xs text-neutral-400 mt-1">
              Pure Supabase session cookies handled automatically via Next.js edge middleware.
            </p>
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-5 hover:border-neutral-700 transition">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 mb-3">
              <Database className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-sm text-neutral-200">PostgreSQL + Prisma</h3>
            <p className="text-xs text-neutral-400 mt-1">
              Clean relational schema designed for users, profiles, workouts, and meals.
            </p>
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-5 hover:border-neutral-700 transition">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 mb-3">
              <Flame className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-sm text-neutral-200">Tailwind CSS</h3>
            <p className="text-xs text-neutral-400 mt-1">
              Modern styling with curated dark palette, glassmorphism, and responsive layout.
            </p>
          </div>
        </section>

        {/* Next Steps Roadmap */}
        <section className="rounded-2xl border border-neutral-800 bg-neutral-900/30 p-6">
          <h2 className="text-base font-semibold text-neutral-200 mb-4">
            Suggested Next Milestones to Build:
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg border border-neutral-800/60 bg-neutral-950/40 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-emerald-400 mb-1">
                <Dumbbell className="h-4 w-4" />
                <span>1. Workout Tracker</span>
              </div>
              <p className="text-xs text-neutral-400">
                Live workout sessions, exercise library, set/rep logging, and rest timer.
              </p>
            </div>

            <div className="rounded-lg border border-neutral-800/60 bg-neutral-950/40 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-cyan-400 mb-1">
                <Utensils className="h-4 w-4" />
                <span>2. Nutrition & Macros</span>
              </div>
              <p className="text-xs text-neutral-400">
                Daily food logging, macro targets (Protein, Carbs, Fat), and TDEE calculation.
              </p>
            </div>

            <div className="rounded-lg border border-neutral-800/60 bg-neutral-950/40 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-purple-400 mb-1">
                <Sparkles className="h-4 w-4" />
                <span>3. AI Strength Coach</span>
              </div>
              <p className="text-xs text-neutral-400">
                Context-aware coaching that gives feedback on recovery, progressive overload, and diet.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
