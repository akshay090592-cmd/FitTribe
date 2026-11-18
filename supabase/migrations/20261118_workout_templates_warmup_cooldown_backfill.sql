-- Idempotent backfill migration for workout_templates JSONB entries on public.profiles.
-- Ensures every existing custom workout template has workout-specific warmup, cooldown, and focus fields
-- without overwriting templates that already define them, and leaves all other users/plans untouched.

UPDATE public.profiles
SET workout_templates = COALESCE(
  (
    SELECT jsonb_agg(
      CASE
        WHEN jsonb_typeof(tpl) = 'object' THEN
          tpl
          || CASE
               WHEN NOT (tpl ? 'focus') OR COALESCE(NULLIF(btrim(tpl->>'focus'), ''), '') = ''
               THEN jsonb_build_object('focus', 'Custom Strength & Conditioning')
               ELSE '{}'::jsonb
             END
          || CASE
               WHEN NOT (tpl ? 'warmup')
                 OR jsonb_typeof(tpl->'warmup') <> 'array'
                 OR jsonb_array_length(tpl->'warmup') = 0
               THEN jsonb_build_object(
                 'warmup',
                 jsonb_build_array(
                   'Arm Circles & Shoulder Rolls: 1 min',
                   'Cat-Cow & Thoracic Rotations: 1 min',
                   'Deep Bodyweight Squats: 2 sets x 10 reps'
                 )
               )
               ELSE '{}'::jsonb
             END
          || CASE
               WHEN NOT (tpl ? 'cooldown')
                 OR jsonb_typeof(tpl->'cooldown') <> 'array'
                 OR jsonb_array_length(tpl->'cooldown') = 0
               THEN jsonb_build_object(
                 'cooldown',
                 jsonb_build_array(
                   'Doorway Chest & Shoulder Stretch (30s/side)',
                   'Standing Quad & Hamstring Stretch (30s/side)',
                   'Slow Nasal Box Breathing (60s)'
                 )
               )
               ELSE '{}'::jsonb
             END
        ELSE tpl
      END
    )
    FROM jsonb_array_elements(COALESCE(public.profiles.workout_templates, '[]'::jsonb)) AS tpl
  ),
  '[]'::jsonb
)
WHERE jsonb_typeof(workout_templates) = 'array'
  AND jsonb_array_length(workout_templates) > 0;
