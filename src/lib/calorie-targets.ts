import type { CalorieTargetValues } from "@/components/calorie-target-modal";

/**
 * Client helpers for the manual calorie target setting, shared by the
 * Meals and Profile pages.
 */

async function postTargets(body: Record<string, unknown>): Promise<CalorieTargetValues> {
  const res = await fetch("/api/profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Could not save your target. Try again.");
  }
  const t = data.targets || body;
  const saved: CalorieTargetValues = {
    targetCalories: t.targetCalories,
    targetProtein: t.targetProtein,
    targetCarbs: t.targetCarbs,
    targetFat: t.targetFat,
  };
  syncLocalTargets(saved);
  return saved;
}

/** Keeps the cached profile in sync so the coach, other pages and other tabs see the new target. */
function syncLocalTargets(t: CalorieTargetValues) {
  try {
    const stored = localStorage.getItem("sw_athlete_profile");
    const existing = stored ? JSON.parse(stored) : {};
    localStorage.setItem(
      "sw_athlete_profile",
      JSON.stringify({
        ...existing,
        ...t,
        targets: { ...(existing.targets || {}), ...t },
        updatedAt: new Date().toISOString(),
      })
    );
    window.dispatchEvent(new Event("sw_profile_updated"));
  } catch {
    // Storage can be unavailable (private mode); the server copy is what matters.
  }
}

/** Saves a manually chosen calorie target and macros. Returns what the server stored. */
export function saveCalorieTargets(values: CalorieTargetValues) {
  return postTargets({ ...values });
}

/** Drops any manual or coach-set target and returns the calculated one. */
export function resetCalorieTargets() {
  return postTargets({ resetTargets: true });
}

/** True when saved targets differ from the ones calculated from the profile. */
export function isCustomTarget(saved: CalorieTargetValues | null, calculated: CalorieTargetValues) {
  if (!saved || !saved.targetCalories) return false;
  return (
    Math.round(saved.targetCalories) !== Math.round(calculated.targetCalories) ||
    Math.round(saved.targetProtein) !== Math.round(calculated.targetProtein) ||
    Math.round(saved.targetCarbs) !== Math.round(calculated.targetCarbs) ||
    Math.round(saved.targetFat) !== Math.round(calculated.targetFat)
  );
}
