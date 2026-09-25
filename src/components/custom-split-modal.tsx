"use client";

import { useState, useEffect } from "react";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Dumbbell,
  Layers,
  Plus,
  Sparkles,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import {
  CustomSplit,
  CustomSplitDay,
  CUSTOM_SPLIT_TEMPLATES,
  DEFAULT_CUSTOM_SPLIT,
  loadCustomSplit,
  saveCustomSplit,
} from "@/lib/custom-split";

interface CustomSplitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSplitSaved: (split: CustomSplit) => void;
  initialSplit?: CustomSplit;
}

export function CustomSplitModal({
  isOpen,
  onClose,
  onSplitSaved,
  initialSplit,
}: CustomSplitModalProps) {
  const [splitName, setSplitName] = useState("Custom Hypertrophy Protocol");
  const [splitDescription, setSplitDescription] = useState(
    "Personalized split tailored to specific weak-points and weekly schedule."
  );
  const [targetSets, setTargetSets] = useState<number>(14);
  const [days, setDays] = useState<CustomSplitDay[]>(DEFAULT_CUSTOM_SPLIT.days);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const active = initialSplit || loadCustomSplit();
      setSplitName(active.name || "Custom Hypertrophy Protocol");
      setSplitDescription(active.description || "");
      setTargetSets(active.targetSets || 14);
      setDays(
        active.days && active.days.length > 0
          ? [...active.days]
          : [...DEFAULT_CUSTOM_SPLIT.days]
      );
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen, initialSplit]);

  const handleAddDay = () => {
    const nextIdx = days.length + 1;
    setDays((prev) => [
      ...prev,
      {
        name: `Day ${nextIdx}: Custom Focus`,
        lifts: "Compound Movement (4×6-8 @ RPE 8), Secondary Movement (3×10), Isolation (3×12)",
        focus: "Target Muscle Group",
        targetRpe: "RPE 8-9",
      },
    ]);
  };

  const handleRemoveDay = (index: number) => {
    if (days.length <= 1) {
      setErrorMsg("A split must contain at least 1 workout day.");
      return;
    }
    setDays((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDayChange = (
    index: number,
    field: keyof CustomSplitDay,
    val: string
  ) => {
    setDays((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: val };
      return updated;
    });
  };

  const handleLoadTemplate = (templateSplit: CustomSplit) => {
    setSplitName(templateSplit.name);
    setSplitDescription(templateSplit.description);
    setTargetSets(templateSplit.targetSets);
    setDays([...templateSplit.days]);
    setSuccessMsg(`Loaded "${templateSplit.name}" template. You can now tweak any exercise!`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!splitName.trim()) {
      setErrorMsg("Please provide a name for your custom split.");
      return;
    }
    if (days.length === 0) {
      setErrorMsg("Please add at least one training day.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const customSplitPayload: CustomSplit = {
      name: splitName.trim(),
      daysCount: days.length,
      frequency: `${days.length} Days / Week`,
      description:
        splitDescription.trim() ||
        `${days.length}-day customized resistance training split.`,
      targetSets: Number(targetSets) || 14,
      days: days.map((d, i) => ({
        name: d.name.trim() || `Day ${i + 1}`,
        lifts: d.lifts.trim() || "Full Body Compound Progression",
        focus: d.focus?.trim() || undefined,
        targetRpe: d.targetRpe?.trim() || "RPE 8",
      })),
    };

    try {
      // 1. Persist locally
      saveCustomSplit(customSplitPayload);

      // 2. Sync to profile state & DB if possible
      try {
        await fetch("/api/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            splitType: "CUSTOM",
            splitDays: customSplitPayload.daysCount,
          }),
        });
      } catch {
        // Silently continue if offline/profile not created
      }

      setSuccessMsg("Custom split saved and activated!");
      setTimeout(() => {
        onSplitSaved(customSplitPayload);
        onClose();
      }, 600);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to save split.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl rounded-3xl border border-neutral-800 bg-neutral-900/95 p-5 sm:p-7 shadow-2xl space-y-6 text-neutral-100 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Custom Split Builder
                </h3>
                <span className="text-[10px] text-cyan-400 font-mono bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded">
                  Personalized Routine
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Design your custom training routine, days per week, and exercise prescriptions.
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

        {/* Template Starter Presets */}
        <div className="space-y-2 rounded-2xl border border-neutral-800/80 bg-neutral-950/60 p-3.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              <span>Seed From Starter Template:</span>
            </label>
            <span className="text-[10px] text-neutral-500">1-click populate &amp; customize</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {CUSTOM_SPLIT_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => handleLoadTemplate(tmpl.split)}
                className="text-xs px-2.5 py-1.5 rounded-xl border border-neutral-800 bg-neutral-900/90 text-neutral-300 hover:border-cyan-500/50 hover:text-cyan-300 transition font-medium flex items-center gap-1.5"
              >
                <span>{tmpl.name}</span>
                <span className="text-[10px] text-neutral-500 font-mono">({tmpl.daysCount}D)</span>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          {/* Split Name & Weekly Sets */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300">
                Custom Split Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. My Arnold Classic Split, Push/Pull Strength..."
                value={splitName}
                onChange={(e) => setSplitName(e.target.value)}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-xs text-white placeholder:text-neutral-600 focus:border-cyan-500 focus:outline-none transition"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300">
                Weekly Target Sets
              </label>
              <input
                type="number"
                min={6}
                max={30}
                value={targetSets}
                onChange={(e) => setTargetSets(Number(e.target.value))}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none transition"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-300">
              Split Description / Philosophy
            </label>
            <input
              type="text"
              placeholder="e.g. Focused on chest/lat hypertrophy with high frequency arm volume."
              value={splitDescription}
              onChange={(e) => setSplitDescription(e.target.value)}
              className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-xs text-neutral-300 placeholder:text-neutral-600 focus:border-cyan-500 focus:outline-none transition"
            />
          </div>

          {/* Training Days List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Routine Workout Days ({days.length} Days / Week)
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddDay}
                className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-bold text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-300 transition"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Day</span>
              </button>
            </div>

            <div className="space-y-3 max-h-[42vh] overflow-y-auto pr-1">
              {days.map((day, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-3.5 sm:p-4 space-y-3 relative group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-[10px] font-mono font-bold bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded">
                        #{idx + 1}
                      </span>
                      <input
                        type="text"
                        required
                        placeholder={`Day ${idx + 1}: Name (e.g. Chest & Biceps)`}
                        value={day.name}
                        onChange={(e) => handleDayChange(idx, "name", e.target.value)}
                        className="flex-1 rounded-lg border border-neutral-800 bg-neutral-900 px-2.5 py-1.5 text-xs font-bold text-emerald-400 placeholder:text-neutral-600 focus:border-cyan-500 focus:outline-none transition"
                      />
                    </div>
                    {days.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveDay(idx)}
                        className="rounded-lg p-1.5 text-neutral-600 hover:text-red-400 hover:bg-neutral-800 transition"
                        title="Remove Day"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 font-mono">
                      Prescribed Exercises &amp; Sets/Reps
                    </label>
                    <textarea
                      rows={2}
                      required
                      placeholder="e.g. Incline DB Bench (4×8-10), Barbell Row (4×8), Lateral Raises (4×15)..."
                      value={day.lifts}
                      onChange={(e) => handleDayChange(idx, "lifts", e.target.value)}
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-2.5 text-xs text-neutral-200 placeholder:text-neutral-600 focus:border-cyan-500 focus:outline-none transition font-mono leading-relaxed"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
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
              <span>{isSubmitting ? "Saving Split..." : "Save & Activate Custom Split"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
