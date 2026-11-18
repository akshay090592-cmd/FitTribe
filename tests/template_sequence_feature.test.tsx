import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import {
  DEFAULT_CUSTOM_WARMUP,
  DEFAULT_CUSTOM_COOLDOWN,
  normalizeWorkoutTemplate,
  templateToWorkoutPlan,
  getNextSequenceIndex,
  getActiveSequenceSlot,
} from '../utils/templateUtils';
import { resolveExerciseVisualMeta } from '../utils/exerciseVisuals';
import { getLastLogForExerciseByType } from '../utils/workoutUtils';
import { TemplateEditor } from '../components/TemplateEditor';
import { WorkoutLibraryModal } from '../components/WorkoutLibraryModal';
import { ActivityTrackerModal } from '../components/ActivityTrackerModal';
import { InfoTooltip } from '../components/InfoTooltip';
import { WorkoutType, UserProfile, WorkoutTemplate } from '../types';

vi.mock('../utils/storage', () => ({
  getUserLogs: vi.fn().mockResolvedValue([]),
  getUserLogsById: vi.fn().mockResolvedValue([]),
  getCurrentProfile: vi.fn(),
  updateProfile: vi.fn().mockResolvedValue(true),
  saveCustomWorkoutPlan: vi.fn().mockResolvedValue(true),
  saveLog: vi.fn().mockResolvedValue({ id: 'log-1' }),
}));

vi.mock('../utils/supabaseClient', () => ({
  isSessionValid: vi.fn().mockResolvedValue(true),
  isSupabaseConfigured: vi.fn(() => true),
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  },
}));

vi.mock('../services/aiCoach', () => ({
  chatWithCoach: vi.fn(),
  generateModifiedPlan: vi.fn(),
  parseWorkoutTextToTemplate: vi.fn(),
}));

import * as storage from '../utils/storage';

const mockProfile: UserProfile = {
  id: 'user-123',
  displayName: 'Member One',
  avatarId: 'avatar_1',
  fitnessLevel: 'intermediate',
  goals: {
    weeklyWorkouts: 4,
    workoutSequence: [
      { id: 'slot-1', type: 'custom_template', label: 'Upper Sculpt', templateId: 'tpl-1' },
      { id: 'slot-2', type: 'activity', label: 'Zone 2 Treadmill', activityName: 'Treadmill Walk', defaultDuration: 40 },
      { id: 'slot-3', type: 'plan_b', label: 'Plan B' },
    ],
    sequenceIndex: 0,
  },
  workoutTemplates: [
    {
      id: 'tpl-1',
      name: 'Upper Sculpt',
      focus: 'Antagonist Upper & Core',
      warmup: ['3 mins Brisk Walk', 'Band Pull-Aparts (15 reps)'],
      cooldown: ['Doorway Chest Stretch (30s/side)'],
      createdAt: '2026-11-18T00:00:00Z',
      exercises: [
        {
          name: 'Chest-Supported DB Row',
          legacyAlias: 'Single-Arm Dumbbell Row',
          sets: 3,
          reps: '8-12',
          targetWeight: '30 kg',
          restSeconds: 75,
          isSuperset: true,
          supersetGroup: '1',
          notes: 'Chest braced on incline pad.',
          cues: ['Pull elbows to hips'],
        },
      ],
    },
  ],
};

describe('templateUtils & workout-specific warmup/cooldown normalization', () => {
  it('falls back to DEFAULT_CUSTOM_WARMUP, DEFAULT_CUSTOM_COOLDOWN, and default focus when omitted', () => {
    const raw: WorkoutTemplate = {
      id: 'raw-1',
      name: 'Minimal Plan',
      createdAt: '2026-11-18T00:00:00Z',
      exercises: [{ name: 'Barbell Bench Press', sets: 3, reps: '8-10' }],
    };

    const normalized = normalizeWorkoutTemplate(raw);
    expect(normalized.focus).toBe('Custom Strength & Conditioning');
    expect(normalized.warmup).toEqual(DEFAULT_CUSTOM_WARMUP);
    expect(normalized.cooldown).toEqual(DEFAULT_CUSTOM_COOLDOWN);
  });

  it('preserves workout-specific warmup, cooldown, focus, and rich exercise fields in templateToWorkoutPlan', () => {
    const plan = templateToWorkoutPlan(mockProfile.workoutTemplates![0]);
    expect(plan.id).toBe(WorkoutType.CUSTOM_TEMPLATE);
    expect(plan.title).toBe('Upper Sculpt');
    expect(plan.focus).toBe('Antagonist Upper & Core');
    expect(plan.warmup).toEqual(['3 mins Brisk Walk', 'Band Pull-Aparts (15 reps)']);
    expect(plan.cooldown).toEqual(['Doorway Chest Stretch (30s/side)']);
    expect(plan.exercises[0].legacyAlias).toBe('Single-Arm Dumbbell Row');
    expect(plan.exercises[0].isSuperset).toBe(true);
    expect(plan.exercises[0].supersetGroup).toBe('1');
  });

  it('computes active sequence slot and next sequence index modularly', () => {
    expect(getActiveSequenceSlot({ weeklyWorkouts: 4 })).toBeNull();
    const active = getActiveSequenceSlot(mockProfile.goals);
    expect(active?.index).toBe(0);
    expect(active?.slot.label).toBe('Upper Sculpt');

    expect(getNextSequenceIndex(0, 3)).toBe(1);
    expect(getNextSequenceIndex(2, 3)).toBe(0);
    expect(getNextSequenceIndex(0, 0)).toBe(0);
  });

  it('resolves all 6 new panda exercise WebP illustrations for exact names and variants', () => {
    expect(resolveExerciseVisualMeta('Chest-Supported Dumbbell Row (30-45° Incline)').image).toBe('/assets/exercises/chest_supported_row_composite.webp');
    expect(resolveExerciseVisualMeta('Seated Neutral-Grip Cable Row').image).toBe('/assets/exercises/seated_cable_row_composite.webp');
    expect(resolveExerciseVisualMeta('Dumbbell Bulgarian Split Squat').image).toBe('/assets/exercises/bulgarian_split_squat_composite.webp');
    expect(resolveExerciseVisualMeta('Elevated Box Goblet Squat (50-60° Knee Angle)').image).toBe('/assets/exercises/box_goblet_squat_composite.webp');
    expect(resolveExerciseVisualMeta('Supine Alternating Deadbug').image).toBe('/assets/exercises/supine_deadbug_composite.webp');
    expect(resolveExerciseVisualMeta('Supine Heel-Dig Glute-Ham Bridge').image).toBe('/assets/exercises/heel_dig_glute_bridge_composite.webp');
  });
});

describe('workoutUtils legacyAlias fallback for Custom_Template', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('resolves prior weights from legacyAlias across base plans when running Custom_Template', async () => {
    vi.mocked(storage.getUserLogs).mockResolvedValue([
      {
        id: 'l1',
        user: 'Member One',
        date: '2026-11-10',
        type: WorkoutType.A,
        durationMinutes: 45,
        exercises: [
          { name: 'Single-Arm Dumbbell Row', sets: [{ weight: 25, reps: 10, completed: true }] },
        ],
      },
    ]);

    const sets = await getLastLogForExerciseByType(
      'Member One',
      'Chest-Supported DB Row',
      WorkoutType.CUSTOM_TEMPLATE,
      'Single-Arm Dumbbell Row'
    );

    expect(sets).toEqual([{ weight: 25, reps: 10, completed: true }]);
  });
});

describe('TemplateEditor workout-specific focus, warmup, and cooldown editing', () => {
  it('allows editing focus, adding/updating warmup & cooldown steps, and persists them via onSave', () => {
    const onSave = vi.fn();
    render(
      <TemplateEditor
        isOpen={true}
        onClose={vi.fn()}
        onSave={onSave}
        initialTemplate={mockProfile.workoutTemplates![0]}
      />
    );

    const focusInput = screen.getByPlaceholderText(/Hypertrophy, Spine-Safe Core/i);
    fireEvent.change(focusInput, { target: { value: 'Knee-Safe Lower Sculpt' } });

    const warmupInput = screen.getByPlaceholderText(/Add warm-up drill/i);
    fireEvent.change(warmupInput, { target: { value: 'Scapular Wall Slides (10 reps)' } });
    fireEvent.keyDown(warmupInput, { key: 'Enter', code: 'Enter' });

    fireEvent.click(screen.getByRole('button', { name: /Save Template/i }));

    expect(onSave).toHaveBeenCalledTimes(1);
    const saved: WorkoutTemplate = onSave.mock.calls[0][0];
    expect(saved.focus).toBe('Knee-Safe Lower Sculpt');
    expect(saved.warmup?.length).toBe(3);
    expect(saved.cooldown).toEqual(['Doorway Chest Stretch (30s/side)']);
  });
});

describe('WorkoutLibraryModal manual Mission Sequence planner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders My Templates with warmup/cooldown counts and Mission Sequence without any preset cycle button', () => {
    render(
      <WorkoutLibraryModal
        isOpen={true}
        onClose={vi.fn()}
        userProfile={mockProfile}
        onStartTemplate={vi.fn()}
        onUpdateProfile={vi.fn()}
      />
    );

    expect(screen.getByText('Upper Sculpt')).toBeInTheDocument();
    expect(screen.getByText(/2 Warm-up/i)).toBeInTheDocument();
    expect(screen.getByText(/1 Cool-down/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Mission Sequence/i }));

    expect(screen.getByText('Zone 2 Treadmill')).toBeInTheDocument();
    expect(screen.queryByText(/Longevity Cycle/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Load Recommended/i)).not.toBeInTheDocument();
  });

  it('adds a custom activity slot to the sequence and saves updated goals', async () => {
    const onUpdateProfile = vi.fn();
    render(
      <WorkoutLibraryModal
        isOpen={true}
        onClose={vi.fn()}
        userProfile={mockProfile}
        onStartTemplate={vi.fn()}
        onUpdateProfile={onUpdateProfile}
        initialTab="sequence"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Add .* to Sequence/i }));

    await waitFor(() => {
      expect(storage.updateProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'user-123',
          goals: expect.objectContaining({
            workoutSequence: expect.arrayContaining([
              expect.objectContaining({ type: 'activity' }),
            ]),
          }),
        })
      );
      expect(onUpdateProfile).toHaveBeenCalled();
    });
  });
});

describe('ActivityTrackerModal initialActivity & initialDuration pre-fill', () => {
  it('pre-fills activity and duration when provided from a sequence mission', () => {
    render(
      <ActivityTrackerModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
        currentUser="Member One"
        userProfile={mockProfile}
        initialActivity="Swimming"
        initialDuration={40}
      />
    );

    expect(screen.getByDisplayValue('Swimming')).toBeInTheDocument();
    expect(screen.getByDisplayValue('40')).toBeInTheDocument();
  });
});

describe('InfoTooltip mobile-friendly explanation popover', () => {
  it('toggles tooltip on click without triggering parent button click and closes on Escape', () => {
    const parentClick = vi.fn();
    render(
      <div onClick={parentClick}>
        <InfoTooltip label="About Honor Pledge" content="Commit today for +40 XP tomorrow." />
      </div>
    );

    const btn = screen.getByRole('button', { name: 'About Honor Pledge' });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    fireEvent.click(btn);
    expect(parentClick).not.toHaveBeenCalled();
    expect(screen.getByRole('tooltip')).toHaveTextContent('Commit today for +40 XP tomorrow.');

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});
