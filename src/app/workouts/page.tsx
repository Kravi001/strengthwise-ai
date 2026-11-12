"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Dumbbell, Plus, RotateCcw, Trash2 } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { WorkoutBuilder } from "@/components/workout-builder";
import { WorkoutCalendar } from "@/components/workout-calendar";
import { GuestAuthModal } from "@/components/guest-auth-modal";
import { PageHeader } from "@/components/page-header";
import { SampleDataBanner } from "@/components/sample-data-banner";
import { parseExercises, type WorkoutExercise } from "@/lib/workout-format";
import { formatDisplayDate, getLocalDateString } from "@/lib/date";

interface LoggedWorkout {
  id: string;
  name: string;
  durationMinutes: number | null;
  caloriesBurned: number | null;
  notes: string | null;
  loggedAt: string;
}

interface WorkoutSummary {
  thisWeekCount: number;
  weeklyMinutes: number;
  totalWorkouts: number;
}

const SAMPLE_WORKOUTS: LoggedWorkout[] = [
  {
    id: "sample-1",
    name: "Push day",
    durationMinutes: 60,
    caloriesBurned: 420,
    loggedAt: new Date().toISOString(),
    notes: "Bench Press: 185 lb × 8, 185 lb × 8, 185 lb × 6\nOverhead Press: 95 lb × 10, 95 lb × 8\nDips: × 12, × 10",
  },
  {
    id: "sample-2",
    name: "Leg day",
    durationMinutes: 55,
    caloriesBurned: 390,
    loggedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    notes: "Back Squat: 225 lb × 5, 225 lb × 5, 225 lb × 5\nRomanian Deadlift: 185 lb × 8, 185 lb × 8",
  },
];

interface BuilderPrefill {
  name: string;
  exercises?: WorkoutExercise[];
  date?: string;
}

const SAMPLE_SUMMARY: WorkoutSummary = { thisWeekCount: 2, weeklyMinutes: 115, totalWorkouts: 2 };

export default function WorkoutsPage() {
  const supabase = createClient();
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [weightKg, setWeightKg] = useState(80);
  const [workouts, setWorkouts] = useState<LoggedWorkout[]>([]);
  const [summary, setSummary] = useState<WorkoutSummary>({ thisWeekCount: 0, weeklyMinutes: 0, totalWorkouts: 0 });

  const [month, setMonth] = useState(() => new Date());
  const [monthWorkouts, setMonthWorkouts] = useState<LoggedWorkout[]>([]);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const [builderOpen, setBuilderOpen] = useState(false);
  const [builderPrefill, setBuilderPrefill] = useState<BuilderPrefill>({ name: "" });
  const [guestModalOpen, setGuestModalOpen] = useState(false);

  const fetchWorkouts = useCallback(async () => {
    try {
      const res = await fetch("/api/workouts");
      if (!res.ok) return;
      const data = await res.json();
      setWorkouts(data.workouts ?? []);
      setSummary(data.summary ?? { thisWeekCount: 0, weeklyMinutes: 0, totalWorkouts: 0 });
    } catch (err) {
      console.warn("Failed to fetch workouts:", err);
    }
  }, []);

  const fetchMonth = useCallback(async (m: Date) => {
    const from = new Date(m.getFullYear(), m.getMonth(), 1).toISOString();
    const to = new Date(m.getFullYear(), m.getMonth() + 1, 1).toISOString();
    try {
      const res = await fetch(`/api/workouts?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
      if (!res.ok) return;
      const data = await res.json();
      setMonthWorkouts(data.workouts ?? []);
    } catch (err) {
      console.warn("Failed to fetch workouts for month:", err);
    }
  }, []);

  // Load the visible month's workouts for the calendar.
  useEffect(() => {
    if (loading) return;
    if (authUser) fetchMonth(month);
    else setMonthWorkouts(SAMPLE_WORKOUTS);
  }, [authUser, loading, month, fetchMonth]);

  const refresh = useCallback(async () => {
    await Promise.all([fetchWorkouts(), fetchMonth(month)]);
  }, [fetchWorkouts, fetchMonth, month]);

  const countsByDay = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const w of monthWorkouts) {
      const day = getLocalDateString(new Date(w.loggedAt));
      counts[day] = (counts[day] ?? 0) + 1;
    }
    return counts;
  }, [monthWorkouts]);

  const visibleWorkouts = selectedDay
    ? monthWorkouts.filter((w) => getLocalDateString(new Date(w.loggedAt)) === selectedDay)
    : workouts;

  useEffect(() => {
    document.title = "Workouts — StrengthWise";
    async function load() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setAuthUser(user);

        if (!user) {
          setWorkouts(SAMPLE_WORKOUTS);
          setSummary(SAMPLE_SUMMARY);
          return;
        }

        // Bodyweight is only used to estimate calories burned.
        const profileRes = await fetch("/api/profile").catch(() => null);
        if (profileRes?.ok) {
          const data = await profileRes.json();
          if (data.profile?.weightKg) setWeightKg(data.profile.weightKg);
        }
        await fetchWorkouts();
      } catch (err) {
        console.warn("Error loading workouts:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [supabase, fetchWorkouts]);

  const openBuilder = (prefill: BuilderPrefill = { name: "" }) => {
    if (!authUser) {
      setGuestModalOpen(true);
      return;
    }
    setBuilderPrefill(prefill);
    setBuilderOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this workout?")) return;
    try {
      await fetch(`/api/workouts?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      await refresh();
    } catch (err) {
      console.warn("Failed to delete workout:", err);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 pb-24">
      <PageHeader
        title="Workouts"
        description="Build a workout from any exercises you like and log your sets."
        actions={
          <button
            type="button"
            onClick={() => openBuilder({ name: "", date: selectedDay ?? undefined })}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-sm font-semibold text-neutral-950 transition-colors duration-150 ease-out"
          >
            <Plus className="h-4 w-4" />
            <span>New workout</span>
          </button>
        }
      />

      {!authUser && !loading && (
        <SampleDataBanner
          message="Sign in to build and save your own workouts."
          redirectPath="/workouts"
        />
      )}

      <div className="grid grid-cols-3 gap-3">
        <Stat label="This week" value={summary.thisWeekCount} unit={summary.thisWeekCount === 1 ? "workout" : "workouts"} />
        <Stat label="Time this week" value={summary.weeklyMinutes} unit="min" />
        <Stat label="Logged" value={summary.totalWorkouts} unit="total" />
      </div>

      <WorkoutCalendar
        month={month}
        onMonthChange={(m) => {
          setMonth(m);
          setSelectedDay(null);
        }}
        countsByDay={countsByDay}
        selectedDay={selectedDay}
        onSelectDay={setSelectedDay}
      />

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-neutral-300">
            {selectedDay ? formatDisplayDate(selectedDay) : "Recent workouts"}
          </h2>
          {selectedDay && (
            <button
              type="button"
              onClick={() => setSelectedDay(null)}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors duration-150 ease-out"
            >
              Show all
            </button>
          )}
        </div>

        {visibleWorkouts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/50 p-10 text-center space-y-3">
            <Dumbbell className="mx-auto h-8 w-8 text-neutral-500" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-white">
                {loading ? "Loading…" : selectedDay ? "No workouts on this day" : "No workouts yet"}
              </p>
              {!loading && (
                <p className="text-xs text-neutral-400">
                  {selectedDay ? "Missed logging one? Add it to this day." : "Create your first workout by adding the exercises you did."}
                </p>
              )}
            </div>
            {!loading && (
              <button
                type="button"
                onClick={() => openBuilder({ name: "", date: selectedDay ?? undefined })}
                className="inline-flex items-center gap-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 ease-out"
              >
                <Plus className="h-4 w-4" />
                {selectedDay ? "Log a workout for this day" : "New workout"}
              </button>
            )}
          </div>
        ) : (
          <ul className="space-y-3">
            {visibleWorkouts.map((w) => {
              const exercises = parseExercises(w.notes);
              return (
                <li key={w.id} className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-bold text-white">{w.name}</h3>
                      <p className="text-xs text-neutral-500 font-mono">
                        {new Date(w.loggedAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                        {w.durationMinutes ? ` · ${w.durationMinutes} min` : ""}
                        {w.caloriesBurned ? ` · ${w.caloriesBurned} kcal` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openBuilder({ name: w.name, exercises })}
                        title="Do this workout again"
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors duration-150 ease-out"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Repeat
                      </button>
                      {authUser && (
                        <button
                          type="button"
                          onClick={() => handleDelete(w.id)}
                          aria-label={`Delete ${w.name}`}
                          className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-800 hover:text-red-400 transition-colors duration-150 ease-out"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {exercises.length > 0 && (
                    <ul className="divide-y divide-neutral-800 rounded-xl border border-neutral-800 bg-neutral-950">
                      {exercises.map((ex, i) => (
                        <li key={i} className="flex items-baseline justify-between gap-3 px-3 py-2 text-sm">
                          <span className="text-neutral-200">{ex.name}</span>
                          <span className="text-right font-mono text-xs text-neutral-400">
                            {ex.sets
                              .filter((s) => s.reps)
                              .map((s) => (s.weight ? `${s.weight}×${s.reps}` : `${s.reps} reps`))
                              .join("  ")}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <WorkoutBuilder
        isOpen={builderOpen}
        onClose={() => setBuilderOpen(false)}
        onSaved={refresh}
        athleteWeightKg={weightKg}
        initialName={builderPrefill.name}
        initialExercises={builderPrefill.exercises}
        initialDate={builderPrefill.date}
      />

      <GuestAuthModal
        isOpen={guestModalOpen}
        onClose={() => setGuestModalOpen(false)}
        title="Sign in to save your workouts"
        description="Create a free profile to build workouts and keep your history."
        redirectPath="/workouts"
      />
    </div>
  );
}

function Stat({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-3 sm:p-4">
      <div className="text-[11px] font-mono uppercase text-neutral-500">{label}</div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-xl sm:text-2xl font-black text-white font-mono tabular-nums">{value}</span>
        <span className="text-xs text-neutral-500">{unit}</span>
      </div>
    </div>
  );
}
