import React, { useState } from 'react';
import { EXERCISE_MUSCLE_MAP } from '../utils/muscleMapping';
import { resolveExerciseVisualMeta } from '../utils/exerciseVisuals';
import { DEFAULT_CUSTOM_WARMUP, DEFAULT_CUSTOM_COOLDOWN, normalizeWorkoutTemplate } from '../utils/templateUtils';
import { WorkoutTemplate } from '../types';
import { Plus, Trash2, Save, X, Flame, Wind } from 'lucide-react';
import { ExerciseThumbnail, ExerciseBadgeRow } from './ExerciseVisualBadges';

interface Props {
  onSave: (template: WorkoutTemplate) => void;
  onCancel: () => void;
  initialTemplate?: WorkoutTemplate;
}

/**
 * BOLT: Hoisted sorted exercise list to module scope to eliminate redundant
 * Object.keys() calls, array allocations, and string sorting on every component mount.
 */
export const SORTED_AVAILABLE_EXERCISES = Object.keys(EXERCISE_MUSCLE_MAP).sort();

/**
 * BOLT: Wrap TemplateEditor in React.memo to prevent unnecessary re-renders
 * when parent state changes.
 */
export const TemplateEditor: React.FC<Props> = React.memo(({ onSave, onCancel, initialTemplate }) => {
  const [name, setName] = useState(initialTemplate?.name || '');
  const [focus, setFocus] = useState(initialTemplate?.focus || '');
  const [warmup, setWarmup] = useState<string[]>(
    initialTemplate?.warmup && initialTemplate.warmup.length > 0
      ? initialTemplate.warmup
      : [...DEFAULT_CUSTOM_WARMUP]
  );
  const [cooldown, setCooldown] = useState<string[]>(
    initialTemplate?.cooldown && initialTemplate.cooldown.length > 0
      ? initialTemplate.cooldown
      : [...DEFAULT_CUSTOM_COOLDOWN]
  );
  const [newWarmupStep, setNewWarmupStep] = useState('');
  const [newCooldownStep, setNewCooldownStep] = useState('');
  const [exercises, setExercises] = useState<WorkoutTemplate['exercises']>(
    initialTemplate?.exercises || []
  );
  const [selectedExercise, setSelectedExercise] = useState('');
  const [customExerciseName, setCustomExerciseName] = useState('');

  const handleAddExercise = (exerciseName?: string) => {
    const targetName = (exerciseName ?? selectedExercise).trim();
    if (!targetName) return;
    const visual = resolveExerciseVisualMeta(targetName);
    setExercises([
      ...exercises,
      {
        name: targetName,
        sets: 3,
        reps: '8-12',
        image: visual.image,
        visualArchetype: visual.archetype,
        equipment: visual.equipment
      }
    ]);
    setSelectedExercise('');
    setCustomExerciseName('');
  };

  const handleRemoveExercise = (index: number) => {
    const updated = [...exercises];
    updated.splice(index, 1);
    setExercises(updated);
  };

  const handleUpdateExercise = (index: number, field: 'sets' | 'reps', value: string | number) => {
    const updated = [...exercises];
    updated[index] = { ...updated[index], [field]: value };
    setExercises(updated);
  };

  const handleSave = () => {
    if (!name.trim()) {
      alert("Please give your workout a name!");
      return;
    }
    if (exercises.length === 0) {
      alert("Please add at least one exercise!");
      return;
    }

    const normalizedExercises = exercises.map(ex => {
      const visual = resolveExerciseVisualMeta(ex.name, {
        customImage: ex.image,
        visualArchetype: ex.visualArchetype,
        equipment: ex.equipment
      });
      return {
        ...ex,
        image: visual.image,
        visualArchetype: visual.archetype,
        equipment: visual.equipment
      };
    });

    const template = normalizeWorkoutTemplate({
      id: initialTemplate?.id || crypto.randomUUID(),
      name: name.trim(),
      focus: focus.trim() || undefined,
      warmup: warmup.map(s => s.trim()).filter(Boolean),
      cooldown: cooldown.map(s => s.trim()).filter(Boolean),
      exercises: normalizedExercises
    });

    onSave(template);
  };

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <div className="p-4 bg-white border-b border-slate-100 flex justify-between items-center sticky top-0 z-10">
        <h3 className="font-bold text-emerald-900 text-lg font-['Fredoka']">
          {initialTemplate ? 'Edit Template' : 'New Workout'}
        </h3>
        <button onClick={onCancel} className="bg-slate-100 p-2 rounded-full text-slate-500 hover:bg-slate-200 transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div>
          <label className="block text-xs font-bold text-emerald-700 uppercase mb-2">Workout Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Leg Day Destroyer"
            className="w-full bg-white border border-emerald-100 rounded-xl p-3 font-bold text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-400 placeholder-emerald-200"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-emerald-700 uppercase mb-2">Theme / Focus (Optional)</label>
          <input
            type="text"
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            placeholder="e.g. Hypertrophy, Spine-Safe Core & Mobility"
            className="w-full bg-white border border-emerald-100 rounded-xl p-3 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 placeholder-slate-300"
          />
        </div>

        {/* Workout-Specific Warmup */}
        <div className="bg-white p-3.5 rounded-2xl border border-orange-100 space-y-2.5">
          <label className="flex items-center text-xs font-bold text-orange-600 uppercase tracking-wide">
            <Flame size={14} className="mr-1.5" /> Workout-Specific Warm-Up
          </label>
          <div className="space-y-1.5">
            {warmup.map((step, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={step}
                  onChange={(e) => {
                    const updated = [...warmup];
                    updated[idx] = e.target.value;
                    setWarmup(updated);
                  }}
                  className="flex-1 bg-orange-50/50 border border-orange-100 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-orange-400"
                />
                <button
                  type="button"
                  onClick={() => setWarmup(warmup.filter((_, i) => i !== idx))}
                  className="text-slate-400 hover:text-red-500 p-1 shrink-0"
                  aria-label="Remove warmup step"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newWarmupStep}
              onChange={(e) => setNewWarmupStep(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newWarmupStep.trim()) {
                  e.preventDefault();
                  setWarmup([...warmup, newWarmupStep.trim()]);
                  setNewWarmupStep('');
                }
              }}
              placeholder="Add warm-up drill..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-orange-400"
            />
            <button
              type="button"
              onClick={() => {
                if (!newWarmupStep.trim()) return;
                setWarmup([...warmup, newWarmupStep.trim()]);
                setNewWarmupStep('');
              }}
              disabled={!newWarmupStep.trim()}
              className="bg-orange-500 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold disabled:opacity-40"
            >
              + Add
            </button>
          </div>
        </div>

        <div className="space-y-2.5">
          <label className="block text-xs font-bold text-emerald-700 uppercase">Add Exercises</label>
          <div className="flex gap-2">
            <select
              value={selectedExercise}
              onChange={(e) => setSelectedExercise(e.target.value)}
              className="flex-1 bg-white border border-emerald-100 rounded-xl p-3 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              <option value="">Select an exercise...</option>
              {SORTED_AVAILABLE_EXERCISES.map(ex => (
                <option key={ex} value={ex}>{ex}</option>
              ))}
            </select>
            <button
              onClick={() => handleAddExercise()}
              disabled={!selectedExercise}
              className="bg-emerald-500 text-white p-3 rounded-xl disabled:opacity-50 active:scale-95 transition-transform"
              aria-label="Add selected exercise"
            >
              <Plus size={20} />
            </button>
          </div>

          {/* Custom Exercise Input with Instant Archetype + Badge Preview */}
          <div className="flex gap-2">
            <input
              type="text"
              value={customExerciseName}
              onChange={(e) => setCustomExerciseName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && customExerciseName.trim()) {
                  e.preventDefault();
                  handleAddExercise(customExerciseName);
                }
              }}
              placeholder="Or type any custom exercise (e.g. Cable Face Pull)..."
              className="flex-1 bg-white border border-emerald-100 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            <button
              type="button"
              onClick={() => handleAddExercise(customExerciseName)}
              disabled={!customExerciseName.trim()}
              className="bg-emerald-600 text-white px-3 py-2 rounded-xl text-xs font-bold disabled:opacity-40 active:scale-95 transition-transform shrink-0"
            >
              + Custom
            </button>
          </div>

          {customExerciseName.trim().length > 1 && (
            <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-xl p-2.5 flex items-center gap-2.5">
              <ExerciseThumbnail name={customExerciseName.trim()} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-emerald-950 truncate">
                  Preview: {customExerciseName.trim()}
                </div>
                <ExerciseBadgeRow name={customExerciseName.trim()} compact className="mt-0.5" />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {exercises.map((ex, idx) => (
            <div key={idx} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3 animate-slide-up">
              <div className="flex justify-between items-start gap-2">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <ExerciseThumbnail
                    name={ex.name}
                    customImage={ex.image}
                    visualArchetype={ex.visualArchetype}
                    equipment={ex.equipment}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-slate-800 text-sm truncate">{ex.name}</div>
                    <ExerciseBadgeRow
                      name={ex.name}
                      customImage={ex.image}
                      visualArchetype={ex.visualArchetype}
                      equipment={ex.equipment}
                      compact
                      className="mt-0.5"
                    />
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveExercise(idx)}
                  className="text-red-400 hover:text-red-500 p-1 shrink-0"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="flex gap-4 pl-12">
                <div className="flex-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Sets</label>
                    <input
                        type="number"
                        value={ex.sets}
                        onChange={(e) => handleUpdateExercise(idx, 'sets', parseInt(e.target.value) || 0)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm font-bold text-slate-700"
                    />
                </div>
                <div className="flex-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Reps</label>
                    <input
                        type="text"
                        value={ex.reps}
                        onChange={(e) => handleUpdateExercise(idx, 'reps', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm font-bold text-slate-700"
                    />
                </div>
              </div>
            </div>
          ))}

          {exercises.length === 0 && (
            <div className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
              <p className="text-sm font-bold">No exercises added yet.</p>
              <p className="text-xs">Select from the dropdown or type any custom exercise above.</p>
            </div>
          )}
        </div>

        {/* Workout-Specific Cooldown */}
        <div className="bg-white p-3.5 rounded-2xl border border-sky-100 space-y-2.5">
          <label className="flex items-center text-xs font-bold text-sky-600 uppercase tracking-wide">
            <Wind size={14} className="mr-1.5" /> Workout-Specific Cool-Down
          </label>
          <div className="space-y-1.5">
            {cooldown.map((step, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={step}
                  onChange={(e) => {
                    const updated = [...cooldown];
                    updated[idx] = e.target.value;
                    setCooldown(updated);
                  }}
                  className="flex-1 bg-sky-50/50 border border-sky-100 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-400"
                />
                <button
                  type="button"
                  onClick={() => setCooldown(cooldown.filter((_, i) => i !== idx))}
                  className="text-slate-400 hover:text-red-500 p-1 shrink-0"
                  aria-label="Remove cooldown step"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newCooldownStep}
              onChange={(e) => setNewCooldownStep(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newCooldownStep.trim()) {
                  e.preventDefault();
                  setCooldown([...cooldown, newCooldownStep.trim()]);
                  setNewCooldownStep('');
                }
              }}
              placeholder="Add cool-down stretch..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-400"
            />
            <button
              type="button"
              onClick={() => {
                if (!newCooldownStep.trim()) return;
                setCooldown([...cooldown, newCooldownStep.trim()]);
                setNewCooldownStep('');
              }}
              disabled={!newCooldownStep.trim()}
              className="bg-sky-500 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold disabled:opacity-40"
            >
              + Add
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 bg-white border-t border-slate-100 sticky bottom-0">
        <button
          onClick={handleSave}
          className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition-transform flex items-center justify-center"
        >
          <Save size={20} className="mr-2" /> Save Template
        </button>
      </div>
    </div>
  );
});
