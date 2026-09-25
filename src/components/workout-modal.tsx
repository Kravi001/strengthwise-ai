"use client";

import { useState, useEffect } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Dumbbell,
  Flame,
  Plus,
  Sparkles,
  X,
  Zap,
} from "lucide-react";

interface WorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWorkoutLogged: () => void;
  initialWorkoutName?: string;
  initialNotes?: string;
  presetSessions?: { name: string; lifts: string }[];
  athleteWeightKg?: number;
}

export function WorkoutModal({
  isOpen,
  onClose,
  onWorkoutLogged,
  initialWorkoutName = "",
  initialNotes = "",
  presetSessions = [],
  athleteWeightKg = 84,
}: WorkoutModalProps) {
  const [workoutName, setWorkoutName] = useState(initialWorkoutName);
  const [durationMinutes, setDurationMinutes] = useState<number | string>(50);
  const [caloriesBurned, setCaloriesBurned] = useState<number | string>(380);
  const [notes, setNotes] = useState(initialNotes);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync state whenever modal opens or props change
  useEffect(() => {
    if (isOpen) {
      setWorkoutName(initialWorkoutName || (presetSessions[0]?.name ?? "Strength Session"));
      setNotes(initialNotes || (presetSessions[0]?.lifts ?? ""));
      setErrorMsg(null);
      setSuccessMsg(null);

      // Auto calculate estimated calories based on MET 6.0 for resistance training
      const mins = Number(durationMinutes) || 50;
      const weight = athleteWeightKg || 80;
      const estimatedCals = Math.round((6.0 * 3.5 * weight / 200) * mins);
      setCaloriesBurned(estimatedCals);
    }
  }, [isOpen, initialWorkoutName, initialNotes, presetSessions, athleteWeightKg]);

  // Recalculate estimated calories when duration changes
  const handleDurationChange = (val: number | string) => {
    setDurationMinutes(val);
    const mins = Number(val);
    if (mins > 0) {
      const weight = athleteWeightKg || 80;
      const estimatedCals = Math.round((6.0 * 3.5 * weight / 200) * mins);
      setCaloriesBurned(estimatedCals);
    }
  };

  const handleSelectPreset = (preset: { name: string; lifts: string }) => {
    setWorkoutName(preset.name);
    setNotes(preset.lifts);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workoutName.trim()) {
      setErrorMsg("Please provide a name for this workout.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = {
        name: workoutName.trim(),
        durationMinutes: Number(durationMinutes) || null,
        caloriesBurned: Number(caloriesBurned) || null,
        notes: notes.trim() || null,
        loggedAt: new Date().toISOString(),
      };

      const res = await fetch("/api/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to log workout session.");
      }

      setSuccessMsg("Workout session recorded to your training log!");
      setTimeout(() => {
        onWorkoutLogged();
        onClose();
      }, 700);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to record workout.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg rounded-3xl border border-neutral-800 bg-neutral-900/95 p-6 shadow-2xl space-y-6 text-neutral-100 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Dumbbell className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Record Workout Session</span>
                <span className="text-[10px] text-cyan-400 font-mono bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded">
                  PostgreSQL Synced
                </span>
              </h3>
              <p className="text-xs text-neutral-400">
                Log completed lifts, sets, training duration, and caloric load.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Notifications */}
        {errorMsg && (
          <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Quick Select Presets (From Active Split) */}
        {presetSessions.length > 0 && (
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider font-mono">
              Quick Pick From Routine:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {presetSessions.map((session, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectPreset(session)}
                  className={`text-xs px-3 py-1.5 rounded-xl border transition font-medium ${
                    workoutName === session.name
                      ? "bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold shadow-sm"
                      : "bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700"
                  }`}
                >
                  {session.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Workout Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-300">
              Workout / Session Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Upper A (Strength), Legs Hypertrophy, 5km Conditioning"
              value={workoutName}
              onChange={(e) => setWorkoutName(e.target.value)}
              className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-xs text-white placeholder:text-neutral-600 focus:border-cyan-500 focus:outline-none transition"
            />
          </div>

          {/* Duration & Calories Burned */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-cyan-400" />
                <span>Duration (minutes)</span>
              </label>
              <input
                type="number"
                min={1}
                max={360}
                required
                value={durationMinutes}
                onChange={(e) => handleDurationChange(e.target.value)}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none transition"
              />
              {/* Quick duration helpers */}
              <div className="flex gap-1 pt-0.5">
                {[30, 45, 60, 75].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => handleDurationChange(mins)}
                    className="flex-1 text-[10px] font-mono py-1 rounded-lg bg-neutral-800/80 border border-neutral-700/80 text-neutral-300 hover:text-white hover:bg-neutral-700 transition"
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                <Flame className="h-3.5 w-3.5 text-amber-400" />
                <span>Est. Calories Burned</span>
              </label>
              <input
                type="number"
                min={0}
                max={3000}
                value={caloriesBurned}
                onChange={(e) => setCaloriesBurned(e.target.value)}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none transition"
              />
              <span className="text-[10px] text-neutral-500 block pt-0.5">
                Estimated ~6.0 METs for {Math.round(athleteWeightKg)}kg athlete
              </span>
            </div>
          </div>

          {/* Exercises & Set Details / Notes */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-neutral-300">
                Exercises Performed &amp; Notes
              </label>
              <span className="text-[10px] text-neutral-500 font-mono">
                Weights, sets, reps &amp; RPE
              </span>
            </div>
            <textarea
              rows={4}
              placeholder="e.g. Incline DB Bench: 75lbs × 8, 80lbs × 6 @ RPE 8.5&#10;Weighted Pull-ups: +25lbs × 6, 6, 5&#10;Cable Lateral Raises: 25lbs × 15, 15, 12"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-neutral-800 bg-neutral-950 p-3 text-xs text-neutral-200 placeholder:text-neutral-600 focus:border-cyan-500 focus:outline-none transition font-mono leading-relaxed"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800/80">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-2.5 text-xs font-semibold text-neutral-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-xs font-bold text-neutral-950 hover:bg-cyan-400 disabled:opacity-50 transition shadow-lg shadow-cyan-500/20"
            >
              <Zap className="h-4 w-4 text-neutral-950 fill-neutral-950" />
              <span>{isSubmitting ? "Recording..." : "Log Completed Workout"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
