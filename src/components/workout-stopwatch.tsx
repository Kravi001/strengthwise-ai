"use client";

import { useCallback, useEffect, useState } from "react";
import { Flag, Pause, Play, RotateCcw, Timer } from "lucide-react";

const STORAGE_KEY = "sw_workout_stopwatch";

interface StopwatchState {
  /** Epoch ms when the current running stretch began; null while paused or stopped. */
  startedAt: number | null;
  /** Time banked from earlier running stretches. */
  accumulatedMs: number;
}

const IDLE: StopwatchState = { startedAt: null, accumulatedMs: 0 };

function readState(): StopwatchState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return IDLE;
    const parsed = JSON.parse(raw);
    return {
      startedAt: typeof parsed.startedAt === "number" ? parsed.startedAt : null,
      accumulatedMs: typeof parsed.accumulatedMs === "number" ? parsed.accumulatedMs : 0,
    };
  } catch {
    return IDLE;
  }
}

function writeState(state: StopwatchState) {
  try {
    if (state.startedAt === null && state.accumulatedMs === 0) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage unavailable (private mode): the stopwatch still works for this visit.
  }
}

/**
 * A workout stopwatch kept in this browser's storage, so it keeps counting while
 * you switch pages, reload, or lock your phone.
 */
export function useWorkoutStopwatch() {
  const [state, setState] = useState<StopwatchState>(IDLE);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    setState(readState());
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setState(readState());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const running = state.startedAt !== null;
  useEffect(() => {
    if (!running) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [running]);

  const update = useCallback((next: StopwatchState) => {
    setState(next);
    writeState(next);
  }, []);

  const elapsedMs = state.accumulatedMs + (state.startedAt !== null ? Math.max(0, now - state.startedAt) : 0);

  return {
    elapsedMs,
    running,
    started: running || state.accumulatedMs > 0,
    start: () => update({ startedAt: Date.now(), accumulatedMs: state.accumulatedMs }),
    pause: () => update({ startedAt: null, accumulatedMs: elapsedMs }),
    reset: () => update(IDLE),
  };
}

export function formatElapsed(ms: number) {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mmss = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return h > 0 ? `${h}:${mmss}` : mmss;
}

interface WorkoutStopwatchProps {
  stopwatch: ReturnType<typeof useWorkoutStopwatch>;
  onFinish: () => void;
}

export function WorkoutStopwatch({ stopwatch, onFinish }: WorkoutStopwatchProps) {
  const { elapsedMs, running, started, start, pause, reset } = stopwatch;

  if (!started) {
    return (
      <button
        type="button"
        onClick={start}
        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-neutral-800 bg-neutral-900 p-4 text-left hover:border-emerald-500/40 transition-colors duration-150 ease-out"
      >
        <span className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
            <Timer className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-sm font-bold text-white">Start workout timer</span>
            <span className="block text-xs text-neutral-400">Time your session, then log it when you&apos;re done.</span>
          </span>
        </span>
        <Play className="h-5 w-5 shrink-0 text-emerald-400" />
      </button>
    );
  }

  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
        running ? "border-emerald-500/40 bg-emerald-500/5" : "border-neutral-800 bg-neutral-900"
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`h-2.5 w-2.5 rounded-full ${running ? "bg-emerald-400 animate-pulse" : "bg-neutral-500"}`}
          aria-hidden
        />
        <div>
          <div className="text-xs font-semibold text-neutral-400">{running ? "Workout in progress" : "Paused"}</div>
          <div className="font-mono text-3xl font-black tabular-nums text-white" role="timer" aria-live="off">
            {formatElapsed(elapsedMs)}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={running ? pause : start}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-neutral-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-700 transition-colors duration-150 ease-out sm:flex-none"
        >
          {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {running ? "Pause" : "Resume"}
        </button>
        <button
          type="button"
          onClick={() => {
            if (window.confirm("Reset the timer? The current time will be lost.")) reset();
          }}
          aria-label="Reset timer"
          className="rounded-xl p-2.5 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors duration-150 ease-out"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onFinish}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-neutral-950 hover:bg-emerald-400 transition-colors duration-150 ease-out sm:flex-none"
        >
          <Flag className="h-4 w-4" />
          Finish
        </button>
      </div>
    </div>
  );
}
