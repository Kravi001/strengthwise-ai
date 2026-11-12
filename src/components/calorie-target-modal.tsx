"use client";

import React, { useEffect, useState } from "react";
import { X, Flame, Check, Clock, RotateCcw, Minus, Plus, AlertCircle } from "lucide-react";

export const MIN_TARGET_CALORIES = 1000;
export const MAX_TARGET_CALORIES = 6000;

export interface CalorieTargetValues {
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
}

export interface CalorieTargetModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Targets currently in effect (custom or calculated). */
  current: CalorieTargetValues;
  /** Targets calculated from the athlete's body stats and goal. */
  calculated: CalorieTargetValues;
  /** True when the current target was set manually or by the coach. */
  isCustom: boolean;
  onSave: (values: CalorieTargetValues) => Promise<void>;
  onResetToCalculated: () => Promise<void>;
}

/**
 * Splits a calorie target the same way lib/calc.ts does: protein stays at the
 * bodyweight-based amount, fat is 25% of calories, carbs get the rest.
 */
function balanceMacros(calories: number, protein: number) {
  const fat = Math.round((calories * 0.25) / 9);
  const carbs = Math.max(0, Math.round((calories - protein * 4 - calories * 0.25) / 4));
  return { protein: Math.round(protein), carbs, fat };
}

const inputClass =
  "w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white font-mono font-bold tabular-nums focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";

export function CalorieTargetModal({
  isOpen,
  onClose,
  current,
  calculated,
  isCustom,
  onSave,
  onResetToCalculated,
}: CalorieTargetModalProps) {
  const [caloriesInput, setCaloriesInput] = useState("");
  const [manualMacros, setManualMacros] = useState(false);
  const [proteinInput, setProteinInput] = useState("");
  const [carbsInput, setCarbsInput] = useState("");
  const [fatInput, setFatInput] = useState("");
  const [saving, setSaving] = useState<"save" | "reset" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCaloriesInput(String(current.targetCalories));
      setProteinInput(String(current.targetProtein));
      setCarbsInput(String(current.targetCarbs));
      setFatInput(String(current.targetFat));
      setManualMacros(false);
      setError(null);
      setSuccessMsg(null);
    }
    // Only re-seed when the modal opens, not while the user is typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const calories = Math.round(Number(caloriesInput));
  const caloriesValid =
    Number.isFinite(calories) && calories >= MIN_TARGET_CALORIES && calories <= MAX_TARGET_CALORIES;

  const autoMacros = balanceMacros(caloriesValid ? calories : calculated.targetCalories, calculated.targetProtein);
  const macros = manualMacros
    ? {
        protein: Math.round(Number(proteinInput) || 0),
        carbs: Math.round(Number(carbsInput) || 0),
        fat: Math.round(Number(fatInput) || 0),
      }
    : autoMacros;
  const macroCalories = macros.protein * 4 + macros.carbs * 4 + macros.fat * 9;
  const macroGap = caloriesValid ? macroCalories - calories : 0;

  const stepCalories = (delta: number) => {
    const base = Number.isFinite(calories) && calories > 0 ? calories : calculated.targetCalories;
    const next = Math.min(MAX_TARGET_CALORIES, Math.max(MIN_TARGET_CALORIES, base + delta));
    setCaloriesInput(String(next));
  };

  const handleToggleManual = () => {
    if (!manualMacros) {
      // Start manual editing from the balanced split for the current calories.
      setProteinInput(String(autoMacros.protein));
      setCarbsInput(String(autoMacros.carbs));
      setFatInput(String(autoMacros.fat));
    }
    setManualMacros(!manualMacros);
  };

  const handleSave = async () => {
    if (!caloriesValid) {
      setError(`Enter a calorie target between ${MIN_TARGET_CALORIES} and ${MAX_TARGET_CALORIES} kcal.`);
      return;
    }
    setError(null);
    setSaving("save");
    try {
      await onSave({
        targetCalories: calories,
        targetProtein: macros.protein,
        targetCarbs: macros.carbs,
        targetFat: macros.fat,
      });
      setSuccessMsg(`Daily target set to ${calories} kcal.`);
      setTimeout(onClose, 700);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your target. Try again.");
    } finally {
      setSaving(null);
    }
  };

  const handleReset = async () => {
    setError(null);
    setSaving("reset");
    try {
      await onResetToCalculated();
      setSuccessMsg("Target reset to your calculated value.");
      setTimeout(onClose, 700);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset your target. Try again.");
    } finally {
      setSaving(null);
    }
  };

  const difference = caloriesValid ? calories - calculated.targetCalories : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-in fade-in duration-150 ease-out"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-xl relative text-left"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="calorie-target-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-neutral-300">
              <Flame className="h-6 w-6" />
            </div>
            <div>
              <h2 id="calorie-target-title" className="text-lg font-bold text-white">
                Daily Calorie Target
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Set your own target, or keep the one calculated from your profile.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors duration-150 ease-out"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-5">
          {/* Calories */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4 space-y-3">
            <label htmlFor="calorie-target-input" className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
              <span>Calories per day</span>
              <span className="text-[11px] text-neutral-500 font-normal">
                {MIN_TARGET_CALORIES}–{MAX_TARGET_CALORIES} kcal
              </span>
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => stepCalories(-50)}
                className="rounded-xl border border-neutral-800 bg-neutral-900 p-2.5 text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors duration-150 ease-out"
                aria-label="Decrease by 50 kcal"
              >
                <Minus className="h-4 w-4" />
              </button>
              <div className="relative flex-1">
                <input
                  id="calorie-target-input"
                  type="number"
                  inputMode="numeric"
                  min={MIN_TARGET_CALORIES}
                  max={MAX_TARGET_CALORIES}
                  step={50}
                  value={caloriesInput}
                  onChange={(e) => setCaloriesInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSave();
                  }}
                  className={`${inputClass} text-center text-2xl pr-14`}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-500">
                  kcal
                </span>
              </div>
              <button
                type="button"
                onClick={() => stepCalories(50)}
                className="rounded-xl border border-neutral-800 bg-neutral-900 p-2.5 text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors duration-150 ease-out"
                aria-label="Increase by 50 kcal"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <p className="text-[11px] text-neutral-400">
              Calculated from your profile: <strong className="text-neutral-200 tabular-nums">{calculated.targetCalories} kcal</strong>
              {caloriesValid && difference !== 0 && (
                <span className="tabular-nums">
                  {" "}· yours is {Math.abs(difference)} kcal {difference > 0 ? "higher" : "lower"}
                </span>
              )}
            </p>
          </div>

          {/* Macros */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-neutral-300">Macros</span>
              <button
                type="button"
                onClick={handleToggleManual}
                className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300"
              >
                {manualMacros ? "Balance automatically" : "Set macros myself"}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  ["Protein", "protein", proteinInput, setProteinInput],
                  ["Carbs", "carbs", carbsInput, setCarbsInput],
                  ["Fat", "fat", fatInput, setFatInput],
                ] as const
              ).map(([label, key, value, setValue]) => (
                <div key={key} className="space-y-1">
                  <label htmlFor={`macro-${key}`} className="text-[10px] uppercase font-mono font-bold text-neutral-400 tracking-wider">
                    {label}
                  </label>
                  {manualMacros ? (
                    <input
                      id={`macro-${key}`}
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={1000}
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      className={inputClass}
                    />
                  ) : (
                    <div id={`macro-${key}`} className="rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white font-mono font-bold tabular-nums">
                      {macros[key]}g
                    </div>
                  )}
                </div>
              ))}
            </div>

            {manualMacros ? (
              caloriesValid && Math.abs(macroGap) > 50 ? (
                <p className="flex items-start gap-1.5 text-[11px] text-amber-400">
                  <AlertCircle className="h-3.5 w-3.5 mt-px shrink-0" />
                  <span className="tabular-nums">
                    These macros add up to {macroCalories} kcal, {Math.abs(macroGap)} kcal {macroGap > 0 ? "over" : "under"} your target.
                  </span>
                </p>
              ) : (
                <p className="text-[11px] text-neutral-500 tabular-nums">These macros add up to {macroCalories} kcal.</p>
              )
            ) : (
              <p className="text-[11px] text-neutral-500">
                Protein stays at your bodyweight-based amount, fat is 25% of calories, and carbs fill the rest.
              </p>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <Check className="h-4 w-4" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Footer */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
            {isCustom ? (
              <button
                type="button"
                onClick={handleReset}
                disabled={saving !== null}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-xs font-semibold text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors duration-150 ease-out disabled:opacity-50"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>{saving === "reset" ? "Resetting..." : "Use calculated target"}</span>
              </button>
            ) : (
              <span />
            )}
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={saving !== null}
                className="rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-2.5 text-xs font-semibold text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors duration-150 ease-out"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving !== null}
                className="rounded-xl bg-emerald-500 hover:bg-emerald-400 px-5 py-2.5 text-xs font-semibold text-neutral-950 transition-colors duration-150 ease-out flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                {saving === "save" ? (
                  <>
                    <Clock className="h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Save Target</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
