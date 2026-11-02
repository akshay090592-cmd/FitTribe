import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  resolveExerciseArchetype,
  resolveExerciseEquipment,
  resolveExerciseCompositeImage,
  resolveExerciseVisualMeta,
  clearExerciseVisualMetaCache,
  KNOWN_EXERCISE_BLUEPRINTS,
  ARCHETYPE_LABELS,
  EQUIPMENT_LABELS,
} from '../utils/exerciseVisuals';
import { ExerciseArchetype } from '../types';

describe('Tier 1 & Tier 2 Exercise Visual Strategy (exerciseVisuals)', () => {
  beforeEach(() => {
    clearExerciseVisualMetaCache();
  });

  it('resolves known starter & blueprint exercises to exact composite .webp images and archetypes', () => {
    const squat = resolveExerciseVisualMeta('Barbell Back Squat');
    expect(squat.image).toBe('/assets/exercises/goblet_squat_composite.webp');
    expect(squat.archetype).toBe('knee_dominant');
    expect(squat.equipment).toBe('barbell');
    expect(squat.equipmentShort).toBe('BB');
    expect(squat.primaryMuscle).toBe('Quads & Glutes');
    expect(squat.muscleGroup).toBe('Legs');

    const pushups = resolveExerciseVisualMeta('Push-ups');
    expect(pushups.image).toBe('/assets/exercises/pushup_chest_composite.webp');
    expect(pushups.archetype).toBe('horizontal_push');
    expect(pushups.equipment).toBe('bodyweight');
    expect(pushups.equipmentShort).toBe('BW');
    expect(pushups.primaryMuscle).toBe('Chest');

    const splitSquat = resolveExerciseVisualMeta('Bulgarian Split Squat');
    expect(splitSquat.image).toBe('/assets/exercises/lunge_split_squat_composite.webp');
    expect(splitSquat.archetype).toBe('lunge_unilateral');
    expect(splitSquat.equipment).toBe('dumbbell');

    const hipThrust = resolveExerciseVisualMeta('Barbell Hip Thrust');
    expect(hipThrust.image).toBe('/assets/exercises/hip_thrust_composite.webp');
    expect(hipThrust.archetype).toBe('glute_bridge');
    expect(hipThrust.equipment).toBe('barbell');

    const plank = resolveExerciseVisualMeta('Plank');
    expect(plank.image).toBe('/assets/exercises/plank_core_composite.webp');
    expect(plank.archetype).toBe('core_floor');
    expect(plank.equipment).toBe('bodyweight');
  });

  it('maps arbitrary user-created and AI-created exercise variations to the right Panda archetype & equipment badge', () => {
    const inclinePress = resolveExerciseVisualMeta('Incline Alternating Dumbbell Press');
    expect(inclinePress.archetype).toBe('horizontal_push');
    expect(inclinePress.equipment).toBe('dumbbell');
    expect(inclinePress.equipmentShort).toBe('DB');
    expect(inclinePress.image).toBe('/assets/exercises/bench_press_composite.webp');

    const cableFly = resolveExerciseVisualMeta('Standing Cable Chest Fly');
    expect(cableFly.archetype).toBe('horizontal_push');
    expect(cableFly.equipment).toBe('cable');
    expect(cableFly.equipmentShort).toBe('CBL');
    expect(cableFly.image).toBe('/assets/exercises/pushup_chest_composite.webp');

    const walkingLunge = resolveExerciseVisualMeta('Walking Barbell Lunges');
    expect(walkingLunge.archetype).toBe('lunge_unilateral');
    expect(walkingLunge.equipment).toBe('barbell');
    expect(walkingLunge.equipmentShort).toBe('BB');
    expect(walkingLunge.image).toBe('/assets/exercises/lunge_split_squat_composite.webp');

    const kbSwing = resolveExerciseVisualMeta('Heavy Kettlebell Swing');
    expect(kbSwing.archetype).toBe('hip_dominant');
    expect(kbSwing.equipment).toBe('kettlebell');
    expect(kbSwing.equipmentShort).toBe('KB');
    expect(kbSwing.image).toBe('/assets/exercises/rdl_composite.webp');

    const yogaStretch = resolveExerciseVisualMeta('Dynamic Thoracic Mobility Stretch');
    expect(yogaStretch.archetype).toBe('mobility_stretch');
    expect(yogaStretch.equipment).toBe('mobility');
    expect(yogaStretch.image).toBe('/assets/exercises/mobility_stretch_composite.webp');

    const hiit = resolveExerciseVisualMeta('HIIT Sprint Intervals');
    expect(hiit.archetype).toBe('cardio_conditioning');
    expect(hiit.equipment).toBe('cardio');
    expect(hiit.image).toBe('/assets/exercises/cardio_conditioning_composite.webp');
  });

  it('honors explicit AI Coach visualArchetype and equipment hints', () => {
    const aiEx = resolveExerciseVisualMeta('Tempo Panda Pause Squat', {
      visualArchetype: 'knee_dominant',
      equipment: 'kettlebell',
    });
    expect(aiEx.archetype).toBe('knee_dominant');
    expect(aiEx.equipment).toBe('kettlebell');
    expect(aiEx.equipmentShort).toBe('KB');
    expect(aiEx.image).toBe('/assets/exercises/goblet_squat_composite.webp');
  });

  it('verifies all 24 composite .webp files exist on disk in public/assets/exercises/', () => {
    const publicDir = path.resolve(__dirname, '../public');
    const allArchetypes = Object.keys(ARCHETYPE_LABELS) as ExerciseArchetype[];
    const allEquipment = Object.keys(EQUIPMENT_LABELS) as (keyof typeof EQUIPMENT_LABELS)[];

    const checkedPaths = new Set<string>();

    for (const bp of Object.values(KNOWN_EXERCISE_BLUEPRINTS)) {
      checkedPaths.add(bp.image);
    }

    for (const arch of allArchetypes) {
      for (const eq of allEquipment) {
        const img = resolveExerciseCompositeImage(`Test ${arch} ${eq}`, undefined, arch);
        checkedPaths.add(img);
      }
    }

    expect(checkedPaths.size).toBeGreaterThanOrEqual(24);

    for (const relPath of checkedPaths) {
      expect(relPath.endsWith('.webp')).toBe(true);
      const fullPath = path.join(publicDir, relPath);
      expect(fs.existsSync(fullPath), `Missing image asset: ${fullPath}`).toBe(true);
      const stat = fs.statSync(fullPath);
      expect(stat.size).toBeGreaterThan(1000);
    }
  });
});
