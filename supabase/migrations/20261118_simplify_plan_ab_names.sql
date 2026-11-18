-- Idempotent migration to simplify "Revised Plan A (...)" and "Revised Plan B (...)"
-- template names and sequence slot labels to short "A - ..." / "B - ..." titles
-- across all relevant JSONB fields in public.profiles.

WITH renamed_profiles AS (
  SELECT
    p.id,
    -- Build mapping of old template id/name -> short clean name for this profile
    (
      SELECT jsonb_agg(
        CASE
          WHEN (tpl->>'name') ILIKE 'Revised Plan A%' THEN
            jsonb_set(
              tpl,
              '{name}',
              to_jsonb(
                CASE
                  WHEN (tpl->>'name') ILIKE '%Box Squat%' OR (tpl->>'name') ILIKE '%Sculpt%' THEN 'A - Sculpt & Squat'
                  WHEN (tpl->>'name') ILIKE '%Upper Thickness%' OR (tpl->>'name') ILIKE '%Unilateral%' THEN 'A - Upper & Quads'
                  ELSE 'A - Upper & Legs'
                END
              )
            )
          WHEN (tpl->>'name') ILIKE 'Revised Plan B%' THEN
            jsonb_set(
              tpl,
              '{name}',
              to_jsonb(
                CASE
                  WHEN (tpl->>'name') ILIKE '%Posture%' OR (tpl->>'name') ILIKE '%Leg Ext%' THEN 'B - Posture & RDL'
                  WHEN (tpl->>'name') ILIKE '%V-Taper%' OR (tpl->>'name') ILIKE '%Upper Chest%' THEN 'B - Pull-Ups & RDL'
                  ELSE 'B - Back & Hinge'
                END
              )
            )
          ELSE tpl
        END
      )
      FROM jsonb_array_elements(COALESCE(p.workout_templates, '[]'::jsonb)) AS tpl
    ) AS new_templates,
    (
      SELECT jsonb_agg(
        CASE
          WHEN (slot->>'label') ILIKE 'Revised Plan A%' THEN
            jsonb_set(
              slot,
              '{label}',
              to_jsonb(
                CASE
                  WHEN (slot->>'label') ILIKE '%Box Squat%' OR (slot->>'label') ILIKE '%Sculpt%' THEN 'A - Sculpt & Squat'
                  WHEN (slot->>'label') ILIKE '%Upper Thickness%' OR (slot->>'label') ILIKE '%Unilateral%' THEN 'A - Upper & Quads'
                  ELSE 'A - Upper & Legs'
                END
              )
            )
          WHEN (slot->>'label') ILIKE 'Revised Plan B%' THEN
            jsonb_set(
              slot,
              '{label}',
              to_jsonb(
                CASE
                  WHEN (slot->>'label') ILIKE '%Posture%' OR (slot->>'label') ILIKE '%Leg Ext%' THEN 'B - Posture & RDL'
                  WHEN (slot->>'label') ILIKE '%V-Taper%' OR (slot->>'label') ILIKE '%Upper Chest%' THEN 'B - Pull-Ups & RDL'
                  ELSE 'B - Back & Hinge'
                END
              )
            )
          ELSE slot
        END
      )
      FROM jsonb_array_elements(COALESCE(p.goals->'workoutSequence', '[]'::jsonb)) AS slot
    ) AS new_workout_sequence,
    (
      SELECT jsonb_agg(
        jsonb_set(
          seq,
          '{slots}',
          COALESCE(
            (
              SELECT jsonb_agg(
                CASE
                  WHEN (slot->>'label') ILIKE 'Revised Plan A%' THEN
                    jsonb_set(
                      slot,
                      '{label}',
                      to_jsonb(
                        CASE
                          WHEN (slot->>'label') ILIKE '%Box Squat%' OR (slot->>'label') ILIKE '%Sculpt%' THEN 'A - Sculpt & Squat'
                          WHEN (slot->>'label') ILIKE '%Upper Thickness%' OR (slot->>'label') ILIKE '%Unilateral%' THEN 'A - Upper & Quads'
                          ELSE 'A - Upper & Legs'
                        END
                      )
                    )
                  WHEN (slot->>'label') ILIKE 'Revised Plan B%' THEN
                    jsonb_set(
                      slot,
                      '{label}',
                      to_jsonb(
                        CASE
                          WHEN (slot->>'label') ILIKE '%Posture%' OR (slot->>'label') ILIKE '%Leg Ext%' THEN 'B - Posture & RDL'
                          WHEN (slot->>'label') ILIKE '%V-Taper%' OR (slot->>'label') ILIKE '%Upper Chest%' THEN 'B - Pull-Ups & RDL'
                          ELSE 'B - Back & Hinge'
                        END
                      )
                    )
                  ELSE slot
                END
              )
              FROM jsonb_array_elements(COALESCE(seq->'slots', '[]'::jsonb)) AS slot
            ),
            '[]'::jsonb
          )
        )
      )
      FROM jsonb_array_elements(COALESCE(p.goals->'savedSequences', '[]'::jsonb)) AS seq
    ) AS new_saved_sequences
  FROM public.profiles p
  WHERE p.workout_templates::text ILIKE '%Revised Plan%'
     OR p.goals::text ILIKE '%Revised Plan%'
)
UPDATE public.profiles p
SET
  workout_templates = COALESCE(rp.new_templates, p.workout_templates),
  goals = CASE
    WHEN p.goals IS NULL THEN NULL
    ELSE p.goals
      || CASE
           WHEN p.goals ? 'workoutSequence' AND rp.new_workout_sequence IS NOT NULL
           THEN jsonb_build_object('workoutSequence', rp.new_workout_sequence)
           ELSE '{}'::jsonb
         END
      || CASE
           WHEN p.goals ? 'savedSequences' AND rp.new_saved_sequences IS NOT NULL
           THEN jsonb_build_object('savedSequences', rp.new_saved_sequences)
           ELSE '{}'::jsonb
         END
  END
FROM renamed_profiles rp
WHERE p.id = rp.id;
