"use client";

import { Suspense, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Dumbbell,
  Eye,
  EyeOff,
  Lock,
  Mail,
  MailCheck,
  RefreshCw,
  User as UserIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "signin";
  const urlError = searchParams.get("error");

  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(urlError);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [emailConfirmationSent, setEmailConfirmationSent] = useState(false);
  const [resending, setResending] = useState(false);
  const [isPending, startTransition] = useTransition();

  const supabase = createClient();

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
          // Sign Up flow with email redirect to callback
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

          // If session is already created (email confirmation is off in Supabase settings)
          if (data.session) {
            setSuccessMsg("Account created successfully! Redirecting...");
            router.push("/profile");
            router.refresh();
          } else {
            // Email confirmation is required by Supabase
            setEmailConfirmationSent(true);
          }
        } else {
          // Sign In flow
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) {
            if (error.message.toLowerCase().includes("email not confirmed")) {
              setEmailConfirmationSent(true);
              setErrorMsg(
                "Please verify your email address before signing in. Check your inbox for the confirmation link."
              );
            } else {
              setErrorMsg(error.message);
            }
            return;
          }

          if (data.session) {
            router.push("/profile");
            router.refresh();
          }
        }
      } catch (err: unknown) {
        setErrorMsg(
          err instanceof Error ? err.message : "An unexpected error occurred."
        );
      }
    });
  };

  const handleResendConfirmation = async () => {
    if (!email) return;
    setResending(true);
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
        setErrorMsg(error.message);
      } else {
        setSuccessMsg("A fresh confirmation link has been sent to your email!");
      }
    } catch {
      setErrorMsg("Failed to resend confirmation email.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link
            href="/"
            className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-neutral-950 shadow-lg shadow-emerald-500/20"
          >
            <Dumbbell className="h-6 w-6" />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {emailConfirmationSent
              ? "Check Your Email"
              : mode === "signin"
              ? "Welcome back"
              : "Create your account"}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400">
            {emailConfirmationSent
              ? "We've sent a verification link to activate your StrengthWise account."
              : mode === "signin"
              ? "Sign in to access your workouts, nutrition, and AI coach."
              : "Start tracking your progressive overload and sports nutrition today."}
          </p>
        </div>

        {/* Email Confirmation Pending Screen */}
        {emailConfirmationSent ? (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 sm:p-8 backdrop-blur-xl space-y-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
              <MailCheck className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <p className="text-sm text-neutral-300">
                A confirmation email has been dispatched to:
              </p>
              <div className="inline-block rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 font-mono text-sm text-emerald-300">
                {email}
              </div>
              <p className="text-xs text-neutral-400 pt-2">
                Click the confirmation link inside the email to complete your registration. You will be automatically redirected to complete your profile.
              </p>
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 rounded-lg border border-red-900/40 bg-red-950/30 p-3 text-xs text-red-400 text-left">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-900/40 bg-emerald-950/30 p-3 text-xs text-emerald-400 text-left">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleResendConfirmation}
                disabled={resending}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-700 transition disabled:opacity-50"
              >
                {resending ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-emerald-400" />
                    <span>Resending...</span>
                  </>
                ) : (
                  <span>Resend Confirmation Email</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setEmailConfirmationSent(false);
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="text-xs text-neutral-400 hover:text-neutral-200 transition"
              >
                Use a different email or sign in
              </button>
            </div>
          </div>
        ) : (
          /* Authentication Form Card */
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
            {/* Mode Switch Tabs */}
            <div className="flex rounded-xl bg-neutral-950 p-1 border border-neutral-800">
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${
                  mode === "signin"
                    ? "bg-neutral-800 text-white shadow-sm"
                    : "text-neutral-400 hover:text-neutral-200"
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
                    ? "bg-neutral-800 text-white shadow-sm"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Error & Success Messages */}
            {errorMsg && (
              <div className="flex items-center gap-2 rounded-lg border border-red-900/40 bg-red-950/30 p-3 text-xs text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-900/40 bg-emerald-950/30 p-3 text-xs text-emerald-400">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Field (Sign Up Only) */}
              {mode === "signup" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-300">
                    Your Name
                  </label>
                  <div className="relative">
                    <UserIcon className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-neutral-500" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Alex Mercer"
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-2.5 pl-10 pr-4 text-sm text-neutral-100 placeholder-neutral-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-300">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-neutral-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="athlete@strengthwise.ai"
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-2.5 pl-10 pr-4 text-sm text-neutral-100 placeholder-neutral-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-neutral-300">
                    Password
                  </label>
                  {mode === "signin" && (
                    <span className="text-[11px] text-neutral-500">
                      Minimum 6 characters
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-neutral-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-2.5 pl-10 pr-10 text-sm text-neutral-100 placeholder-neutral-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-neutral-500 hover:text-neutral-300"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isPending}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3 text-sm font-semibold text-neutral-950 shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-emerald-500 transition disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-neutral-950" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {mode === "signin" ? "Sign In to StrengthWise" : "Create Account"}
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <div className="text-center">
              <p className="text-xs text-neutral-400">
                {mode === "signin" ? (
                  <>
                    Don&apos;t have an account yet?{" "}
                    <button
                      type="button"
                      onClick={() => setMode("signup")}
                      className="font-medium text-emerald-400 hover:text-emerald-300 underline"
                    >
                      Sign up for free
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setMode("signin")}
                      className="font-medium text-emerald-400 hover:text-emerald-300 underline"
                    >
                      Sign in
                    </button>
                  </>
                )}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center text-sm text-neutral-400">
          <RefreshCw className="h-5 w-5 animate-spin text-emerald-400 mr-2" />
          <span>Loading sign in...</span>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

