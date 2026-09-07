"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, Title, Subtitle, Text, Divider } from "@/components/tremor";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Dumbbell,
  Eye,
  EyeOff,
  LayoutDashboard,
  Lock,
  LogOut,
  Mail,
  MailCheck,
  RefreshCw,
  Sparkles,
  User as UserIcon,
  Zap,
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
  const [loading, setLoading] = useState(true);
  const [viewingDashboard, setViewingDashboard] = useState(false);

  // Login / Registration Form State
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [emailConfirmationSent, setEmailConfirmationSent] = useState(false);
  const [resending, setResending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const supabase = createClient();

  // Load authenticated session
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
    } finally {
      setLoading(false);
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

  // 1. Google OAuth Sign-In
  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setGoogleLoading(true);
    try {
      const origin = window.location.origin;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/auth/callback`,
        },
      });

      if (error) {
        setErrorMsg(error.message);
        setGoogleLoading(false);
      }
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : "Failed to initiate Google sign-in."
      );
      setGoogleLoading(false);
    }
  };

  // 2. Email + Password Authentication Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email || !password) {
      setErrorMsg("Please provide both email and password.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    startTransition(async () => {
      try {
        if (mode === "signup") {
          const origin = window.location.origin;
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: name || email.split("@")[0],
              },
              emailRedirectTo: `${origin}/auth/callback`,
            },
          });

          if (error) {
            setErrorMsg(error.message);
            return;
          }

          if (data.session) {
            setSuccessMsg("Account created! Welcome to StrengthWise AI.");
            refreshData();
          } else {
            setEmailConfirmationSent(true);
            setSuccessMsg("Confirmation email dispatched. Verify or use instant activation below.");
          }
        } else {
          // Sign In
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) {
            if (error.message.toLowerCase().includes("email not confirmed")) {
              setEmailConfirmationSent(true);
              setErrorMsg(
                "Your email address has not been confirmed yet. Check your inbox or click 'Instant Verify' below to activate your account."
              );
            } else {
              setErrorMsg(error.message);
            }
            return;
          }

          if (data.session) {
            refreshData();
          }
        }
      } catch (err: unknown) {
        setErrorMsg(
          err instanceof Error ? err.message : "An unexpected authentication error occurred."
        );
      }
    });
  };

  // 3. Instant Dev-Verify bypass for local testing
  const handleInstantVerify = async () => {
    if (!email) return;
    setVerifying(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/auth/dev-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to verify account.");
      }

      setSuccessMsg("Account instantly verified! Signing you in...");
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setErrorMsg("Account verified! Please re-enter your password to sign in.");
      } else {
        refreshData();
      }
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : "Could not complete instant verification."
      );
    } finally {
      setVerifying(false);
    }
  };

  // 4. Resend confirmation email
  const handleResendConfirmation = async () => {
    if (!email) return;
    setResending(true);
    setErrorMsg(null);
    try {
      const origin = window.location.origin;
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${origin}/auth/callback`,
        },
      });

      if (error) {
        throw error;
      }

      setSuccessMsg(`Confirmation email resent to ${email}. Check your spam/promotions folder.`);
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : "Failed to resend confirmation email."
      );
    } finally {
      setResending(false);
    }
  };

  // 5. Sign Out
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setViewingDashboard(false);
  };

  // If authenticated user launches full Tremor Dashboard Shell
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

  // ==========================================
  // VIEW A: AUTHENTICATED ATHLETE PROFILE
  // ==========================================
  if (user) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800/80 pb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-0.5 text-xs font-medium text-emerald-400 mb-2">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Athlete Account</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white">
              User Profile
            </h1>
            <p className="text-sm text-neutral-400 mt-1">
              Manage your StrengthWise AI account and launch your training dashboard.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2 text-xs font-medium text-neutral-400 hover:bg-neutral-800 hover:text-red-400 transition self-start"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Profile Card */}
        <Card decoration="top" decorationColor="emerald" className="bg-neutral-900/60 border-neutral-800 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-tr from-emerald-500 to-cyan-500 text-neutral-950 font-black text-2xl shadow-lg shadow-emerald-500/20">
              {(user.user_metadata?.full_name || user.email || "SW").charAt(0).toUpperCase()}
            </div>

            <div className="space-y-2 flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  {user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "Strength Athlete"}
                </h2>
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                  CONNECTED
                </span>
              </div>
              <p className="text-sm font-mono text-neutral-300">{user.email}</p>
              <p className="text-xs text-neutral-500">
                Authentication via Supabase &bull; User ID:{" "}
                <span className="font-mono">{user.id.slice(0, 12)}...</span>
              </p>
            </div>
          </div>

          <Divider className="my-2" />

          {/* Quick Dashboard Action */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl bg-neutral-950/80 border border-neutral-800/80 p-4">
            <div>
              <h3 className="text-sm font-bold text-white">Tremor Athlete Dashboard</h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Access your training logs, AI Coach interactive assistant, and sports nutrition targets.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setViewingDashboard(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-bold text-neutral-950 hover:bg-emerald-400 shadow-md shadow-emerald-500/20 transition"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Launch Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </Card>
      </div>
    );
  }

  // ==========================================
  // VIEW B: LOGIN / SIGN-UP USER INTERFACE
  // ==========================================
  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-neutral-950 shadow-lg shadow-emerald-500/20 mx-auto">
            <Dumbbell className="h-6 w-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            {mode === "signin" ? "Sign In to Your Account" : "Create Athlete Account"}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400">
            {mode === "signin"
              ? "Access your StrengthWise AI coach and sports nutrition telemetry."
              : "Start tracking your progressive overload with clinical precision."}
          </p>
        </div>

        {/* Tab Switcher: Sign In vs Create Account */}
        <div className="flex rounded-xl bg-neutral-900 p-1 border border-neutral-800">
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${
              mode === "signin"
                ? "bg-emerald-500 text-neutral-950 shadow-sm shadow-emerald-500/20"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${
              mode === "signup"
                ? "bg-emerald-500 text-neutral-950 shadow-sm shadow-emerald-500/20"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Status Alerts */}
        {errorMsg && (
          <div className="flex items-start gap-2.5 rounded-xl border border-red-900/40 bg-red-950/30 p-3.5 text-xs text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-start gap-2.5 rounded-xl border border-emerald-900/40 bg-emerald-950/30 p-3.5 text-xs text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Card Container */}
        <Card decoration="top" decorationColor="emerald" className="bg-neutral-900/60 border-neutral-800 p-6 space-y-5">
          {/* 1. Google One-Click OAuth */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-neutral-700 bg-neutral-800/80 px-4 py-3 text-xs font-medium text-white shadow-sm hover:bg-neutral-700 hover:border-neutral-600 transition disabled:opacity-50"
          >
            {googleLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin text-neutral-400" />
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24">
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
            )}
            <span>Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-neutral-800" />
            <span className="relative bg-neutral-900 px-3 text-[11px] uppercase tracking-wider text-neutral-500 font-semibold">
              Or with email
            </span>
          </div>

          {/* 2. Email Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-300">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
                  <input
                    type="text"
                    required
                    placeholder="Alex Smith"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 pl-10 pr-3 py-2.5 text-xs text-neutral-100 placeholder:text-neutral-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-300">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
                <input
                  type="email"
                  required
                  placeholder="athlete@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 pl-10 pr-3 py-2.5 text-xs text-neutral-100 placeholder:text-neutral-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-neutral-300">Password</label>
                <span className="text-[10px] text-neutral-500">Min. 6 chars</span>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 pl-10 pr-10 py-2.5 text-xs text-neutral-100 placeholder:text-neutral-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-neutral-500 hover:text-neutral-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3 text-xs font-bold text-neutral-950 shadow-md shadow-emerald-500/20 hover:from-emerald-400 hover:to-emerald-500 transition disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>{mode === "signin" ? "Sign In to Account" : "Create Account"}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Pending Email Confirmation Assist */}
          {emailConfirmationSent && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-semibold text-emerald-400">
                <MailCheck className="h-4 w-4" />
                <span>Confirmation Email Sent</span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Check your inbox at <span className="font-mono text-neutral-200">{email}</span>. If you do not see it or want instant testing access, activate directly:
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleInstantVerify}
                  disabled={verifying}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 py-1.5 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/30 transition disabled:opacity-50"
                >
                  {verifying ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
                  <span>Instant Verify Account</span>
                </button>
                <button
                  type="button"
                  onClick={handleResendConfirmation}
                  disabled={resending}
                  className="inline-flex items-center justify-center rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-[11px] font-medium text-neutral-300 hover:bg-neutral-700 transition disabled:opacity-50"
                >
                  {resending ? "Sending..." : "Resend"}
                </button>
              </div>
            </div>
          )}
        </Card>

        {/* Footer info */}
        <div className="text-center text-[11px] text-neutral-500 space-y-1">
          <p>Protected by Supabase Auth with PostgreSQL Row Level Security.</p>
          <p>
            Learn more about our science and mission on the{" "}
            <Link href="/" className="text-emerald-400 hover:underline">
              About Page
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
