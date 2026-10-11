"use client";

import React, { useState, useEffect } from "react";
import { X, Flame, Scale, Check, Trash2 } from "lucide-react";

export interface LoggedMealItem {
  id: string;
  name: string;
  mealType: "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK" | string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  serving?: string | null;
  loggedAt?: string | Date;
}

interface EditMealModalProps {
  meal: LoggedMealItem | null;
  isOpen: boolean;
  onClose: () => void;
  onMealUpdated: () => void;
  onMealDeleted?: (id: string) => void;
}

export function EditMealModal({
  meal,
  isOpen,
  onClose,
  onMealUpdated,
  onMealDeleted,
}: EditMealModalProps) {
  const [name, setName] = useState("");
  const [mealType, setMealType] = useState<"BREAKFAST" | "LUNCH" | "DINNER" | "SNACK">("LUNCH");
  const [quantity, setQuantity] = useState<number>(1);
  const [servingDescription, setServingDescription] = useState("");
  const [calories, setCalories] = useState<number>(0);
  const [protein, setProtein] = useState<number>(0);
  const [carbs, setCarbs] = useState<number>(0);
  const [fat, setFat] = useState<number>(0);
  const [fiber, setFiber] = useState<number>(0);

  // Baseline single-unit values for proportional scaling
  const [baseCalories, setBaseCalories] = useState<number>(0);
  const [baseProtein, setBaseProtein] = useState<number>(0);
  const [baseCarbs, setBaseCarbs] = useState<number>(0);
  const [baseFat, setBaseFat] = useState<number>(0);
  const [baseFiber, setBaseFiber] = useState<number>(0);
  const [scaleWithQuantity, setScaleWithQuantity] = useState<boolean>(true);

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Populate state whenever a meal is opened for editing
  useEffect(() => {
    if (meal) {
      setName(meal.name || "");
      const validMealType = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"].includes(meal.mealType)
        ? (meal.mealType as "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK")
        : "LUNCH";
      setMealType(validMealType);

      // Attempt to extract existing quantity multiplier from serving text (e.g. "2 servings", "1.5x")
      let initialQty = 1;
      let initialServingDesc = meal.serving || "1 serving";
      const match = meal.serving?.match(/^([\d.]+)\s*(?:x|\s*servings?|\s*serving)?\b/i);
      if (match && !isNaN(Number(match[1])) && Number(match[1]) > 0) {
        initialQty = Number(match[1]);
      }

      setQuantity(initialQty);
      setServingDescription(initialServingDesc);

      const c = meal.calories || 0;
      const p = meal.protein || 0;
      const cb = meal.carbs || 0;
      const f = meal.fat || 0;
      const fb = meal.fiber || 0;

      setCalories(c);
      setProtein(p);
      setCarbs(cb);
      setFat(f);
      setFiber(fb);

      // Set base per-unit values
      setBaseCalories(Math.round(c / (initialQty || 1)));
      setBaseProtein(Math.round((p / (initialQty || 1)) * 10) / 10);
      setBaseCarbs(Math.round((cb / (initialQty || 1)) * 10) / 10);
      setBaseFat(Math.round((f / (initialQty || 1)) * 10) / 10);
      setBaseFiber(Math.round((fb / (initialQty || 1)) * 10) / 10);

      setScaleWithQuantity(true);
      setErrorMessage(null);
    }
  }, [meal]);

  if (!isOpen || !meal) return null;

  // Handle quantity changes with optional proportional macro scaling
  const handleQuantityChange = (newQty: number) => {
    const validQty = Math.max(0.1, Math.round(newQty * 100) / 100);
    setQuantity(validQty);

    if (scaleWithQuantity && baseCalories > 0) {
      setCalories(Math.round(baseCalories * validQty));
      setProtein(Math.round(baseProtein * validQty * 10) / 10);
      setCarbs(Math.round(baseCarbs * validQty * 10) / 10);
      setFat(Math.round(baseFat * validQty * 10) / 10);
      setFiber(Math.round(baseFiber * validQty * 10) / 10);

      // Update serving description to reflect new quantity
      setServingDescription(`${validQty} serving${validQty === 1 ? "" : "s"}`);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage("Please enter a food name.");
      return;
    }
    if (calories < 0 || isNaN(calories)) {
      setErrorMessage("Please enter a valid calorie amount.");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/meals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: meal.id,
          name: name.trim(),
          mealType,
          calories: Math.round(Number(calories)),
          protein: Math.round(Number(protein || 0) * 10) / 10,
          carbs: Math.round(Number(carbs || 0) * 10) / 10,
          fat: Math.round(Number(fat || 0) * 10) / 10,
          fiber: Math.round(Number(fiber || 0) * 10) / 10,
          serving: servingDescription.trim() || `${quantity} serving${quantity === 1 ? "" : "s"}`,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update meal log.");
      }

      onMealUpdated();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update meal log.";
      setErrorMessage(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${meal.name}"?`)) return;
    setIsDeleting(true);
    try {
      await fetch(`/api/meals?id=${meal.id}`, { method: "DELETE" });
      if (onMealDeleted) {
        onMealDeleted(meal.id);
      } else {
        onMealUpdated();
      }
      onClose();
    } catch (err) {
      console.warn("Failed to delete meal:", err);
      setErrorMessage("Failed to delete meal entry.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-3xl border border-neutral-800 bg-neutral-950 p-5 sm:p-7 space-y-6 shadow-2xl my-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white">Edit Logged Meal</h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Adjust quantity, meal category, or nutrition macros
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-neutral-400 hover:text-white hover:bg-neutral-900 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5">
          {/* Food Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-300">Food Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Grilled Chicken Breast"
              className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2.5 text-xs text-white font-medium focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* Meal Category Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-300">Meal Category</label>
            <div className="grid grid-cols-4 gap-2">
              {(
                [
                  { type: "BREAKFAST" as const, label: "Breakfast", icon: "🍳" },
                  { type: "LUNCH" as const, label: "Lunch", icon: "🥗" },
                  { type: "DINNER" as const, label: "Dinner", icon: "🥩" },
                  { type: "SNACK" as const, label: "Snack", icon: "🍎" },
                ]
              ).map((cat) => (
                <button
                  key={cat.type}
                  type="button"
                  onClick={() => setMealType(cat.type)}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition border ${
                    mealType === cat.type
                      ? "border-cyan-500 bg-cyan-500/20 text-cyan-300"
                      : "border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white"
                  }`}
                >
                  <span className="text-xs">{cat.icon}</span>
                  <span className="truncate">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quantity & Servings Section */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Scale className="h-4 w-4 text-cyan-400" />
                <span>Quantity / Servings</span>
              </span>
              <label className="flex items-center gap-1.5 text-[11px] text-neutral-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={scaleWithQuantity}
                  onChange={(e) => setScaleWithQuantity(e.target.checked)}
                  className="rounded border-neutral-700 bg-neutral-950 text-cyan-500 focus:ring-0"
                />
                <span>Auto-scale macros</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Quantity Number & Multipliers */}
              <div className="space-y-1.5">
                <label className="text-[11px] text-neutral-400">Number of Servings</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0.1}
                    step={0.1}
                    value={quantity}
                    onChange={(e) => handleQuantityChange(Number(e.target.value))}
                    className="w-20 rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs text-white font-mono text-center focus:border-cyan-500 focus:outline-none font-bold"
                  />
                  <div className="flex items-center gap-1">
                    {[0.5, 1, 1.5, 2, 3].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => handleQuantityChange(m)}
                        className={`px-2 py-1.5 rounded-lg text-[10px] font-mono transition border ${
                          quantity === m
                            ? "border-cyan-500 bg-cyan-500/20 text-cyan-300 font-bold"
                            : "border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white"
                        }`}
                      >
                        {m}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Serving Unit Label */}
              <div className="space-y-1.5">
                <label className="text-[11px] text-neutral-400">Portion Description</label>
                <input
                  type="text"
                  value={servingDescription}
                  onChange={(e) => setServingDescription(e.target.value)}
                  placeholder="e.g. 2 servings, 200g, 1 plate"
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs text-white placeholder:text-neutral-600 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Macros Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-neutral-300">Nutritional Intake Breakdown</span>
              <span className="text-[10px] text-neutral-500 font-mono">
                {scaleWithQuantity ? "Scaled with quantity" : "Manual values"}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {/* Calories */}
              <div className="space-y-1 rounded-xl border border-neutral-800 bg-neutral-900/80 p-2.5">
                <label className="text-[10px] font-bold text-neutral-400 flex items-center gap-1">
                  <Flame className="h-3 w-3 text-emerald-400" />
                  <span>Calories</span>
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={calories}
                  onChange={(e) => setCalories(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-transparent text-sm font-mono font-bold text-emerald-400 focus:outline-none"
                />
                <span className="text-[9px] text-neutral-500 font-mono">kcal</span>
              </div>

              {/* Protein */}
              <div className="space-y-1 rounded-xl border border-neutral-800 bg-neutral-900/80 p-2.5">
                <label className="text-[10px] font-bold text-cyan-400">Protein</label>
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  value={protein}
                  onChange={(e) => setProtein(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-transparent text-sm font-mono font-bold text-white focus:outline-none"
                />
                <span className="text-[9px] text-neutral-500 font-mono">grams</span>
              </div>

              {/* Carbs */}
              <div className="space-y-1 rounded-xl border border-neutral-800 bg-neutral-900/80 p-2.5">
                <label className="text-[10px] font-bold text-pink-400">Carbs</label>
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  value={carbs}
                  onChange={(e) => setCarbs(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-transparent text-sm font-mono font-bold text-white focus:outline-none"
                />
                <span className="text-[9px] text-neutral-500 font-mono">grams</span>
              </div>

              {/* Fat */}
              <div className="space-y-1 rounded-xl border border-neutral-800 bg-neutral-900/80 p-2.5">
                <label className="text-[10px] font-bold text-amber-400">Fat</label>
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  value={fat}
                  onChange={(e) => setFat(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-transparent text-sm font-mono font-bold text-white focus:outline-none"
                />
                <span className="text-[9px] text-neutral-500 font-mono">grams</span>
              </div>

              {/* Fiber */}
              <div className="space-y-1 rounded-xl border border-neutral-800 bg-neutral-900/80 p-2.5">
                <label className="text-[10px] font-bold text-purple-400">Fiber</label>
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  value={fiber}
                  onChange={(e) => setFiber(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-transparent text-sm font-mono font-bold text-white focus:outline-none"
                />
                <span className="text-[9px] text-neutral-500 font-mono">grams</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-neutral-800 gap-3">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting || isSaving}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-red-400 hover:bg-red-500/10 border border-neutral-800 hover:border-red-500/30 transition disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete Entry</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="px-4 py-2 rounded-xl border border-neutral-800 bg-neutral-900 text-xs font-semibold text-neutral-300 hover:text-white hover:bg-neutral-800 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 text-xs font-bold text-neutral-950 shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-cyan-300 transition active:scale-[0.98] disabled:opacity-50"
              >
                <Check className="h-3.5 w-3.5" />
                <span>{isSaving ? "Saving..." : "Save Changes"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
