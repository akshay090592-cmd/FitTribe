-- Idempotent migration to add Period-Phase templates (Days 1-2 Cramp Relief & Days 3-5 Low-RPE Sculpt)
-- and initialize multi-sequence support (`savedSequences` & `activeSequenceId` inside `goals` JSONB).

WITH period_templates AS (
  SELECT jsonb_build_array(
    jsonb_build_object(
      'id', 'tpl_period_days_1_2_cramp_relief',
      'name', 'Period Days 1-2: Cramp Relief & Pelvic Decompression',
      'focus', 'Gentle 70% Load • Zero Pelvic/Spinal Compression, Supported Upper & 90-45° Knee Care',
      'warmup', jsonb_build_array(
        'Constructive Rest Pose (4s inhale / 6s exhale belly-soft nasal breathing, jaw relaxed): 2 mins',
        'Mid-Range Cat-Cow Pelvic Tilts (gentle sacral blood flow): 8 slow reps',
        'Seated Scapular Wall Slides & Shoulder Rolls: 10 reps'
      ),
      'cooldown', jsonb_build_array(
        'Reclined Bound-Angle (Supta Baddha Konasana) w/ Supported Knees: 90s',
        'Supine Figure-4 Glute Release (knees at safe 90° angle): 35s/side',
        'Slow 4s-Inhale / 6s-Exhale Vagal Nasal Breathing: 90s'
      ),
      'exercises', jsonb_build_array(
        jsonb_build_object(
          'name', 'Seated Cable Row (Neutral Grip)',
          'sets', 2,
          'reps', '12',
          'restSeconds', 75,
          'notes', 'Gentle 75% load (~20-22.5 kg). Sit tall, zero abdominal compression, chin relaxed.',
          'cues', jsonb_build_array('Exhale smoothly as you pull to lower ribs', 'Keep upper traps relaxed away from ears'),
          'legacyAlias', 'Seated Cable Row'
        ),
        jsonb_build_object(
          'name', 'Incline DB Press (Neutral/45° Grip)',
          'sets', 2,
          'reps', '10-12',
          'restSeconds', 75,
          'notes', 'Light-moderate load (~8-10 kg DBs). Back & head supported on 30° bench, no breath-holding.',
          'cues', jsonb_build_array('45° neutral-angled grip', 'Stop 2° shy of elbow lockout'),
          'legacyAlias', 'Bench Press (Dumbbell)'
        ),
        jsonb_build_object(
          'name', 'Leg Extension (90° to 45° Safe Arc)',
          'sets', 2,
          'reps', '12',
          'restSeconds', 60,
          'notes', 'Light load (~15-17.5 kg). Extend from 90° to 45° mid-arc ONLY with a 2s hold; zero pelvic load.',
          'cues', jsonb_build_array('Stop at 45° mid-arc (avoid 30°-0° lockout)', '2-second gentle hold at 45°'),
          'legacyAlias', 'Leg Extension'
        ),
        jsonb_build_object(
          'name', 'Heel-Dig Glute Bridge',
          'sets', 2,
          'reps', '10',
          'restSeconds', 60,
          'notes', 'Bodyweight ONLY (do not place dumbbell on lower abdomen during Days 1-2).',
          'cues', jsonb_build_array('Press heels gently against the floor', 'Exhale at the top without overarching lower back'),
          'legacyAlias', 'Glute Bridge'
        ),
        jsonb_build_object(
          'name', 'Face Pulls (External Rotation Focus)',
          'sets', 2,
          'reps', '12-15',
          'restSeconds', 60,
          'notes', 'Light cable load (~12.5-15 kg). Opens chest and relieves neck/TMJ tension.',
          'cues', jsonb_build_array('Pull rope toward forehead with thumbs back', 'Keep jaw unclenched'),
          'legacyAlias', 'Face Pull'
        )
      )
    ),
    jsonb_build_object(
      'id', 'tpl_period_days_3_5_low_rpe_sculpt',
      'name', 'Period Days 3-5: Low-RPE Joint-Safe Sculpt',
      'focus', 'Deload 2-Set Antagonist Sculpt (75-80% Load, RPE 6.5-7) • 50-60° Box Squat & Posture',
      'warmup', jsonb_build_array(
        'Easy Flat Treadmill Walk (nasal breathing, jaw unclenched): 3 mins',
        'Standing Band Pull-Aparts (12 reps) + Scapular Wall Slides (8 reps)',
        'Bodyweight Glute Bridges (10 reps) + 6 Elevated Box Squats (50°-60° knee angle)'
      ),
      'cooldown', jsonb_build_array(
        'Standing Lat & Side-Bend Wall Reach (zero knee hyperflexion): 40s/side',
        'Doorway Chest & Upper-Trap Release: 30s/side',
        'Constructive Rest Psoas & Jaw Release: 90s'
      ),
      'exercises', jsonb_build_array(
        jsonb_build_object(
          'name', 'Bench Press (Dumbbell)',
          'sets', 2,
          'reps', '10',
          'isSuperset', true,
          'supersetGroup', 1,
          'restSeconds', 60,
          'notes', '2 sets @ ~75-80% load (~10 kg DBs, RPE 7). Smooth breathing, head flat on bench.',
          'cues', jsonb_build_array('Pair with Lat Pulldown (1b)', 'Leave 2-3 reps in reserve'),
          'legacyAlias', 'Bench Press (Dumbbell)'
        ),
        jsonb_build_object(
          'name', 'Lat Pulldown (Neutral or Wide Grip)',
          'sets', 2,
          'reps', '10-12',
          'isSuperset', true,
          'supersetGroup', 1,
          'restSeconds', 75,
          'notes', '2 sets @ ~25-27.5 kg. Pull to upper chest with chin neutral.',
          'cues', jsonb_build_array('Depress shoulder blades first', 'Do not jut chin forward'),
          'legacyAlias', 'Lat Pulldown'
        ),
        jsonb_build_object(
          'name', 'Goblet Box Squat (50-60° Depth)',
          'sets', 2,
          'reps', '10',
          'restSeconds', 90,
          'notes', '2 sets @ ~10 kg DB onto elevated box/pad (50°-60° knee angle). No Valsalva breath-holding.',
          'cues', jsonb_build_array('Sit hips back to elevated box', 'Drive evenly through both heels'),
          'legacyAlias', 'Goblet Squat'
        ),
        jsonb_build_object(
          'name', 'Heel-Dig Glute Bridge',
          'sets', 2,
          'reps', '12',
          'isSuperset', true,
          'supersetGroup', 2,
          'restSeconds', 45,
          'notes', '2 sets @ Bodyweight. Posterior-chain maintenance without heavy spinal/pelvic hinge.',
          'cues', jsonb_build_array('2-second hamstring/glute squeeze', 'Ribs soft, lower back neutral'),
          'legacyAlias', 'Glute Bridge'
        ),
        jsonb_build_object(
          'name', 'Cable or Dumbbell Lateral Raise',
          'sets', 2,
          'reps', '12',
          'isSuperset', true,
          'supersetGroup', 2,
          'restSeconds', 60,
          'notes', '2 sets @ 5-7.5 kg in 30° scapular plane, stopping just below shoulder height.',
          'cues', jsonb_build_array('Keep upper traps soft', 'Controlled 2-second lowering'),
          'legacyAlias', 'Lateral Raise'
        ),
        jsonb_build_object(
          'name', 'Triceps Pushdown (Cable)',
          'sets', 2,
          'reps', '12',
          'isSuperset', true,
          'supersetGroup', 3,
          'restSeconds', 45,
          'notes', '2 sets @ ~25 kg. Elbows pinned at sides, shoulders down.',
          'cues', jsonb_build_array('Squeeze triceps at bottom', 'Zero shoulder shrug'),
          'legacyAlias', 'Triceps Pushdown (Cable)'
        ),
        jsonb_build_object(
          'name', 'Incline Dumbbell Curl',
          'sets', 2,
          'reps', '12',
          'isSuperset', true,
          'supersetGroup', 3,
          'restSeconds', 60,
          'notes', '2 sets @ ~10 kg total (5 kg/hand). Back supported, stop just shy of hypermobile elbow lockout.',
          'cues', jsonb_build_array('Keep shoulders back against pad', 'Smooth supination'),
          'legacyAlias', 'Incline Dumbbell Curl'
        )
      )
    )
  ) AS templates_arr
)
UPDATE public.profiles p
SET
  workout_templates = (
    SELECT jsonb_agg(elem)
    FROM (
      SELECT elem
      FROM jsonb_array_elements(COALESCE(p.workout_templates, '[]'::jsonb)) AS elem
      WHERE NOT ((elem->>'id') IN ('tpl_period_days_1_2_cramp_relief', 'tpl_period_days_3_5_low_rpe_sculpt'))
      UNION ALL
      SELECT elem
      FROM period_templates pt, jsonb_array_elements(pt.templates_arr) AS elem
    ) combined
  ),
  goals = COALESCE(p.goals, '{}'::jsonb) || jsonb_build_object(
    'activeSequenceId', COALESCE(p.goals->>'activeSequenceId', 'seq_standard'),
    'savedSequences', jsonb_build_array(
      jsonb_build_object(
        'id', 'seq_standard',
        'name', 'Standard Cycle',
        'slots', COALESCE(p.goals->'workoutSequence', '[]'::jsonb),
        'currentIndex', COALESCE((p.goals->>'sequenceIndex')::int, 0)
      ),
      jsonb_build_object(
        'id', 'seq_period_week',
        'name', 'Period Week (Days 1-5)',
        'currentIndex', 0,
        'slots', jsonb_build_array(
          jsonb_build_object(
            'id', 'slot_period_d1',
            'type', 'custom_template',
            'label', 'Period Days 1-2: Cramp Relief & Pelvic Decompression',
            'templateId', 'tpl_period_days_1_2_cramp_relief'
          ),
          jsonb_build_object(
            'id', 'slot_period_d2',
            'type', 'activity',
            'label', 'Gentle Flat Walk (Cramp Relief)',
            'activityName', 'Walking',
            'activityMode', 'fitness',
            'defaultDuration', 30,
            'defaultIntensity', 4
          ),
          jsonb_build_object(
            'id', 'slot_period_d3',
            'type', 'custom_template',
            'label', 'Period Days 3-5: Low-RPE Joint-Safe Sculpt',
            'templateId', 'tpl_period_days_3_5_low_rpe_sculpt'
          ),
          jsonb_build_object(
            'id', 'slot_period_d4',
            'type', 'activity',
            'label', 'Easy Walk / High-Seat Bike',
            'activityName', 'Walking',
            'activityMode', 'fitness',
            'defaultDuration', 30,
            'defaultIntensity', 5
          ),
          jsonb_build_object(
            'id', 'slot_period_d5',
            'type', 'custom_template',
            'label', 'Period Days 3-5: Low-RPE Joint-Safe Sculpt',
            'templateId', 'tpl_period_days_3_5_low_rpe_sculpt'
          )
        )
      )
    )
  )
WHERE EXISTS (
  SELECT 1
  FROM jsonb_array_elements(COALESCE(p.workout_templates, '[]'::jsonb)) AS t
  WHERE (t->>'name') ILIKE '%Period%'
);
