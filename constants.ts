import { WorkoutPlan, WorkoutType } from './types';

const SHARED_WARMUP_A = [
  "Arm Circles: 1 min",
  "Deep Bodyweight Squats: 2 sets x 10-15 reps"
];

const SHARED_COOLDOWN_A = [
  "Doorway Chest Stretch (30s/side)",
  "Standing Quad Stretch (30s/side)",
  "Bicep Wall Stretch"
];

const SHARED_WARMUP_B = [
  "Cat-Cow Stretches: 1 min",
  "Light Overhead Press: 2 sets"
];

const SHARED_COOLDOWN_B = [
  "Dead Hang / Child's Pose",
  "Hamstring Stretch (30s/leg)",
  "Overhead Tricep Stretch"
];

// --- ADVANCED (MALE / EXPERIENCED) PLANS ---

export const PLAN_ADVANCED_A: WorkoutPlan = {
  id: WorkoutType.A,
  title: "Chest, Quads, & Shortened Arms",
  focus: "Pushing Strength, Quad Power, Bicep Peak",
  warmup: [...SHARED_WARMUP_A, "Band Pull-Aparts: 2x15"],
  exercises: [
    {
      name: "Bench Press (Dumbbell)",
      defaultSets: 3,
      defaultReps: "6-8",
      notes: "Primary Chest Builder",
      restSeconds: 180,
      cues: [
        "Keep feet flat on the floor for stability.",
        "Retract shoulder blades and keep them pinned to the bench.",
        "Lower the dumbbells slowly to chest level.",
        "Press up explosively, converging the weights at the top without touching."
      ],
      image: "/assets/exercises/bench_press_composite.webp"
    },
    {
      name: "Bench Pistol Squat",
      defaultSets: 3,
      defaultReps: "8-10/leg",
      notes: "Unilateral stability",
      restSeconds: 120,
      cues: [
        "Stand on one leg, extending the other forward.",
        "Lower your hips back and down towards the bench.",
        "Keep your chest up and back straight.",
        "Touch the bench lightly and drive back up through the heel."
      ],
      image: "/assets/exercises/bench_pistol_squat_composite.webp"
    },
    {
      name: "Bent-Over Row (Dumbbell)",
      defaultSets: 3,
      defaultReps: "8-10",
      notes: "Back thickness",
      restSeconds: 120,
      cues: [
        "Hinge at the hips, keeping your back flat.",
        "Pull the dumbbells towards your hips, squeezing your shoulder blades.",
        "Keep your elbows close to your body.",
        "Lower the weights with control."
      ],
      image: "/assets/exercises/bent_over_row_composite.webp"
    },
    {
      name: "Triceps Dip (Assisted)",
      defaultSets: 3,
      defaultReps: "8-12",
      notes: "Upright torso",
      isSuperset: true,
      supersetGroup: 1,
      restSeconds: 90,
      cues: [
        "Keep your torso upright to target the triceps.",
        "Lower yourself until your elbows are at a 90-degree angle.",
        "Keep elbows tucked in, not flaring out.",
        "Push back up to the starting position."
      ],
      image: "/assets/exercises/triceps_dip_composite.webp"
    },
    {
      name: "Preacher Curl",
      defaultSets: 3,
      defaultReps: "10-12",
      notes: "No cheating reps",
      isSuperset: true,
      supersetGroup: 1,
      restSeconds: 90,
      cues: [
        "Sit comfortably with your armpits over the pad.",
        "Extend your arms fully at the bottom.",
        "Curl the weight up, squeezing the biceps at the top.",
        "Avoid lifting your elbows off the pad."
      ],
      image: "/assets/exercises/preacher_curl_composite.webp"
    },
    {
      name: "Lateral Raise",
      defaultSets: 3,
      defaultReps: "12-15",
      notes: "Strict form",
      isSuperset: true,
      supersetGroup: 2,
      restSeconds: 60,
      cues: [
        "Stand with a slight lean forward.",
        "Raise the dumbbells to the side until arm parallel to floor.",
        "Lead with your elbows, keeping a slight bend.",
        "Lower slowly and avoid swinging."
      ],
      image: "/assets/exercises/lateral_raise_composite.webp"
    },
    {
      name: "Russian Twist",
      defaultSets: 3,
      defaultReps: "20",
      notes: "Core finisher",
      isSuperset: true,
      supersetGroup: 2,
      restSeconds: 60,
      cues: [
        "Sit on the floor, leaning back slightly with knees bent.",
        "Hold a weight with both hands.",
        "Twist your torso to the right, then to the left.",
        "Keep your core engaged throughout."
      ],
      image: "/assets/exercises/russian_twist_composite.webp"
    },
  ],
  cooldown: SHARED_COOLDOWN_A
};

export const PLAN_ADVANCED_B: WorkoutPlan = {
  id: WorkoutType.B,
  title: "Posterior Chain, Vertical Push/Pull",
  focus: "Back Width, Hamstrings, Overhead Strength",
  warmup: [...SHARED_WARMUP_B, "Inchworms: 1 min", "Leg Swings: 1 min"],
  exercises: [
    {
      name: "Pull Up / Lat Pulldown",
      defaultSets: 3,
      defaultReps: "8-10",
      notes: "Width builder",
      restSeconds: 120,
      cues: [
        "Grip the bar slightly wider than shoulder-width.",
        "Pull your chest up to the bar, driving elbows down.",
        "Squeeze your lats at the bottom of the movement.",
        "Lower yourself slowly to a full hang."
      ],
      image: "/assets/exercises/pull_up_composite.webp"
    },
    {
      name: "Romanian Deadlift (RDL)",
      defaultSets: 3,
      defaultReps: "8-10",
      notes: "Slow eccentric",
      restSeconds: 120,
      cues: [
        "Stand with feet hip-width apart, holding the bar/dumbbells.",
        "Hinge at the hips, pushing your butt back.",
        "Keep a slight bend in the knees but do not squat.",
        "Lower until you feel a stretch in your hamstrings, then drive hips forward."
      ],
      image: "/assets/exercises/rdl_composite.webp"
    },
    {
      name: "Overhead Press (Dumbbell)",
      defaultSets: 3,
      defaultReps: "6-8",
      notes: "Shoulder mass",
      restSeconds: 120,
      cues: [
        "Stand or sit with core engaged.",
        "Press the dumbbells straight up overhead.",
        "Avoid arching your lower back.",
        "Lower the weights with control to ear level."
      ],
      image: "/assets/exercises/overhead_press_composite.webp"
    },
    {
      name: "Leg Extension",
      defaultSets: 3,
      defaultReps: "12-15",
      notes: "Isolation",
      isSuperset: true,
      supersetGroup: 1,
      restSeconds: 90,
      cues: [
        "Sit with your back flat against the pad.",
        "Extend your legs until they are straight.",
        "Squeeze your quads at the top.",
        "Lower the weight slowly."
      ],
      image: "/assets/exercises/leg_extension_composite.webp"
    },
    {
      name: "Lying Leg Curl",
      defaultSets: 3,
      defaultReps: "10-12",
      notes: "Isolation",
      isSuperset: true,
      supersetGroup: 1,
      restSeconds: 90,
      cues: [
        "Lie face down on the machine.",
        "Curl your legs up towards your glutes.",
        "Squeeze your hamstrings at the top.",
        "Lower the weight with control."
      ],
      image: "/assets/exercises/lying_leg_curl_composite.webp"
    },
    {
      name: "Overhead Triceps Extension",
      defaultSets: 3,
      defaultReps: "10-12",
      notes: "Long head target",
      isSuperset: true,
      supersetGroup: 2,
      restSeconds: 90,
      cues: [
        "Hold the weight overhead with both hands.",
        "Lower the weight behind your head by bending elbows.",
        "Keep elbows close to your head.",
        "Extend arms back to the starting position."
      ],
      image: "/assets/exercises/overhead_triceps_extension_composite.webp"
    },
    {
      name: "Crossbody Hammer Curl",
      defaultSets: 3,
      defaultReps: "10-12",
      notes: "Brachialis target",
      isSuperset: true,
      supersetGroup: 2,
      restSeconds: 90,
      cues: [
        "Stand holding dumbbells at your sides.",
        "Curl one dumbbell across your body towards the opposite shoulder.",
        "Keep your palm facing your body (neutral grip).",
        "Lower slowly and repeat on the other side."
      ],
      image: "/assets/exercises/crossbody_hammer_curl_composite.webp"
    },
    {
      name: "Knee Raise",
      defaultSets: 3,
      defaultReps: "12-15",
      notes: "Core",
      restSeconds: 60,
      cues: [
        "Hang from a bar or use a captain's chair.",
        "Raise your knees towards your chest.",
        "Engage your core and avoid swinging.",
        "Lower legs slowly."
      ],
      image: "/assets/exercises/knee_raise_composite.webp"
    },
  ],
  cooldown: SHARED_COOLDOWN_B
};

// --- BEGINNER (FEMALE / STARTING) PLANS ---

export const PLAN_BEGINNER_A: WorkoutPlan = {
  id: WorkoutType.A,
  title: "Chest, Quads, & Shortened Arms (Mod)",
  focus: "Strength & Toning",
  warmup: [...SHARED_WARMUP_A, "Wall Pushups: 2x10"],
  exercises: [
    {
      name: "Bench Press (Dumbbell)",
      defaultSets: 3,
      defaultReps: "8-10",
      notes: "Slow lower (2s)",
      restSeconds: 120,
      cues: [
        "Keep feet flat on the floor for stability.",
        "Retract shoulder blades and keep them pinned to the bench.",
        "Lower the dumbbells slowly to chest level.",
        "Press up explosively, converging the weights at the top without touching."
      ],
      image: "/assets/exercises/bench_press_composite.webp"
    },
    {
      name: "Goblet Squat",
      defaultSets: 3,
      defaultReps: "10-12",
      notes: "Deep squats, posture fix",
      restSeconds: 120,
      cues: [
        "Hold the weight close to your chest with both hands.",
        "Stand with feet slightly wider than hip-width.",
        "Lower your hips back and down, keeping chest up.",
        "Drive through your heels to stand back up."
      ],
      image: "/assets/exercises/goblet_squat_composite.webp"
    },
    {
      name: "Bent-Over Row",
      defaultSets: 3,
      defaultReps: "10-12",
      notes: "Flat back",
      restSeconds: 120,
      cues: [
        "Hinge at the hips, keeping your back flat.",
        "Pull the weight towards your hips.",
        "Squeeze your shoulder blades together.",
        "Lower the weight with control."
      ],
      image: "/assets/exercises/bent_over_row_composite.webp"
    },
    {
      name: "Triceps Pushdown (Cable)",
      defaultSets: 3,
      defaultReps: "12-15",
      notes: "Elbows glued to ribs",
      isSuperset: true,
      supersetGroup: 1,
      restSeconds: 90,
      cues: [
        "Stand with feet hip-width apart.",
        "Grip the bar/rope with elbows tucked at your sides.",
        "Push the weight down until arms are fully extended.",
        "Return slowly to the starting position."
      ],
      image: "/assets/exercises/triceps_pushdown_composite.webp"
    },
    {
      name: "Preacher Curl",
      defaultSets: 3,
      defaultReps: "10-12",
      notes: "Focus on squeeze",
      isSuperset: true,
      supersetGroup: 1,
      restSeconds: 90,
      cues: [
        "Sit comfortably with your armpits over the pad.",
        "Extend your arms fully at the bottom.",
        "Curl the weight up, squeezing the biceps at the top.",
        "Avoid lifting your elbows off the pad."
      ],
      image: "/assets/exercises/preacher_curl_composite.webp"
    },
    {
      name: "Lateral Raise",
      defaultSets: 3,
      defaultReps: "12-15",
      notes: "Elbows lead",
      isSuperset: true,
      supersetGroup: 2,
      restSeconds: 60,
      cues: [
        "Stand with a slight lean forward.",
        "Raise the dumbbells to the side until arm parallel to floor.",
        "Lead with your elbows, keeping a slight bend.",
        "Lower slowly and avoid swinging."
      ],
      image: "/assets/exercises/lateral_raise_composite.webp"
    },
    {
      name: "Russian Twist",
      defaultSets: 3,
      defaultReps: "20",
      notes: "Total reps",
      isSuperset: true,
      supersetGroup: 2,
      restSeconds: 60,
      cues: [
        "Sit on the floor, leaning back slightly with knees bent.",
        "Hold a weight with both hands.",
        "Twist your torso to the right, then to the left.",
        "Keep your core engaged throughout."
      ],
      image: "/assets/exercises/russian_twist_composite.webp"
    },
  ],
  cooldown: SHARED_COOLDOWN_A
};

export const PLAN_BEGINNER_B: WorkoutPlan = {
  id: WorkoutType.B,
  title: "Back, Hinge, & Lengthened Arms (Mod)",
  focus: "Posture & Posterior Chain",
  warmup: [...SHARED_WARMUP_B, "Glute Bridges: 2x15"],
  exercises: [
    {
      name: "Lat Pulldown",
      defaultSets: 3,
      defaultReps: "10-12",
      notes: "Pull to upper chest",
      restSeconds: 120,
      cues: [
        "Sit with knees secured under the pads.",
        "Grip the bar wider than shoulder-width.",
        "Pull the bar down to your upper chest.",
        "Squeeze your lats and control the return."
      ],
      image: "/assets/exercises/lat_pulldown_composite.webp"
    },
    {
      name: "Romanian Deadlift (RDL)",
      defaultSets: 3,
      defaultReps: "10-12",
      notes: "Close car door with butt",
      restSeconds: 120,
      cues: [
        "Stand with feet hip-width apart.",
        "Hinge at the hips, pushing your butt back.",
        "Keep a slight bend in the knees.",
        "Lower until you feel a stretch in your hamstrings, then drive hips forward."
      ],
      image: "/assets/exercises/rdl_composite.webp"
    },
    {
      name: "Overhead Press (Dumbbell)",
      defaultSets: 3,
      defaultReps: "8-10",
      notes: "Tight abs, no arch",
      restSeconds: 120,
      cues: [
        "Stand or sit with core engaged.",
        "Press the dumbbells straight up overhead.",
        "Avoid arching your lower back.",
        "Lower the weights with control to ear level."
      ],
      image: "/assets/exercises/overhead_press_composite.webp"
    },
    {
      name: "Leg Extension",
      defaultSets: 3,
      defaultReps: "12-15",
      notes: "Quads",
      isSuperset: true,
      supersetGroup: 1,
      restSeconds: 90,
      cues: [
        "Sit with your back flat against the pad.",
        "Extend your legs until they are straight.",
        "Squeeze your quads at the top.",
        "Lower the weight slowly."
      ],
      image: "/assets/exercises/leg_extension_composite.webp"
    },
    {
      name: "Lying Leg Curl",
      defaultSets: 3,
      defaultReps: "10-12",
      notes: "Hamstrings",
      isSuperset: true,
      supersetGroup: 1,
      restSeconds: 90,
      cues: [
        "Lie face down on the machine.",
        "Curl your legs up towards your glutes.",
        "Squeeze your hamstrings at the top.",
        "Lower the weight with control."
      ],
      image: "/assets/exercises/lying_leg_curl_composite.webp"
    },
    {
      name: "Overhead Triceps Extension",
      defaultSets: 3,
      defaultReps: "10-12",
      notes: "Elbows up",
      isSuperset: true,
      supersetGroup: 2,
      restSeconds: 90,
      cues: [
        "Hold the weight overhead with both hands.",
        "Lower the weight behind your head by bending elbows.",
        "Keep elbows close to your head.",
        "Extend arms back to the starting position."
      ],
      image: "/assets/exercises/overhead_triceps_extension_composite.webp"
    },
    {
      name: "Crossbody Hammer Curl",
      defaultSets: 3,
      defaultReps: "10-12",
      notes: "Arm width",
      isSuperset: true,
      supersetGroup: 2,
      restSeconds: 90,
      cues: [
        "Stand holding dumbbells at your sides.",
        "Curl one dumbbell across your body towards the opposite shoulder.",
        "Keep your palm facing your body (neutral grip).",
        "Lower slowly and repeat on the other side."
      ],
      image: "/assets/exercises/crossbody_hammer_curl_composite.webp"
    },
    {
      name: "Knee Raise",
      defaultSets: 3,
      defaultReps: "12-15",
      notes: "Or lying leg raise",
      restSeconds: 60,
      cues: [
        "Hang from a bar or use a captain's chair.",
        "Raise your knees towards your chest.",
        "Engage your core and avoid swinging.",
        "Lower legs slowly."
      ],
      image: "/assets/exercises/knee_raise_composite.webp"
    },
  ],
  cooldown: SHARED_COOLDOWN_B
};

export const STARTER_PLANS: Record<'advanced' | 'beginner', { [key in WorkoutType]: WorkoutPlan }> = {
  'advanced': {
    [WorkoutType.A]: PLAN_ADVANCED_A,
    [WorkoutType.B]: PLAN_ADVANCED_B,
    [WorkoutType.CUSTOM]: PLAN_ADVANCED_A,
    [WorkoutType.CUSTOM_TEMPLATE]: PLAN_ADVANCED_A,
    [WorkoutType.COMMITMENT]: PLAN_ADVANCED_A
  },
  'beginner': {
    [WorkoutType.A]: PLAN_BEGINNER_A,
    [WorkoutType.B]: PLAN_BEGINNER_B,
    [WorkoutType.CUSTOM]: PLAN_BEGINNER_A,
    [WorkoutType.CUSTOM_TEMPLATE]: PLAN_BEGINNER_A,
    [WorkoutType.COMMITMENT]: PLAN_BEGINNER_A
  },
};

export const BEEP_SOUND = ""; // Not used, handled in component
export const MET_VALUES: Record<string, number> = {
  'Walking': 3.5,
  'Running': 9.8,
  'Treadmill': 7.0,
  'Spin Bike': 8.5,
  'Yoga': 2.5,
  'Squash': 7.3,
  'Swimming': 8.0,
  'HIIT': 8.0,
  'Dancing': 4.5,
  'Hiking': 6.0,
  'Jump Rope': 11.0,
  'Pilates': 3.0,
  'Circuit Training': 8.0,
  'Other': 5.0
};

export const ACTIVITIES_LIST = Object.keys(MET_VALUES);

export const WELLBEING_ACTIVITIES: string[] = [
  'Cooking',
  'Baking',
  'Painting',
  'Music',
  'Meditation',
  'Reading',
  'Gardening',
  'Other'
];
