import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  getMuscleGroups,
  resolveExerciseMuscleGroups,
  getCanonicalExerciseName,
  getMovementCategory,
  classifyWorkoutPlanBucket,
  MUSCLE_GROUPS,
} from '../utils/muscleMapping';
import { Analytics } from '../components/Analytics';
import { WorkoutLog, WorkoutType } from '../types';
import * as storage from '../utils/storage';

// Mock Recharts ResponsiveContainer so charts render cleanly in jsdom without ResizeObserver issues
vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div style={{ width: 400, height: 200 }}>{children}</div>
    ),
  };
});

describe('muscleMapping & canonical exercise linking', () => {
  it('maps Revised Plan A & B exercises to real muscle groups instead of Other', () => {
    expect(getMuscleGroups('Goblet Box Squat (50-60° Depth)')).toContain(MUSCLE_GROUPS.LEGS);
    expect(getMuscleGroups('Romanian Deadlift (Hip-Safe Cap)')).toContain(MUSCLE_GROUPS.LEGS);
    expect(getMuscleGroups('45° Incline Chest-Supported DB Row')).toContain(MUSCLE_GROUPS.BACK);
    expect(getMuscleGroups('Face Pulls (External Rotation Focus)')).toContain(MUSCLE_GROUPS.SHOULDERS);
    expect(getMuscleGroups('Heel-Dig Glute Bridge')).toContain(MUSCLE_GROUPS.LEGS);
    expect(getMuscleGroups('Supine Deadbug (Flatten Low Back)')).toContain(MUSCLE_GROUPS.CORE);
    expect(resolveExerciseMuscleGroups('Custom Cable Fly')).toContain(MUSCLE_GROUPS.CHEST);
  });

  it('links legacy Plan A/B names with Revised Plan variants into canonical families', () => {
    expect(getCanonicalExerciseName('Goblet Squat')).toBe(
      getCanonicalExerciseName('Goblet Box Squat (50-60° Depth)')
    );
    expect(getCanonicalExerciseName('Romanian Deadlift')).toBe(
      getCanonicalExerciseName('Romanian Deadlift (Hip-Safe Cap)')
    );
    expect(getCanonicalExerciseName('Seated Cable Row')).toBe(
      getCanonicalExerciseName('45° Incline Chest-Supported DB Row')
    );
    expect(getCanonicalExerciseName('Face Pulls')).toBe(
      getCanonicalExerciseName('Face Pulls (External Rotation Focus)')
    );
  });

  it('classifies push/pull/quad/posterior categories and plan buckets accurately', () => {
    expect(getMovementCategory('45° Incline Chest-Supported DB Row')).toBe('pull');
    expect(getMovementCategory('Incline DB Press (Neutral/45° Grip)')).toBe('push');
    expect(getMovementCategory('Romanian Deadlift (Hip-Safe Cap)')).toBe('posterior');
    expect(getMovementCategory('Leg Extension (90° to 45° Safe Arc)')).toBe('quad');

    expect(classifyWorkoutPlanBucket({ type: 'A' })).toBe('planA');
    expect(
      classifyWorkoutPlanBucket({
        type: 'Custom_Template',
        customActivity: 'Revised Plan A (Antagonist Sculpt & 50-60° Box Squat)',
      })
    ).toBe('planA');
    expect(
      classifyWorkoutPlanBucket({
        type: 'Custom_Template',
        customActivity: 'Revised Plan B (Antagonist V-Taper & Capped RDL)',
      })
    ).toBe('planB');
    expect(
      classifyWorkoutPlanBucket({
        type: 'Custom_Template',
        customActivity: 'Mobility & Nerve Flossing Routine',
      })
    ).toBe('cardioMobility');
  });
});

describe('Analytics (Jungle Insights) upgraded UI & data logic', () => {
  const nowIso = new Date().toISOString();
  const sampleLogs: WorkoutLog[] = [
    {
      id: 'log-1',
      date: nowIso,
      user: 'Akshay' as any,
      type: WorkoutType.A,
      durationMinutes: 45,
      exercises: [
        {
          name: 'Goblet Squat',
          sets: [{ reps: 10, weight: 20, completed: true }],
        },
        {
          name: '45° Incline Chest-Supported DB Row',
          sets: [{ reps: 12, weight: 16, completed: true }],
        },
      ],
    },
    {
      id: 'log-2',
      date: nowIso,
      user: 'Akshay' as any,
      type: WorkoutType.CUSTOM_TEMPLATE,
      customActivity: 'Revised Plan A (Antagonist Upper & Split Squats)',
      durationMinutes: 50,
      exercises: [
        {
          name: 'Goblet Box Squat (50-60° Depth)',
          sets: [{ reps: 10, weight: 24, completed: true }],
        },
        {
          name: 'Incline DB Press (Neutral/45° Grip)',
          sets: [{ reps: 10, weight: 18, completed: true }],
        },
      ],
    },
    {
      id: 'log-3',
      date: nowIso,
      user: 'Akshay' as any,
      type: WorkoutType.CUSTOM,
      customActivity: 'Zone 2 Cardio / Brisk Walk',
      durationMinutes: 35,
      exercises: [],
    },
  ];

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.spyOn(storage, 'getUserLogs').mockResolvedValue(sampleLogs);
    vi.spyOn(storage, 'getTribeMembers').mockResolvedValue([]);
    vi.spyOn(storage, 'calculateStats').mockResolvedValue({
      'Goblet Squat': { maxWeight: 20, maxReps: 10, estimated1RM: 26.7 },
      'Goblet Box Squat (50-60° Depth)': { maxWeight: 24, maxReps: 10, estimated1RM: 32 },
    });
  });

  it('renders friendly section titles, separates cardio minutes, and merges old + revised PRs', async () => {
    render(<Analytics user={'Akshay' as any} userProfile={{ id: 'u1', displayName: 'Akshay', tribeId: 't1' } as any} />);

    await waitFor(() => {
      expect(screen.getByText('Jungle Insights')).toBeInTheDocument();
    });

    // Short friendly section titles
    expect(screen.getByText('Workouts')).toBeInTheDocument();
    expect(screen.getByText('Balance')).toBeInTheDocument();
    expect(screen.getByText('Total Lifted')).toBeInTheDocument();
    expect(screen.getByText('Cardio & Zen')).toBeInTheDocument();
    expect(screen.getByText('Weekly Mix')).toBeInTheDocument();
    expect(screen.getByText('Muscle Balance')).toBeInTheDocument();
    expect(screen.getByText('Lifting Volume')).toBeInTheDocument();
    expect(screen.getByText('Exercise Progress')).toBeInTheDocument();
    expect(screen.getByText('Personal Records')).toBeInTheDocument();

    // 2 Lifting + 1 Cardio = 3 Workouts, 35m Cardio & Zen
    expect(screen.getByText('2 Lift • 1 Cardio')).toBeInTheDocument();
    expect(screen.getByText('35m')).toBeInTheDocument();

    // Legacy Goblet Squat + Revised Goblet Box Squat merged into 'Goblet / Box Squat' with 24kg PR
    expect(screen.getAllByText('Goblet / Box Squat').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('24kg')).toBeInTheDocument();

    // Can toggle Link Old & New off to inspect exact variants separately
    fireEvent.click(screen.getByRole('button', { name: /Old \+ New Linked/i }));
    expect(screen.getByText('Exact Name Only')).toBeInTheDocument();
    expect(screen.getAllByText('Goblet Squat').length).toBeGreaterThanOrEqual(1);
  });
});
