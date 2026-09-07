"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, Title, Text, Divider } from "@/components/tremor";
import {
  ArrowRight,
  BrainCircuit,
  Code2,
  Database,
  ExternalLink,
  Globe,
  Layers,
  LayoutDashboard,
  Lock,
  LogOut,
  Mail,
  ShieldCheck,
  Sparkles,
  User as UserIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { TremorAppShell } from "@/components/dashboard/tremor-app-shell";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";

interface ProfileData {
  id: string;
  userId: string;
  age: number | null;
  gender: string | null;
  heightCm: number | null;
  weightKg: number | null;
  goalWeightKg: number | null;
  activityLevel: string | null;
  goal: string | null;
  dietPreference: string | null;
  experienceLevel: string | null;
  targetCalories: number | null;
  targetProtein: number | null;
  targetCarbs: number | null;
  targetFat: number | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [viewingDashboard, setViewingDashboard] = useState(false);

  const supabase = createClient();

  const refreshData = async () => {
    try {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      setUser(currentUser);

      if (currentUser) {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const data = await res.json();
          if (data.profile) {
            setProfile(data.profile);
          }
        }
      }
    } catch (err) {
      console.error("Error loading user profile:", err);
    }
  };

  useEffect(() => {
    refreshData();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        setUser(session?.user ?? null);
        if (!session?.user) {
          setProfile(null);
          setViewingDashboard(false);
        } else {
          refreshData();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleGoogleSignIn = async () => {
    const origin = window.location.origin;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setViewingDashboard(false);
    router.push("/login");
    router.refresh();
  };

  // If user explicitly requests to open their Tremor dashboard shell
  if (user && profile && viewingDashboard) {
    return (
      <TremorAppShell
        user={user}
        profile={profile}
        onProfileUpdated={(updated) => {
          setProfile(updated);
        }}
        onSignOut={handleSignOut}
      />
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 space-y-10">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-0.5 text-xs font-medium text-emerald-400 mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            <span>StrengthWise AI Creator</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Creator Profile
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            The mind and engineering behind the StrengthWise sports nutrition &amp; strength engine.
          </p>
        </div>

        {/* Action button if logged in */}
        {user && (
          <div className="flex items-center gap-2">
            {profile && (
              <button
                type="button"
                onClick={() => setViewingDashboard(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-neutral-950 shadow-md shadow-emerald-500/20 hover:bg-emerald-400 transition"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Open App Dashboard</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs font-medium text-neutral-400 hover:bg-neutral-800 hover:text-white transition"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Main Creator Spotlight Card */}
      <Card decoration="top" decorationColor="emerald" className="bg-neutral-900/60 border-neutral-800 p-6 sm:p-8">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8">
          {/* Creator Avatar with Radiant Accent */}
          <div className="relative group shrink-0">
            <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-3xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 p-1 shadow-xl shadow-emerald-500/15">
              <div className="h-full w-full rounded-[22px] bg-neutral-950 flex flex-col items-center justify-center text-white">
                <span className="text-3xl sm:text-4xl font-black tracking-tight bg-gradient-to-br from-emerald-400 to-cyan-300 bg-clip-text text-transparent">
                  KR
                </span>
                <span className="text-[10px] uppercase font-mono tracking-widest text-neutral-400 mt-1">
                  Creator
                </span>
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500 text-neutral-950 shadow-md">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>

          {/* Bio & Details */}
          <div className="flex-1 text-center md:text-left space-y-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Karthik Ravi
                </h2>
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                  Lead Developer &amp; Founder
                </span>
              </div>
              <p className="text-sm font-medium text-cyan-400">
                Full-Stack AI Engineer &amp; Exercise Science Practitioner
              </p>
            </div>

            <p className="text-sm text-neutral-300 leading-relaxed max-w-2xl">
              Creator of <strong>StrengthWise AI</strong>. Built with the objective of eliminating
              guesswork from strength training and macro nutrition by fusing proven metabolic
              equations (Mifflin-St Jeor, adaptive training volume) with autonomous AI assistance
              and real-time data telemetry.
            </p>

            {/* Quick Links / Badges */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
              <a
                href="https://github.com/Kravi001/strengthwise-ai"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-neutral-700 bg-neutral-800/80 px-3.5 py-2 text-xs font-semibold text-white hover:bg-neutral-700 hover:border-neutral-600 transition"
              >
                <svg className="h-4 w-4 fill-current text-neutral-300" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                <span>GitHub Repository</span>
                <ExternalLink className="h-3 w-3 text-neutral-400" />
              </a>

              <a
                href="mailto:karthik.s.ravi@gmail.com"
                className="inline-flex items-center gap-2 rounded-xl border border-neutral-700 bg-neutral-800/80 px-3.5 py-2 text-xs font-semibold text-white hover:bg-neutral-700 hover:border-neutral-600 transition"
              >
                <Mail className="h-4 w-4 text-emerald-400" />
                <span>karthik.s.ravi@gmail.com</span>
              </a>

              <div className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs font-mono text-neutral-400">
                <Globe className="h-3.5 w-3.5 text-cyan-400" />
                <span>Live on Vercel Edge</span>
              </div>
            </div>
          </div>
        </div>

        <Divider className="my-6" />

        {/* Architecture & Tech Stack Highlights */}
        <div>
          <h3 className="text-xs uppercase tracking-wider font-semibold text-neutral-400 mb-3">
            Core Engineering Architecture
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-neutral-800/90 bg-neutral-950/60 p-3.5 space-y-1">
              <div className="flex items-center gap-2 text-emerald-400">
                <Code2 className="h-4 w-4" />
                <span className="text-xs font-bold text-white">Next.js 15.5</span>
              </div>
              <p className="text-[11px] text-neutral-400">
                React 19, Turbopack, App Router &amp; Server Actions
              </p>
            </div>

            <div className="rounded-xl border border-neutral-800/90 bg-neutral-950/60 p-3.5 space-y-1">
              <div className="flex items-center gap-2 text-cyan-400">
                <Database className="h-4 w-4" />
                <span className="text-xs font-bold text-white">Supabase + Prisma</span>
              </div>
              <p className="text-[11px] text-neutral-400">
                PostgreSQL pooler, Row Level Security &amp; OAuth
              </p>
            </div>

            <div className="rounded-xl border border-neutral-800/90 bg-neutral-950/60 p-3.5 space-y-1">
              <div className="flex items-center gap-2 text-amber-400">
                <Layers className="h-4 w-4" />
                <span className="text-xs font-bold text-white">Tremor UI</span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Tailwind CSS design system &amp; clean dashboard aesthetics
              </p>
            </div>

            <div className="rounded-xl border border-neutral-800/90 bg-neutral-950/60 p-3.5 space-y-1">
              <div className="flex items-center gap-2 text-purple-400">
                <BrainCircuit className="h-4 w-4" />
                <span className="text-xs font-bold text-white">AI Coach Engine</span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Dynamic RPE autoregulation &amp; sports science formulas
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* 3. Authenticated Visitor Account Card */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-400">
          Your Account Status
        </h3>

        {user ? (
          <Card decoration="left" decorationColor="emerald" className="bg-neutral-900/60 border-neutral-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <UserIcon className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Title className="text-white text-base">
                      {user.user_metadata?.full_name || user.user_metadata?.name || "Active Athlete"}
                    </Title>
                    <span className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-mono text-emerald-400">
                      CONNECTED
                    </span>
                  </div>
                  <Text className="text-xs text-neutral-400 mt-0.5">{user.email}</Text>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setViewingDashboard(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-neutral-950 hover:bg-emerald-400 transition"
                >
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  <span>Launch Dashboard</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs font-medium text-neutral-400 hover:text-red-400 transition"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </Card>
        ) : (
          <Card decoration="left" decorationColor="cyan" className="bg-neutral-900/60 border-neutral-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <Title className="text-white flex items-center gap-2">
                  <Lock className="h-4 w-4 text-cyan-400" />
                  Visitor Mode
                </Title>
                <Text className="text-xs text-neutral-300">
                  Sign in with Google or Email via Supabase to track your workouts and sync your telemetry with PostgreSQL.
                </Text>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="inline-flex items-center gap-2 rounded-xl border border-neutral-700 bg-neutral-800 px-3.5 py-2 text-xs font-medium text-white hover:bg-neutral-700 transition"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24">
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
                  <span>Sign In with Google</span>
                </button>

                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-neutral-950 hover:bg-emerald-400 transition"
                >
                  <UserIcon className="h-3.5 w-3.5" />
                  <span>Email Sign In</span>
                </Link>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
