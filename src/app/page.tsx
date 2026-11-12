"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Dumbbell,
  Sparkles,
  TrendingUp,
  UserRound,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";

type Step = {
  id: string;
  icon: LucideIcon;
  label: string;
  title: string;
  body: string;
  tip: string;
  href: string;
  cta: string;
};

const STEPS: Step[] = [
  {
    id: "profile",
    icon: UserRound,
    label: "Profile",
    title: "Set up your profile",
    body: "Enter your height, weight, activity level and goal: cut, maintain or bulk. StrengthWise uses it to set your daily calories and macros.",
    tip: "You can change your calorie target anytime from your profile.",
    href: "/profile",
    cta: "Create profile",
  },
  {
    id: "workouts",
    icon: Dumbbell,
    label: "Workouts",
    title: "Follow your split and log sets",
    body: "Pick a split (Upper/Lower, Push/Pull/Legs, Full Body) or build your own. Tap Log Workout to record weight and reps for each set.",
    tip: "Use the built-in rest timer between sets.",
    href: "/workouts",
    cta: "Open Workouts",
  },
  {
    id: "meals",
    icon: Utensils,
    label: "Meals",
    title: "Log what you eat",
    body: "Tap Scan Food to read a barcode or nutrition label with your camera, or Search Foods to find it. Your macros update as you go.",
    tip: "Your day resets at a time you choose, which helps if you train late.",
    href: "/meals",
    cta: "Open Meals",
  },
  {
    id: "progress",
    icon: TrendingUp,
    label: "Progress",
    title: "Watch your progress",
    body: "Tap Log Weigh-in to track bodyweight against your goal, and see how your main lifts trend week to week.",
    tip: "Weigh in at the same time of day for cleaner trends.",
    href: "/progress",
    cta: "Open Progress",
  },
  {
    id: "coach",
    icon: Sparkles,
    label: "Coach",
    title: "Ask the AI coach",
    body: "Ask about training, nutrition or exercise swaps. The coach already knows your profile, so answers fit you. Tell it what you ate and it logs the meal.",
    tip: "Try: “I had two eggs and toast for breakfast.”",
    href: "/coach",
    cta: "Open Coach",
  },
];

export default function LandingPage() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    supabase.auth
      .getUser()
      .then(({ data }: { data: { user: User | null } }) => setUser(data.user))
      .catch(() => setUser(null));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  const step = STEPS[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === STEPS.length - 1;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* Hero */}
      <section className="px-4 pt-16 pb-12 sm:px-6 lg:pt-24">
        <div className="mx-auto max-w-3xl text-center space-y-6">
          <span className="text-xs font-mono font-medium tracking-widest text-emerald-400 uppercase">
            StrengthWise AI
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-[1.1]">
            Training, nutrition and coaching in one place.
          </h1>
          <p className="text-base sm:text-lg text-neutral-400 max-w-xl mx-auto">
            Log your lifts and meals, track your progress, and get advice from a coach that knows your numbers.
          </p>
          <div className="flex justify-center pt-2">
            <Link
              href={user ? "/workouts" : "/profile"}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold px-6 py-3 text-sm transition-colors duration-150 ease-out"
            >
              <span>{user ? "Open Workouts" : "Get started free"}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Tutorial */}
      <section id="tutorial" className="px-4 pb-16 sm:px-6 sm:pb-24">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">How it works</h2>
            <p className="text-sm text-neutral-400">Five steps. Every page works with sample data before you sign up.</p>
          </div>

          {/* Step tabs */}
          <div role="tablist" aria-label="Tutorial steps" className="grid grid-cols-5 gap-1 rounded-xl border border-neutral-800 bg-neutral-900 p-1">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const active = i === stepIndex;
              return (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-controls="tutorial-panel"
                  onClick={() => setStepIndex(i)}
                  className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 rounded-lg px-1 py-2 text-[11px] sm:text-xs font-semibold transition-colors duration-150 ease-out ${
                    active ? "bg-neutral-800 text-white" : "text-neutral-400 hover:text-white"
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${active ? "text-emerald-400" : ""}`} />
                  <span className="truncate">{s.label}</span>
                </button>
              );
            })}
          </div>

          {/* Step panel */}
          <div
            id="tutorial-panel"
            role="tabpanel"
            className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 sm:p-8 grid gap-6 md:grid-cols-2 md:items-center"
          >
            <div className="space-y-4">
              <div className="text-xs font-mono font-bold text-emerald-400">
                STEP {stepIndex + 1} OF {STEPS.length}
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white">{step.title}</h3>
              <p className="text-sm text-neutral-300 leading-relaxed">{step.body}</p>
              <p className="text-xs text-neutral-500 border-l-2 border-emerald-500/40 pl-3">{step.tip}</p>
              <Link
                href={step.href}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition-colors duration-150 ease-out"
              >
                <span>{step.cta}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <StepPreview id={step.id} />
          </div>

          {/* Back / Next */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
              disabled={isFirst}
              className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-neutral-400 hover:text-white disabled:opacity-30 disabled:hover:text-neutral-400 transition-colors duration-150 ease-out"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </button>

            <div className="flex gap-1.5" aria-hidden>
              {STEPS.map((s, i) => (
                <span
                  key={s.id}
                  className={`h-1.5 rounded-full transition-all duration-200 ${i === stepIndex ? "w-6 bg-emerald-400" : "w-1.5 bg-neutral-700"}`}
                />
              ))}
            </div>

            {isLast ? (
              <Link
                href={user ? "/workouts" : "/profile"}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-sm font-semibold text-neutral-950 transition-colors duration-150 ease-out"
              >
                <span>{user ? "Start training" : "Get started"}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setStepIndex((i) => Math.min(STEPS.length - 1, i + 1))}
                className="inline-flex items-center gap-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 ease-out"
              >
                <span>Next</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-neutral-800 py-8 px-4 sm:px-6 text-xs text-neutral-500">
        <div className="mx-auto max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-4 w-4 text-emerald-400" />
            <span className="font-semibold text-neutral-300">StrengthWise AI</span>
          </div>
          <span>&copy; {new Date().getFullYear()} StrengthWise</span>
        </div>
      </footer>
    </div>
  );
}

/** A small mock of each app screen so the tutorial shows what the user will see. */
function StepPreview({ id }: { id: string }) {
  const frame = "rounded-xl border border-neutral-800 bg-neutral-950 p-4 space-y-3 text-xs";

  if (id === "profile") {
    return (
      <div className={frame}>
        <Row label="Height" value="6′0″" />
        <Row label="Weight" value="185 lb" />
        <Row label="Activity" value="Moderate" />
        <div className="flex gap-1 rounded-lg bg-neutral-900 p-1">
          {["Cut", "Maintain", "Bulk"].map((g) => (
            <span
              key={g}
              className={`flex-1 rounded-md py-1.5 text-center font-semibold ${g === "Bulk" ? "bg-emerald-500 text-neutral-950" : "text-neutral-400"}`}
            >
              {g}
            </span>
          ))}
        </div>
        <div className="pt-2 border-t border-neutral-800 flex justify-between text-neutral-400">
          <span>Daily target</span>
          <span className="font-mono font-bold text-white">2,950 kcal</span>
        </div>
      </div>
    );
  }

  if (id === "workouts") {
    return (
      <div className={frame}>
        <div className="flex items-center justify-between">
          <span className="font-bold text-white">Upper A</span>
          <span className="rounded-md bg-emerald-500 px-2 py-1 font-semibold text-neutral-950">Log Workout</span>
        </div>
        {[
          ["Bench Press", "4 × 5", "225 lb"],
          ["Chin-ups", "4 × 6", "+35 lb"],
          ["Incline DB Press", "3 × 10", "80 lb"],
        ].map(([name, sets, load]) => (
          <div key={name} className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2">
            <span className="text-neutral-200">{name}</span>
            <span className="font-mono text-neutral-400">
              {sets} <span className="text-emerald-400">{load}</span>
            </span>
          </div>
        ))}
        <div className="text-center font-mono text-neutral-500">Rest 2:41</div>
      </div>
    );
  }

  if (id === "meals") {
    return (
      <div className={frame}>
        <div className="flex gap-2">
          <span className="flex-1 rounded-md bg-emerald-500 py-1.5 text-center font-semibold text-neutral-950">Scan Food</span>
          <span className="flex-1 rounded-md border border-neutral-800 py-1.5 text-center font-semibold text-neutral-300">Search Foods</span>
        </div>
        <Bar label="Calories" value="1,840 / 2,950" pct={62} />
        <Bar label="Protein" value="142 / 185 g" pct={77} />
        <Bar label="Carbs" value="190 / 360 g" pct={53} />
      </div>
    );
  }

  if (id === "progress") {
    const points = [40, 38, 41, 36, 34, 35, 31, 29, 28, 25];
    return (
      <div className={frame}>
        <div className="flex items-center justify-between">
          <span className="font-bold text-white">Bodyweight</span>
          <span className="font-mono text-emerald-400">+4.2 lb / 8 wks</span>
        </div>
        <svg viewBox="0 0 180 50" className="w-full h-16" aria-hidden>
          <polyline
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
            className="text-emerald-400"
            points={points.map((y, i) => `${i * 20},${y}`).join(" ")}
          />
        </svg>
        <Row label="Bench est. 1RM" value="265 lb" />
        <Row label="Squat est. 1RM" value="355 lb" />
      </div>
    );
  }

  return (
    <div className={frame}>
      <div className="ml-auto max-w-[85%] rounded-lg bg-neutral-800 px-3 py-2 text-neutral-200">
        My elbow hurts on skull crushers. What should I swap in?
      </div>
      <div className="max-w-[90%] rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-neutral-300">
        <span className="flex items-center gap-1 font-semibold text-emerald-400 mb-1">
          <Sparkles className="h-3 w-3" /> Coach
        </span>
        Try cable overhead extensions, 3 × 12–15. Easier on the elbow, same triceps work.
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-neutral-400">{label}</span>
      <span className="font-mono text-white">{value}</span>
    </div>
  );
}

function Bar({ label, value, pct }: { label: string; value: string; pct: number }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between">
        <span className="text-neutral-400">{label}</span>
        <span className="font-mono text-neutral-300">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-neutral-800 overflow-hidden">
        <div className="h-full rounded-full bg-emerald-400" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
