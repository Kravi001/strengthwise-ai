"use client";

import React, { useState, useEffect } from "react";
import { X, Clock, Check, Sparkles, AlertCircle, RotateCcw } from "lucide-react";
import { formatResetTimeDisplay, parseResetTime } from "@/lib/date";

export interface MealResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentResetTime: string; // e.g. "00:00" or "04:00"
  onSave: (newResetTime: string) => Promise<void> | void;
}

interface PresetOption {
  time: string;
  label: string;
  description: string;
  badge?: string;
}

const PRESETS: PresetOption[] = [
  {
    time: "00:00",
    label: "12:00 AM",
    description: "Standard calendar midnight",
    badge: "Default",
  },
  {
    time: "01:00",
    label: "1:00 AM",
    description: "Light evening eaters & mild night owls",
  },
  {
    time: "02:00",
    label: "2:00 AM",
    description: "Stay up past midnight, finish eating by 2 AM",
  },
  {
    time: "03:00",
    label: "3:00 AM",
    description: "Popular for night owls & evening lifters",
    badge: "Popular",
  },
  {
    time: "04:00",
    label: "4:00 AM",
    description: "Late night workers & sleep past 2 AM",
    badge: "Recommended for night owls",
  },
  {
    time: "05:00",
    label: "5:00 AM",
    description: "Early dawn reset before morning workout",
  },
  {
    time: "06:00",
    label: "6:00 AM",
    description: "Reset upon morning wake up",
  },
];

export function MealResetModal({
  isOpen,
  onClose,
  currentResetTime,
  onSave,
}: MealResetModalProps) {
  const [selectedTime, setSelectedTime] = useState<string>("00:00");
  const [customInput, setCustomInput] = useState<string>("00:00");
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const { hours, minutes } = parseResetTime(currentResetTime);
      const normalized = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
      setSelectedTime(normalized);
      setCustomInput(normalized);
      setSuccessMsg(null);
    }
  }, [isOpen, currentResetTime]);

  // Keyboard navigation & escape listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelectPreset = (time: string) => {
    setSelectedTime(time);
    setCustomInput(time);
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomInput(val);
    if (/^\d{2}:\d{2}$/.test(val)) {
      setSelectedTime(val);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { hours, minutes } = parseResetTime(selectedTime);
      const normalized = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
      await onSave(normalized);
      setSuccessMsg(`Daily reset time updated to ${formatResetTimeDisplay(normalized)}!`);
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      console.error("Failed to save reset time:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleResetToMidnight = () => {
    handleSelectPreset("00:00");
  };

  const formattedDisplay = formatResetTimeDisplay(selectedTime);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-3xl border border-neutral-800 bg-neutral-900/95 p-6 shadow-2xl relative text-left backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="meal-reset-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <h2 id="meal-reset-title" className="text-lg font-bold text-white flex items-center gap-2">
                Daily Meal Log Reset Time
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Choose what time your daily calories and macros roll over to a new day.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-5 space-y-5">
          {/* Active Selection Banner */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                Current Selected Reset Time
              </span>
              <div className="text-2xl font-black text-white font-mono flex items-center gap-2">
                <span className="text-emerald-400">{formattedDisplay}</span>
                <span className="text-xs font-normal text-neutral-500">
                  ({selectedTime})
                </span>
              </div>
            </div>

            {selectedTime !== "00:00" && (
              <button
                type="button"
                onClick={handleResetToMidnight}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-800 bg-neutral-900 text-xs font-semibold text-neutral-300 hover:text-white hover:bg-neutral-800 transition"
                title="Restore default 12:00 AM midnight"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset to 12 AM</span>
              </button>
            )}
          </div>

          {/* Quick Presets */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
              <span>Quick Presets</span>
              <span className="text-[11px] text-neutral-500 font-normal">Tap to select</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESETS.map((preset) => {
                const isSelected = selectedTime === preset.time;
                return (
                  <button
                    key={preset.time}
                    type="button"
                    onClick={() => handleSelectPreset(preset.time)}
                    className={`flex flex-col text-left p-3 rounded-2xl border transition relative ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-500/10 text-white shadow-sm ring-1 ring-emerald-500/50"
                        : "border-neutral-800/80 bg-neutral-950/40 text-neutral-300 hover:border-neutral-700 hover:bg-neutral-800/40"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={`text-sm font-bold font-mono ${isSelected ? "text-emerald-400" : "text-white"}`}>
                        {preset.label}
                      </span>
                      {preset.badge && (
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            isSelected
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "bg-neutral-800 text-neutral-400"
                          }`}
                        >
                          {preset.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-neutral-400 mt-1 line-clamp-1">
                      {preset.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Time Input */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950/40 p-3.5 space-y-2">
            <label className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
              <span>Or Choose Any Custom Time</span>
              <span className="text-[11px] text-neutral-500 font-normal">24h / AM-PM</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="time"
                value={customInput}
                onChange={handleCustomChange}
                className="rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2 text-sm text-white font-mono font-bold focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <span className="text-xs text-neutral-400 font-medium">
                Resets every day at <strong className="text-emerald-400">{formattedDisplay}</strong>
              </span>
            </div>
          </div>

          {/* How It Works Explainer Box */}
          <div className="rounded-2xl border border-emerald-900/30 bg-emerald-950/15 p-3.5 text-xs text-neutral-300 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-emerald-400">
              <Sparkles className="h-4 w-4" />
              <span>How your new reset schedule works:</span>
            </div>
            <p className="text-[11px] leading-relaxed text-neutral-300">
              Your daily meal log will span from <strong>{formattedDisplay}</strong> on one day until{" "}
              <strong>{formattedDisplay}</strong> the next day.
              {selectedTime !== "00:00" && (
                <span className="block mt-1 text-emerald-300/90 font-medium">
                  Any snacks or meals you eat late at night before {formattedDisplay} will stay counted in your previous day&apos;s totals instead of clearing early!
                </span>
              )}
            </p>
          </div>

          {/* Success Message */}
          {successMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <Check className="h-4 w-4" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-xs font-bold text-neutral-300 hover:text-white hover:bg-neutral-800 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl bg-emerald-500 hover:bg-emerald-400 px-5 py-2.5 text-xs font-bold text-neutral-950 transition flex items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Clock className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  <span>Save Reset Time</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
