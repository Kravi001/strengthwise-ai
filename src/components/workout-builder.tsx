"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Plus, Trash2, X } from "lucide-react";
import { formatExercises, type WorkoutExercise } from "@/lib/workout-format";
import { getLocalDateString } from "@/lib/date";

interface WorkoutBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  athleteWeightKg?: number;
  /** Prefill from a past workout ("Repeat"). */
  initialName?: string;
  initialExercises?: WorkoutExercise[];
  /** "YYYY-MM-DD" day to log the workout on; defaults to today. */
  initialDate?: string;
}

const emptyExercise = (): WorkoutExercise => ({ name: "", sets: [{ weight: "", reps: "" }] });

const inputClass =
  "w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:border-emerald-500 focus:outline-none transition-colors duration-150 ease-out";

export function WorkoutBuilder({
  isOpen,
  onClose,
  onSaved,
  athleteWeightKg = 80,
  initialName = "",
  initialExercises,
  initialDate,
}: WorkoutBuilderProps) {
  const [name, setName] = useState("");
  const [exercises, setExercises] = useState<WorkoutExercise[]>([emptyExercise()]);
  const [duration, setDuration] = useState("60");
  const [date, setDate] = useState(() => getLocalDateString());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setName(initialName);
    setExercises(initialExercises?.length ? initialExercises : [emptyExercise()]);
    setDuration("60");
    setDate(initialDate || getLocalDateString());
    setError(null);
  }, [isOpen, initialName, initialExercises, initialDate]);

  if (!isOpen) return null;

  const updateExercise = (i: number, patch: Partial<WorkoutExercise>) =>
    setExercises((prev) => prev.map((ex, idx) => (idx === i ? { ...ex, ...patch } : ex)));

  const updateSet = (i: number, s: number, field: "weight" | "reps", value: string) =>
    setExercises((prev) =>
      prev.map((ex, idx) =>
        idx === i ? { ...ex, sets: ex.sets.map((set, sIdx) => (sIdx === s ? { ...set, [field]: value } : set)) } : ex
      )
    );

  const addSet = (i: number) =>
    setExercises((prev) =>
      prev.map((ex, idx) => {
        if (idx !== i) return ex;
        // Copy the last set so adding another set of the same weight is one tap.
        const last = ex.sets[ex.sets.length - 1] ?? { weight: "", reps: "" };
        return { ...ex, sets: [...ex.sets, { ...last }] };
      })
    );

  const removeSet = (i: number, s: number) =>
    setExercises((prev) =>
      prev.map((ex, idx) => (idx === i ? { ...ex, sets: ex.sets.filter((_, sIdx) => sIdx !== s) } : ex))
    );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const notes = formatExercises(exercises);
    if (!name.trim()) return setError("Give your workout a name.");
    if (!notes) return setError("Add at least one exercise.");
    const today = getLocalDateString();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return setError("Pick a date for this workout.");
    if (date > today) return setError("You can't log a workout in the future.");

    setSaving(true);
    setError(null);
    try {
      const mins = Number(duration) || null;
      // ~6 METs for resistance training.
      const calories = mins ? Math.round(((6 * 3.5 * athleteWeightKg) / 200) * mins) : null;
      const res = await fetch("/api/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          notes,
          durationMinutes: mins,
          caloriesBurned: calories,
          // Today keeps the current time; a past day is logged at local noon so it stays on that day.
          loggedAt: date === today ? new Date().toISOString() : new Date(`${date}T12:00:00`).toISOString(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Couldn't save your workout.");
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save your workout.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 p-0 sm:p-4"
      onClick={onClose}
    >
      <form
        onSubmit={handleSave}
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-lg max-h-[92vh] flex-col rounded-t-2xl sm:rounded-2xl border border-neutral-800 bg-neutral-900 text-neutral-100"
      >
        <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-4">
          <h2 className="text-base font-bold text-white">New workout</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors duration-150 ease-out"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-neutral-300">Workout name</span>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Push day"
              className={inputClass}
            />
          </label>
          <div className="grid grid-cols-[1fr_96px] gap-3">
            <label className="space-y-1.5">
              <span className="text-xs font-semibold text-neutral-300">Date</span>
              <input
                type="date"
                value={date}
                max={getLocalDateString()}
                onChange={(e) => setDate(e.target.value)}
                className={`${inputClass} [color-scheme:dark]`}
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-semibold text-neutral-300">Minutes</span>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={360}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className={`${inputClass} font-mono`}
              />
            </label>
          </div>

          {exercises.map((ex, i) => (
            <div key={i} className="space-y-2 rounded-xl border border-neutral-800 bg-neutral-950/60 p-3">
              <div className="flex items-center gap-2">
                <input
                  value={ex.name}
                  onChange={(e) => updateExercise(i, { name: e.target.value })}
                  placeholder={`Exercise ${i + 1}, e.g. Bench press`}
                  aria-label={`Exercise ${i + 1} name`}
                  className={`${inputClass} font-semibold`}
                />
                <button
                  type="button"
                  onClick={() => setExercises((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : [emptyExercise()]))}
                  aria-label={`Remove exercise ${i + 1}`}
                  className="shrink-0 rounded-lg p-2 text-neutral-500 hover:bg-neutral-800 hover:text-red-400 transition-colors duration-150 ease-out"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-[28px_1fr_1fr_32px] items-center gap-2 px-1 text-[11px] font-mono uppercase text-neutral-500">
                <span>Set</span>
                <span>Weight (lb)</span>
                <span>Reps</span>
                <span />
              </div>
              {ex.sets.map((set, s) => (
                <div key={s} className="grid grid-cols-[28px_1fr_1fr_32px] items-center gap-2">
                  <span className="text-center font-mono text-xs text-neutral-500">{s + 1}</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="any"
                    value={set.weight}
                    onChange={(e) => updateSet(i, s, "weight", e.target.value)}
                    placeholder="BW"
                    aria-label={`Exercise ${i + 1} set ${s + 1} weight`}
                    className={`${inputClass} font-mono`}
                  />
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={set.reps}
                    onChange={(e) => updateSet(i, s, "reps", e.target.value)}
                    placeholder="0"
                    aria-label={`Exercise ${i + 1} set ${s + 1} reps`}
                    className={`${inputClass} font-mono`}
                  />
                  <button
                    type="button"
                    onClick={() => removeSet(i, s)}
                    disabled={ex.sets.length === 1}
                    aria-label={`Remove set ${s + 1}`}
                    className="rounded-lg p-1.5 text-neutral-600 hover:text-red-400 disabled:invisible transition-colors duration-150 ease-out"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addSet(i)}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-emerald-400 hover:bg-neutral-800 transition-colors duration-150 ease-out"
              >
                <Plus className="h-3.5 w-3.5" />
                Add set
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={() => setExercises((prev) => [...prev, emptyExercise()])}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-neutral-700 py-3 text-sm font-semibold text-neutral-300 hover:border-emerald-500/60 hover:text-white transition-colors duration-150 ease-out"
          >
            <Plus className="h-4 w-4" />
            Add exercise
          </button>
        </div>

        {error && (
          <div role="alert" className="mx-5 mt-3 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 border-t border-neutral-800 px-5 py-4 mt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-neutral-400 hover:text-white transition-colors duration-150 ease-out"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-neutral-950 hover:bg-emerald-400 disabled:opacity-50 transition-colors duration-150 ease-out"
          >
            {saving ? "Saving…" : "Save workout"}
          </button>
        </div>
      </form>
    </div>
  );
}
