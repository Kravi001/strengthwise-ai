export interface CustomSplitDay {
  name: string;
  lifts: string;
  focus?: string;
  targetRpe?: string;
}

export interface CustomSplit {
  name: string;
  frequency: string;
  daysCount: number;
  description: string;
  targetSets: number;
  days: CustomSplitDay[];
}

export interface RandomWorkoutTemplate {
  name: string;
  category: "Push" | "Pull" | "Legs" | "Full Body" | "Upper" | "Arms & Delts" | "Conditioning" | "Mobility";
  durationMinutes: number;
  caloriesBurned: number;
  lifts: string;
  notes?: string;
}

export const DEFAULT_CUSTOM_SPLIT: CustomSplit = {
  name: "Custom Hypertrophy Protocol",
  frequency: "4 Days / Week",
  daysCount: 4,
  description: "Personalized split with user-defined movement patterns, exercise selection, and volume targets.",
  targetSets: 14,
  days: [
    {
      name: "Day 1: Chest & Biceps",
      lifts: "Incline DB Press (4×8-10 @ RPE 8), Flat DB Flyes (3×12), Barbell Bicep Curls (4×10), Incline Hammer Curls (3×12)",
      focus: "Anterior Upper Hypertrophy",
      targetRpe: "RPE 8-9",
    },
    {
      name: "Day 2: Back & Triceps",
      lifts: "Chest-Supported T-Bar Row (4×8-10), Neutral Grip Lat Pulldown (3×10), Overhead Cable Tricep Extension (4×12), Tricep Rope Pushdowns (3×15)",
      focus: "Posterior Torso & Extension",
      targetRpe: "RPE 8-9",
    },
    {
      name: "Day 3: Quads, Calves & Abs",
      lifts: "Barbell Back Squat (4×6-8 @ RPE 8), Leg Press (3×12), Seated Leg Extensions (4×12), Standing Calf Raises (4×15), Hanging Leg Raises (3×15)",
      focus: "Knee Dominant & Midsection",
      targetRpe: "RPE 8.5",
    },
    {
      name: "Day 4: Shoulders & Hamstrings",
      lifts: "Standing Overhead Press (4×6-8), Romanian Deadlift (4×8-10 @ RPE 8), Cable Lateral Raises (4×15), Seated Hamstring Curls (4×12), Rear Delt Flyes (3×15)",
      focus: "Deltoids & Hip Hinge",
      targetRpe: "RPE 8-9",
    },
  ],
};

export const CUSTOM_SPLIT_TEMPLATES: { id: string; name: string; daysCount: number; split: CustomSplit }[] = [
  {
    id: "arnold",
    name: "Arnold Golden Era Classic",
    daysCount: 6,
    split: {
      name: "Arnold Golden Era Split",
      frequency: "6 Days / Week",
      daysCount: 6,
      description: "Iconic high-frequency split pairing antagonist muscle groups for maximum pump and metabolic fatigue.",
      targetSets: 16,
      days: [
        { name: "Day 1: Chest & Back (Antagonist)", lifts: "Flat Barbell Bench (4×8), Incline DB Flyes (3×10), Wide-Grip Chins (4×8), Bent-Over Barbell Row (4×8)" },
        { name: "Day 2: Shoulders & Arms", lifts: "Barbell Overhead Press (4×8), DB Lateral Raises (4×15), Barbell Curls (4×10), Skull Crushers (4×10)" },
        { name: "Day 3: Legs & Lower Back", lifts: "Barbell Squats (4×8 @ RPE 8), Romanian Deadlifts (4×8), Leg Press (3×12), Standing Calf Raises (5×15)" },
        { name: "Day 4: Chest & Back Hypertrophy", lifts: "Incline DB Press (4×10), Cable Crossover (3×12), Chest-Supported Row (4×10), Lat Pulldown (3×10)" },
        { name: "Day 5: Shoulders & Arms Hypertrophy", lifts: "Seated DB Press (4×10), Cable Lateral Raises (4×15), Preacher Curls (3×12), Tricep Rope Pushdowns (4×15)" },
        { name: "Day 6: Legs & Core", lifts: "Front Squats (4×8), Lying Leg Curls (4×10), Walking Lunges (3×12/leg), Hanging Leg Raises (4×15)" },
      ],
    },
  },
  {
    id: "push_pull",
    name: "Push / Pull Heavy & Light",
    daysCount: 4,
    split: {
      name: "Push / Pull 4-Day Protocol",
      frequency: "4 Days / Week",
      daysCount: 4,
      description: "Combines upper push with knee extension, and upper pull with posterior chain hip hinges.",
      targetSets: 14,
      days: [
        { name: "Push A (Strength)", lifts: "Barbell Bench Press (4×5 @ RPE 8.5), Barbell Back Squat (4×6), Overhead Press (3×8), Tricep Dips (3×10)" },
        { name: "Pull A (Strength)", lifts: "Conventional Deadlift (3×5 @ RPE 8), Weighted Pull-ups (4×6), Barbell Row (3×8), Incline DB Curls (3×10)" },
        { name: "Push B (Hypertrophy)", lifts: "Incline DB Bench (3×10), Leg Press (3×12), Cable Lateral Raises (4×15), Tricep Pushdowns (3×12)" },
        { name: "Pull B (Hypertrophy)", lifts: "Romanian Deadlift (3×10), Neutral Lat Pulldown (3×10), Cable Face Pulls (4×15), Hammer Curls (3×12)" },
      ],
    },
  },
  {
    id: "upper_lower_arms",
    name: "Upper / Lower + Arms Weak-Point",
    daysCount: 5,
    split: {
      name: "Upper / Lower + Arms Specialization",
      frequency: "5 Days / Week",
      daysCount: 5,
      description: "Standard balanced upper/lower programming with a dedicated 5th day to target arms and deltoids.",
      targetSets: 15,
      days: [
        { name: "Upper Heavy", lifts: "Barbell Bench Press (4×6), Barbell Row (4×6), Overhead Press (3×8), Neutral Lat Pulldown (3×8)" },
        { name: "Lower Heavy", lifts: "Barbell Squat (4×6 @ RPE 8), Romanian Deadlift (3×8), Bulgarian Split Squat (3×8/leg), Calf Raises (4×15)" },
        { name: "Arms & Deltoids Blitz", lifts: "EZ-Bar Bicep Curls (4×10), Close-Grip Bench (4×8), DB Lateral Raises (5×15), Hammer Curls (3×12), Overhead Tricep Ext (3×12)" },
        { name: "Upper Hypertrophy", lifts: "Incline DB Press (4×10), Chest-Supported Row (4×10), Cable Flyes (3×12), Face Pulls (4×15)" },
        { name: "Lower Hypertrophy", lifts: "Hack Squat (3×10), Lying Leg Curls (4×12), Leg Extensions (3×15), Seated Calf Raise (4×15)" },
      ],
    },
  },
  {
    id: "minimalist_2day",
    name: "Minimalist 2-Day Power Split",
    daysCount: 2,
    split: {
      name: "Minimalist 2-Day Heavy Split",
      frequency: "2 Days / Week",
      daysCount: 2,
      description: "High-density full body sessions designed for extreme time efficiency without sacrificing strength gains.",
      targetSets: 12,
      days: [
        { name: "Day 1: Squat & Upper Push/Pull", lifts: "Back Squat (4×6 @ RPE 8), Flat Barbell Bench (4×6), Barbell Row (4×6), Overhead Press (3×8)" },
        { name: "Day 2: Deadlift & Upper Push/Pull", lifts: "Trap Bar Deadlift (3×5 @ RPE 8.5), Weighted Pull-ups (4×6), Incline DB Bench (3×10), DB Lateral Raises (4×15)" },
      ],
    },
  },
];

export const RANDOM_WORKOUTS: RandomWorkoutTemplate[] = [
  {
    name: "High-Volume Delts & Arms Gunsmith",
    category: "Arms & Delts",
    durationMinutes: 45,
    caloriesBurned: 340,
    lifts: "Standing Overhead DB Press (4×8-10)\nCable Lateral Raises (4×15)\nEZ-Bar Bicep Curls (4×10)\nClose-Grip Bench Press (4×8)\nIncline DB Hammer Curls (3×12)\nRope Tricep Pushdowns (4×15)\nFace Pulls (3×15)",
    notes: "Peak contraction focus with 60s rest intervals. Supersets on biceps/triceps.",
  },
  {
    name: "Chest & Triceps Hypertrophy Blitz",
    category: "Push",
    durationMinutes: 50,
    caloriesBurned: 390,
    lifts: "Incline Barbell Bench (4×8 @ RPE 8)\nFlat DB Flyes (3×10)\nMachine Chest Press (3×12)\nWeighted Dips (3×8-10)\nOverhead Cable Tricep Extension (4×12)\nSingle-Arm Tricep Pushdowns (3×15)",
    notes: "Emphasize clavicular pec stretch on incline movements.",
  },
  {
    name: "Back Thickness & Lat Width Annihilation",
    category: "Pull",
    durationMinutes: 55,
    caloriesBurned: 430,
    lifts: "Barbell Deadlift (3×5 @ RPE 8)\nChest-Supported T-Bar Row (4×8)\nWide Neutral Lat Pulldown (3×10)\nSingle-Arm DB Row (3×10/side)\nIncline Dumbbell Curls (3×12)\nCable Straight-Arm Lat Pulldown (3×15)",
    notes: "2-second isometric squeeze at full contraction for mid-back thickness.",
  },
  {
    name: "Posterior Chain & Quad Annihilation",
    category: "Legs",
    durationMinutes: 60,
    caloriesBurned: 490,
    lifts: "Barbell Back Squat (4×6-8 @ RPE 8)\nRomanian Deadlift (4×8-10)\nLeg Press (3×12)\nLying Hamstring Curls (4×12)\nWalking DB Lunges (3×12/leg)\nStanding Calf Raises (4×15)",
    notes: "Clinical MET 6.5 leg session with heavy multi-joint mechanical tension.",
  },
  {
    name: "Functional Full-Body Conditioning & Core",
    category: "Full Body",
    durationMinutes: 45,
    caloriesBurned: 410,
    lifts: "Trap Bar Deadlift (4×6)\nPush Press (4×6)\nGoblet Squats (3×12)\nPull-ups (4×8)\nKettlebell Swings (4×20)\nHanging Leg Raises (4×15)\nAb Wheel Rollout (3×12)",
    notes: "Athletic multi-planar power and trunk stabilization.",
  },
  {
    name: "Upper Body Power & Speed Circuit",
    category: "Upper",
    durationMinutes: 50,
    caloriesBurned: 380,
    lifts: "Explosive Flat Bench Press (5×3 @ 75% 1RM)\nWeighted Neutral Pull-ups (4×5)\nSeated DB Shoulder Press (3×8)\nCable Row with Pause (3×10)\nDB Lateral Raises (4×15)\nBarbell Spider Curls (3×12)",
    notes: "Rate of force development (RFD) emphasis on opening sets.",
  },
  {
    name: "HIIT, Calisthenics & Core Burnout",
    category: "Conditioning",
    durationMinutes: 35,
    caloriesBurned: 360,
    lifts: "Bodyweight Push-ups (4×20)\nPull-ups / Chin-ups (4×8-10)\nJump Squats (4×15)\nDumbbell Renegade Rows (3×10/side)\nMountain Climbers (4×30s)\nPlank to Push-up (3×12)\nHollow Body Hold (3×45s)",
    notes: "Minimal rest, metabolic density circuit for cardiovascular and core endurance.",
  },
  {
    name: "Active Recovery, Hips & Mobility Flow",
    category: "Mobility",
    durationMinutes: 30,
    caloriesBurned: 180,
    lifts: "Thoracic Spine Foam Rolling (5 mins)\n90/90 Hip Mobility Rotations (3×10/side)\nWorld's Greatest Stretch (3×5/side)\nBand Pull-Aparts (4×20)\nKettlebell Goblet Squat Holds (3×45s)\nSuitcase Carries (3×40m/side)",
    notes: "Joint decompression, synovial fluid circulation, and parasympathetic nervous system recovery.",
  },
];

export function getRandomWorkout(): RandomWorkoutTemplate {
  const index = Math.floor(Math.random() * RANDOM_WORKOUTS.length);
  return RANDOM_WORKOUTS[index];
}

const STORAGE_KEY = "sw_custom_split";

export function loadCustomSplit(): CustomSplit {
  if (typeof window === "undefined") return DEFAULT_CUSTOM_SPLIT;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CUSTOM_SPLIT;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.days) && parsed.days.length > 0) {
      return {
        name: parsed.name || DEFAULT_CUSTOM_SPLIT.name,
        frequency: parsed.frequency || `${parsed.days.length} Days / Week`,
        daysCount: parsed.daysCount || parsed.days.length,
        description: parsed.description || DEFAULT_CUSTOM_SPLIT.description,
        targetSets: parsed.targetSets || 14,
        days: parsed.days,
      };
    }
  } catch (err) {
    console.warn("Failed to load custom split from localStorage:", err);
  }
  return DEFAULT_CUSTOM_SPLIT;
}

export function saveCustomSplit(split: CustomSplit): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(split));
  } catch (err) {
    console.warn("Failed to save custom split to localStorage:", err);
  }
}
