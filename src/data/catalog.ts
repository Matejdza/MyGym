// Generated from the <script data-dc-script> block of design_handoff_liftlog/LiftLog.dc.html.
// Names, copy and how-to steps are verbatim. Do not edit by hand without checking the prototype.
// Exception: the block marked "Added for the owner's training plan" was written by hand.
//
// The prototype's demo numbers (`cur`, `last`, `best`) are not ported: real history replaces them.
// The one thing they encoded is kept as `bodyweight: true` (exercises with `cur: 0`).

import type { Exercise, GoalKey, GroupKey, Routine } from '@/domain/types';

export const EX = {
  bench: {
    id: "bench",
    name: "Bench press",
    group: "chest",
    equipment: "Barbell",
    description: "The main chest builder. It also works the front delts and triceps. Lower the bar under control to the lower chest.",
    steps: [
      "Lie on the bench, feet planted, shoulder blades pulled back and down.",
      "Grip slightly wider than your shoulders. Lower the bar to the lower chest, elbows at about 45°.",
      "Press back up over the shoulders. Keep your hips on the bench.",
    ],
  },
  incline: {
    id: "incline",
    name: "Incline dumbbell press",
    group: "chest",
    equipment: "Dumbbells, incline bench",
    description: "Targets the upper chest. Set the bench between 30 and 45 degrees.",
    steps: [
      "Set the bench to 30–45°, dumbbells over your chest.",
      "Lower the dumbbells out to the sides until you feel a stretch.",
      "Press up and slightly in without clashing the dumbbells.",
    ],
  },
  fly: {
    id: "fly",
    name: "Cable fly",
    group: "chest",
    equipment: "Cable",
    description: "Chest isolation with constant tension through the whole range.",
    steps: [
      "Stand between the cables, one step forward, elbows slightly bent.",
      "Bring your hands together in front of the chest in an arc.",
      "Return slowly to a stretch, keeping the elbow angle fixed.",
    ],
  },
  dips: {
    id: "dips",
    name: "Dips",
    group: "chest",
    equipment: "Parallel bars, added weight",
    description: "Chest and triceps with your own body weight. Leaning forward shifts the work to the chest.",
    steps: [
      "Grip the bars, arms straight, shoulders down.",
      "Lower until your upper arms are parallel to the floor.",
      "Press back up under control.",
    ],
  },
  deadlift: {
    id: "deadlift",
    name: "Deadlift",
    group: "back",
    equipment: "Barbell",
    description: "Works the whole back of the body: back, glutes and hamstrings.",
    steps: [
      "Feet hip-width apart, bar over mid-foot.",
      "Grip the bar, flatten your back and brace before you pull.",
      "Push the floor away and extend your hips. Keep the bar close to your legs.",
    ],
  },
  row: {
    id: "row",
    name: "Barbell row",
    group: "back",
    equipment: "Barbell",
    description: "Builds back thickness. Keep the torso still through the whole set.",
    steps: [
      "Hinge to about 45°, back flat, knees soft.",
      "Pull the bar to your belly button, elbows close to the body.",
      "Lower under control to full arm extension.",
    ],
  },
  pullup: {
    id: "pullup",
    name: "Pull-up",
    group: "back",
    equipment: "Bar, added weight",
    description: "Back width and biceps. Use a band if you cannot finish the set.",
    steps: [
      "Grip the bar overhand, slightly wider than your shoulders.",
      "Pull until your chin clears the bar.",
      "Lower to straight arms without swinging.",
    ],
  },
  lat: {
    id: "lat",
    name: "Lat pulldown",
    group: "back",
    equipment: "Machine",
    description: "A pull-up alternative with adjustable load.",
    steps: [
      "Sit with your thighs under the pad, wide grip.",
      "Pull the bar to your upper chest, shoulder blades down.",
      "Return slowly until your arms are straight.",
    ],
  },
  squat: {
    id: "squat",
    name: "Back squat",
    group: "legs",
    equipment: "Barbell",
    description: "The main leg and core lift. Go as deep as your mobility allows with a flat back.",
    steps: [
      "Bar on the upper back, feet shoulder-width apart.",
      "Sit your hips back and down, knees tracking over the toes.",
      "Drive up through the whole foot, chest up.",
    ],
  },
  rdl: {
    id: "rdl",
    name: "Romanian deadlift",
    group: "legs",
    equipment: "Barbell",
    description: "Hamstrings and glutes. The movement comes from the hips while the knees stay almost still.",
    steps: [
      "Stand holding the bar, knees slightly bent.",
      "Push your hips back as the bar slides down your thighs.",
      "When you feel the hamstring stretch, drive the hips forward to stand up.",
    ],
  },
  press: {
    id: "press",
    name: "Leg press",
    group: "legs",
    equipment: "Machine",
    description: "Quads and glutes without loading the spine.",
    steps: [
      "Feet shoulder-width apart in the middle of the platform.",
      "Lower until your knees reach about 90°.",
      "Press through your heels. Do not lock the knees at the top.",
    ],
  },
  lunge: {
    id: "lunge",
    name: "Dumbbell lunge",
    group: "legs",
    equipment: "Dumbbells",
    description: "Single-leg strength and balance.",
    steps: [
      "Dumbbells at your sides, take a long step forward.",
      "Lower the back knee almost to the floor, torso upright.",
      "Push off the front foot back to the start.",
    ],
  },
  ohp: {
    id: "ohp",
    name: "Overhead press",
    group: "shoulders",
    equipment: "Barbell",
    description: "Shoulders and triceps from a standing position. Brace your torso and do not lean back.",
    steps: [
      "Bar on the upper chest, grip slightly wider than your shoulders.",
      "Press straight up, moving your head back and then through.",
      "Finish with the bar over mid-foot. Lower under control.",
    ],
  },
  lateral: {
    id: "lateral",
    name: "Lateral raise",
    group: "shoulders",
    equipment: "Dumbbells",
    description: "Isolates the side delts. Light weight, clean form.",
    steps: [
      "Dumbbells at your sides, elbows slightly bent.",
      "Raise your arms out to shoulder height.",
      "Lower slower than you lift.",
    ],
  },
  facepull: {
    id: "facepull",
    name: "Face pull",
    group: "shoulders",
    equipment: "Cable, rope",
    description: "Rear delts and upper back. Good for posture.",
    steps: [
      "Set the cable at face height, overhand grip on the rope.",
      "Pull toward your face, hands splitting past your ears.",
      "Hold for a second, then return under control.",
    ],
  },
  curl: {
    id: "curl",
    name: "Barbell curl",
    group: "arms",
    equipment: "Barbell",
    description: "The basic biceps exercise.",
    steps: [
      "Stand tall, underhand grip at shoulder width.",
      "Curl the bar without letting the elbows drift forward.",
      "Lower to full extension without swinging.",
    ],
  },
  hammer: {
    id: "hammer",
    name: "Hammer curl",
    group: "arms",
    equipment: "Dumbbells",
    description: "Biceps and forearms with a neutral grip.",
    steps: [
      "Dumbbells at your sides, palms facing each other.",
      "Curl up, leading with the thumb.",
      "Lower slowly, elbows tucked in.",
    ],
  },
  skull: {
    id: "skull",
    name: "Skull crusher",
    group: "arms",
    equipment: "EZ bar",
    description: "Triceps, especially the long head.",
    steps: [
      "Lie on a bench, bar over your forehead, arms straight.",
      "Bend only at the elbows and lower the bar toward your forehead.",
      "Extend back up. Your upper arms stay still.",
    ],
  },
  pushdown: {
    id: "pushdown",
    name: "Triceps pushdown",
    group: "arms",
    equipment: "Cable",
    description: "Triceps under constant cable tension.",
    steps: [
      "Face the cable, elbows pinned to your sides.",
      "Push the handle down to full extension.",
      "Return to about 90° at the elbow.",
    ],
  },
  legraise: {
    id: "legraise",
    name: "Hanging leg raise",
    group: "core",
    equipment: "Bar",
    bodyweight: true,
    description: "Lower abs and hip flexors.",
    steps: [
      "Hang from the bar, shoulders engaged.",
      "Raise your legs to horizontal or higher without swinging.",
      "Lower slowly to a full hang.",
    ],
  },
  abwheel: {
    id: "abwheel",
    name: "Ab wheel rollout",
    group: "core",
    equipment: "Ab wheel",
    bodyweight: true,
    description: "Full core strength through controlled extension.",
    steps: [
      "Kneel with the wheel under your shoulders.",
      "Roll forward while keeping your back flat.",
      "Pull back by bracing your abs, not your hips.",
    ],
  },
  // ── Added for the owner's training plan (not in the prototype). Photos supplied by the owner. ──
  dbpress: {
    id: "dbpress",
    name: "Seated dumbbell press",
    group: "shoulders",
    equipment: "Dumbbells, bench",
    description: "Shoulders and triceps with the back supported. Each arm works on its own.",
    steps: [
      "Sit on a bench with an upright back, dumbbells at shoulder height, palms forward.",
      "Press the dumbbells up until your arms are almost straight over your head.",
      "Lower under control back to shoulder height.",
    ],
  },
  dbcurl: {
    id: "dbcurl",
    name: "Dumbbell curl",
    group: "arms",
    equipment: "Dumbbells",
    description: "Biceps, one arm at a time or both together. Turn the palm up as you lift.",
    steps: [
      "Stand tall, dumbbells at your sides, elbows close to your body.",
      "Curl the dumbbells up, turning your palms to face your shoulders.",
      "Lower slowly to full extension without swinging.",
    ],
  },
  ohext: {
    id: "ohext",
    name: "Overhead triceps extension",
    group: "arms",
    equipment: "Dumbbell",
    description: "Triceps, especially the long head, with one dumbbell held overhead.",
    steps: [
      "Hold one dumbbell with both hands over your head, arms straight.",
      "Bend at the elbows and lower the dumbbell behind your head. Keep your elbows pointing up.",
      "Extend back up. Your upper arms stay still.",
    ],
  },
  cablerow: {
    id: "cablerow",
    name: "Seated cable row",
    group: "back",
    equipment: "Cable",
    description: "Builds the middle of the back with constant cable tension.",
    steps: [
      "Sit with your feet on the platform, knees soft, back straight.",
      "Pull the handle to your belly, squeezing your shoulder blades together.",
      "Return slowly until your arms are straight. Don't round your back.",
    ],
  },
  bulgarian: {
    id: "bulgarian",
    name: "Bulgarian split squat",
    group: "legs",
    equipment: "Dumbbells, bench",
    description: "Single-leg squat with the back foot on a bench. Quads and glutes, one side at a time.",
    steps: [
      "Stand in front of a bench, dumbbells at your sides, and rest your back foot on it.",
      "Lower until the back knee nearly touches the floor, torso upright.",
      "Drive up through the front foot. Finish all reps, then switch legs.",
    ],
  },
  legcurl: {
    id: "legcurl",
    name: "Leg curl",
    group: "legs",
    equipment: "Machine",
    description: "Isolates the hamstrings on the machine, lying or seated.",
    steps: [
      "Set the pad just above your heels and hold the handles.",
      "Curl your heels toward your glutes without lifting your hips.",
      "Lower slowly to almost straight legs.",
    ],
  },
  calf: {
    id: "calf",
    name: "Calf raise",
    group: "legs",
    equipment: "Machine or dumbbells",
    description: "Calves. Use the full range: a deep stretch at the bottom, a pause at the top.",
    steps: [
      "Stand with the balls of your feet on a step or the machine platform, heels free.",
      "Rise as high as you can onto your toes and pause for a second.",
      "Lower your heels below the step for a full stretch.",
    ],
  },
  plank: {
    id: "plank",
    name: "Plank",
    group: "core",
    equipment: "Body weight",
    bodyweight: true,
    description: "Holds the whole core still. Log the seconds you hold as reps.",
    steps: [
      "Rest on your forearms and toes, elbows under your shoulders.",
      "Keep your body in a straight line from head to heels. Brace your abs.",
      "Hold without letting your hips sag or rise, breathing steadily.",
    ],
  },
  treadmill: {
    id: "treadmill",
    name: "Treadmill run",
    group: "cardio",
    equipment: "Treadmill",
    kind: 'cardio',
    unit: "km",
    step: 0.1,
    description: "Steady running for the heart and lungs. A 1% incline matches running outside.",
    steps: [
      "Start walking, then raise the speed to your target pace.",
      "Run tall with short steps, landing under your hips.",
      "Slow to a walk for the last two minutes to cool down.",
    ],
  },
  bike: {
    id: "bike",
    name: "Stationary bike",
    group: "cardio",
    equipment: "Bike",
    kind: 'cardio',
    unit: "km",
    step: 0.1,
    description: "Low-impact cardio that is easy on the knees. Good after leg day.",
    steps: [
      "Set the seat so the knee stays slightly bent at the bottom.",
      "Hold a steady cadence of 80 to 90 rpm.",
      "Add resistance instead of pedalling faster.",
    ],
  },
  rower: {
    id: "rower",
    name: "Rowing machine",
    group: "cardio",
    equipment: "Rower",
    kind: 'cardio',
    unit: "km",
    step: 0.1,
    description: "Full-body cardio. The power comes from the legs, not the arms.",
    steps: [
      "Strap in, arms straight, shins vertical.",
      "Push with the legs, then lean back and pull the handle to your ribs.",
      "Return arms first, then body, then legs.",
    ],
  },
  stairs: {
    id: "stairs",
    name: "Stair climber",
    group: "cardio",
    equipment: "Machine",
    kind: 'cardio',
    unit: "floors",
    step: 1,
    description: "Hard on the lungs and works the glutes and quads.",
    steps: [
      "Stand tall and hold the rails lightly, not for support.",
      "Take full steps through the whole foot.",
      "Keep a pace you can hold for the full time.",
    ],
  },
  elliptical: {
    id: "elliptical",
    name: "Elliptical",
    group: "cardio",
    equipment: "Machine",
    kind: 'cardio',
    unit: "km",
    step: 0.1,
    description: "Smooth, joint-friendly cardio for longer sessions.",
    steps: [
      "Step on and grip the moving handles.",
      "Push and pull with the arms as the legs drive.",
      "Keep the heels down and the torso upright.",
    ],
  },
} as const satisfies Record<string, Exercise>;

export type ExerciseId = keyof typeof EX;

export const exercise = (id: string): Exercise => (EX as Record<string, Exercise>)[id];

export const EXERCISE_IDS = Object.keys(EX) as ExerciseId[];

/** Strength muscle groups in display order. */
export const GROUPS: { key: GroupKey; label: string }[] = [
  { key: "chest", label: "Chest" },
  { key: "back", label: "Back" },
  { key: "legs", label: "Legs" },
  { key: "shoulders", label: "Shoulders" },
  { key: "arms", label: "Arms" },
  { key: "core", label: "Core" },
];

/** Strength groups plus Cardio. */
export const ALL_GROUPS: { key: GroupKey; label: string }[] = [...GROUPS, { key: 'cardio', label: 'Cardio' }];

/** Heart-rate zone copy. Index 0 is unused. */
export const ZONES = ["","Recovery, very easy","Easy, you can hold a conversation","Steady, short sentences only","Hard, a few words at a time","All out"] as const;

export const GOALS: { key: GoalKey; label: string; description: string; color: string }[] = [
  { key: "muscle", label: "Build muscle", description: "More size, steady weight gain", color: "#ff5a3c" },
  { key: "strength", label: "Get stronger", description: "Heavier lifts on the main exercises", color: "#ffc531" },
  { key: "fat", label: "Lose fat", description: "Keep strength while the scale goes down", color: "#3ddc84" },
];

/** Workouts per week → weekday indexes (0 = Monday). */
export const PATTERNS: Record<number, number[]> = {"2":[0,3],"3":[0,2,4],"4":[0,1,3,4],"5":[0,1,2,4,5],"6":[0,1,2,3,4,5]};

export const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"] as const;
export const DAYS_FULL = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"] as const;
export const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"] as const;

/** Default routines from `routinesDefault()`. Returns a fresh copy each call. */
export function routinesDefault(): Record<string, Routine> {
  return {
    A: {
      name: "Chest & triceps",
      items: [
        { ex: "bench", sets: 4, reps: 6 },
        { ex: "incline", sets: 3, reps: 10 },
        { ex: "fly", sets: 3, reps: 12 },
        { ex: "pushdown", sets: 3, reps: 12 },
      ],
    },
    B: {
      name: "Back & biceps",
      items: [
        { ex: "deadlift", sets: 3, reps: 5 },
        { ex: "row", sets: 4, reps: 8 },
        { ex: "lat", sets: 3, reps: 10 },
        { ex: "curl", sets: 3, reps: 10 },
      ],
    },
    C: {
      name: "Legs",
      items: [
        { ex: "squat", sets: 4, reps: 6 },
        { ex: "rdl", sets: 3, reps: 8 },
        { ex: "press", sets: 3, reps: 12 },
        { ex: "legraise", sets: 3, reps: 12 },
      ],
    },
    D: {
      name: "Shoulders & arms",
      items: [
        { ex: "ohp", sets: 4, reps: 6 },
        { ex: "lateral", sets: 3, reps: 15 },
        { ex: "facepull", sets: 3, reps: 15 },
        { ex: "hammer", sets: 3, reps: 12 },
        { ex: "skull", sets: 3, reps: 10 },
      ],
    },
    E: {
      name: "Cardio",
      type: 'cardio',
      items: [
        { ex: "treadmill", min: 20, zone: 2 },
        { ex: "bike", min: 15, zone: 3 },
        { ex: "rower", min: 10, zone: 4 },
      ],
    },
  };
}
