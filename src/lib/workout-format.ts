/**
 * Workouts are stored as plain text in `WorkoutLog.notes`, one exercise per line:
 *   "Bench Press: 225 lb × 5, 225 lb × 5, 205 lb × 8"
 *   "Pull-ups: × 10, × 8"            (no weight = bodyweight)
 * These helpers turn the builder's structured exercises into that text and back,
 * so a past workout can be repeated.
 */

export interface WorkoutSet {
  weight: string; // lb; empty for bodyweight
  reps: string;
}

export interface WorkoutExercise {
  name: string;
  sets: WorkoutSet[];
}

export function formatExercises(exercises: WorkoutExercise[]): string {
  return exercises
    .filter((ex) => ex.name.trim())
    .map((ex) => {
      const sets = ex.sets
        .filter((s) => s.reps.trim() || s.weight.trim())
        .map((s) => `${s.weight.trim() ? `${s.weight.trim()} lb ` : ""}× ${s.reps.trim() || "0"}`);
      return sets.length ? `${ex.name.trim()}: ${sets.join(", ")}` : ex.name.trim();
    })
    .join("\n");
}

const SET_PATTERN = /^(?:(\d+(?:\.\d+)?)\s*lbs?\s*)?×\s*(\d+)$/i;

/** Best-effort parse of saved notes. Lines that don't match keep their name with one empty set. */
export function parseExercises(notes: string | null | undefined): WorkoutExercise[] {
  if (!notes) return [];
  return notes
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const colon = line.indexOf(":");
      const name = (colon === -1 ? line : line.slice(0, colon)).trim();
      const rest = colon === -1 ? "" : line.slice(colon + 1);
      const sets: WorkoutSet[] = [];
      for (const raw of rest.split(",")) {
        const part = raw.replace(/@.*$/, "").trim(); // drop "@ RPE 8" style notes
        const m = part.match(SET_PATTERN);
        if (m) {
          sets.push({ weight: m[1] ?? "", reps: m[2] });
        } else if (/^\d+$/.test(part) && sets.length) {
          // Shorthand like "225 lb × 5, 5, 5": a bare number repeats the previous weight.
          sets.push({ weight: sets[sets.length - 1].weight, reps: part });
        }
      }
      return { name, sets: sets.length ? sets : [{ weight: "", reps: "" }] };
    });
}
