import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { WorkoutTemplate, UserProfile, WorkoutSequenceSlot } from '../types';
import { TemplateEditor } from './TemplateEditor';
import { updateProfile } from '../utils/storage';
import { ACTIVITIES_LIST } from '../constants';
import { getActiveSequenceSlot, normalizeWorkoutTemplate } from '../utils/templateUtils';
import { X, Plus, Play, Edit, Trash2, Library, ListOrdered, ArrowUp, ArrowDown, RotateCcw, Flame, Wind, Activity, CheckCircle2 } from 'lucide-react';
import { ConfirmPopup } from './ConfirmPopup';
import { ExerciseThumbnail, ExerciseBadgeRow } from './ExerciseVisualBadges';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile | null;
  onStartTemplate: (template: WorkoutTemplate) => void;
  onUpdateProfile: (profile: UserProfile) => void;
  initialTab?: 'templates' | 'sequence';
}

const SEQUENCE_ACTIVITIES = [
  'Treadmill',
  'Walking',
  'Spin Bike',
  'Swimming',
  'Yoga',
  'Pilates',
  'HIIT',
  'Running',
  ...ACTIVITIES_LIST.filter(
    a => !['Treadmill', 'Walking', 'Spin Bike', 'Swimming', 'Yoga', 'Pilates', 'HIIT', 'Running'].includes(a)
  ),
];

export const WorkoutLibraryModal: React.FC<Props> = ({
  isOpen,
  onClose,
  userProfile,
  onStartTemplate,
  onUpdateProfile,
  initialTab = 'templates',
}) => {
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  const [activeTab, setActiveTab] = useState<'templates' | 'sequence'>(initialTab);
  const [editingTemplate, setEditingTemplate] = useState<WorkoutTemplate | undefined>(undefined);
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);

  // Manual Activity Slotting State
  const [selectedActivity, setSelectedActivity] = useState<string>('Treadmill');
  const [activityDuration, setActivityDuration] = useState<number>(40);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setView('list');
    }
  }, [isOpen, initialTab]);

  if (!isOpen || !userProfile) return null;

  const templates = (userProfile.workoutTemplates || []).map(normalizeWorkoutTemplate);
  const sequenceState = getActiveSequenceSlot(userProfile.goals);
  const sequence = sequenceState?.sequence || [];
  const activeSequenceIndex = sequenceState?.index ?? 0;

  const persistSequence = async (nextSequence: WorkoutSequenceSlot[], nextIndex: number) => {
    const safeIndex = nextSequence.length > 0 ? ((nextIndex % nextSequence.length) + nextSequence.length) % nextSequence.length : 0;
    const updatedProfile: UserProfile = {
      ...userProfile,
      goals: {
        ...(userProfile.goals || {}),
        workoutSequence: nextSequence,
        sequenceIndex: safeIndex,
      },
    };
    onUpdateProfile(updatedProfile);
    await updateProfile(updatedProfile);
  };

  const handleAddTemplateToSequence = async (template: WorkoutTemplate) => {
    const newSlot: WorkoutSequenceSlot = {
      id: crypto.randomUUID(),
      type: 'custom_template',
      label: template.name,
      templateId: template.id,
    };
    await persistSequence([...sequence, newSlot], activeSequenceIndex);
  };

  const handleAddBasePlanToSequence = async (planType: 'plan_a' | 'plan_b') => {
    const newSlot: WorkoutSequenceSlot = {
      id: crypto.randomUUID(),
      type: planType,
      label: planType === 'plan_a' ? 'Plan A' : 'Plan B',
    };
    await persistSequence([...sequence, newSlot], activeSequenceIndex);
  };

  const handleAddActivityToSequence = async () => {
    if (!selectedActivity) return;
    const newSlot: WorkoutSequenceSlot = {
      id: crypto.randomUUID(),
      type: 'activity',
      label: selectedActivity,
      activityName: selectedActivity,
      activityMode: 'fitness',
      defaultDuration: activityDuration > 0 ? activityDuration : 30,
      defaultIntensity: 6,
    };
    await persistSequence([...sequence, newSlot], activeSequenceIndex);
  };

  const handleMoveSlot = async (idx: number, direction: -1 | 1) => {
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= sequence.length) return;
    const next = [...sequence];
    const [moved] = next.splice(idx, 1);
    next.splice(targetIdx, 0, moved);

    let nextActive = activeSequenceIndex;
    if (activeSequenceIndex === idx) nextActive = targetIdx;
    else if (activeSequenceIndex === targetIdx) nextActive = idx;

    await persistSequence(next, nextActive);
  };

  const handleRemoveSlot = async (idx: number) => {
    const next = sequence.filter((_, i) => i !== idx);
    let nextActive = activeSequenceIndex;
    if (next.length === 0) {
      nextActive = 0;
    } else if (idx < activeSequenceIndex) {
      nextActive = activeSequenceIndex - 1;
    } else if (activeSequenceIndex >= next.length) {
      nextActive = 0;
    }
    await persistSequence(next, nextActive);
  };

  const handleSaveTemplate = async (template: WorkoutTemplate) => {
    const normalized = normalizeWorkoutTemplate(template);
    let updatedTemplates = [...templates];
    if (view === 'edit') {
      updatedTemplates = updatedTemplates.map(t => t.id === normalized.id ? normalized : t);
    } else {
      updatedTemplates.push(normalized);
    }

    const updatedProfile = { ...userProfile, workoutTemplates: updatedTemplates };
    onUpdateProfile(updatedProfile);
    await updateProfile(updatedProfile);
    setView('list');
  };

  const handleDeleteTemplate = async (id: string) => {
    setDeletingTemplateId(id);
  };

  if (view === 'create' || view === 'edit') {
    return createPortal(
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
        <div className="bg-white w-full max-w-md h-[85vh] rounded-[32px] overflow-hidden shadow-2xl">
          <TemplateEditor
            onSave={handleSaveTemplate}
            onCancel={() => { setView('list'); setEditingTemplate(undefined); }}
            initialTemplate={editingTemplate}
          />
        </div>
      </div>,
      document.body
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-md max-h-[88vh] flex flex-col rounded-[32px] overflow-hidden shadow-2xl animate-scale-up">
        {/* Header + Tabs */}
        <div className="bg-indigo-600 p-5 pb-4 relative overflow-hidden flex-shrink-0">
          <div className="absolute inset-0 bg-[url('/assets/jungle_bg_pattern.webp')] opacity-10"></div>
          <div className="flex justify-between items-center relative z-10 mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white font-['Fredoka'] flex items-center">
              {activeTab === 'templates' ? <Library className="mr-2" size={22} /> : <ListOrdered className="mr-2" size={22} />}
              {activeTab === 'templates' ? 'Workout Library' : 'Mission Sequence'}
            </h2>
            <button
              onClick={onClose}
              aria-label="Close library"
              className="text-white/80 hover:text-white bg-white/10 p-2 rounded-full backdrop-blur-md transition-all active:scale-95"
            >
              <X size={22} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 relative z-10 bg-indigo-950/35 p-1 rounded-2xl border border-white/10">
            <button
              type="button"
              onClick={() => setActiveTab('templates')}
              className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'templates'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <Library size={14} /> My Templates
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('sequence')}
              className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'sequence'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <ListOrdered size={14} /> Mission Sequence
              {sequence.length > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                  activeTab === 'sequence' ? 'bg-indigo-100 text-indigo-700' : 'bg-white/20 text-white'
                }`}>
                  {sequence.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Body */}
        {activeTab === 'templates' ? (
          <div className="p-4 space-y-4 overflow-y-auto flex-1 bg-slate-50">
            <button
              onClick={() => { setEditingTemplate(undefined); setView('create'); }}
              className="w-full bg-white border-2 border-dashed border-indigo-200 rounded-2xl p-4 flex items-center justify-center text-indigo-500 font-bold hover:bg-indigo-50 hover:border-indigo-300 transition-all active:scale-95 group"
            >
              <div className="bg-indigo-100 p-2 rounded-full mr-2 group-hover:scale-110 transition-transform">
                <Plus size={20} />
              </div>
              Create New Template
            </button>

            {templates.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <p>No custom workouts yet.</p>
                <p className="text-xs">Create your own routine to mix things up!</p>
              </div>
            ) : (
              templates.map(template => (
                <div key={template.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 group hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-slate-800 text-base sm:text-lg leading-snug">{template.name}</h3>
                      {template.focus && (
                        <p className="text-[11px] font-semibold text-indigo-600/80 mt-0.5 line-clamp-1">{template.focus}</p>
                      )}
                    </div>
                    <div className="flex space-x-1 shrink-0">
                      <button
                        onClick={() => { setEditingTemplate(template); setView('edit'); }}
                        aria-label={`Edit ${template.name}`}
                        className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template.id)}
                        aria-label={`Delete ${template.name}`}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Warmup & Cooldown Pill Summary */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-100 px-2 py-0.5 rounded-full">
                      <Flame size={10} /> {template.warmup?.length || 0} Warm-Up
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-100 px-2 py-0.5 rounded-full">
                      <Wind size={10} /> {template.cooldown?.length || 0} Cool-Down
                    </span>
                  </div>

                  <div className="mb-4 space-y-2">
                    {template.exercises.slice(0, 3).map((ex, idx) => (
                      <div key={idx} className="text-xs text-slate-600 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <ExerciseThumbnail
                            name={ex.name}
                            customImage={ex.image}
                            visualArchetype={ex.visualArchetype}
                            equipment={ex.equipment}
                            size="xs"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-slate-800 truncate">{ex.name}</div>
                            <ExerciseBadgeRow
                              name={ex.name}
                              customImage={ex.image}
                              visualArchetype={ex.visualArchetype}
                              equipment={ex.equipment}
                              compact
                            />
                          </div>
                        </div>
                        <span className="font-mono font-bold text-slate-500 shrink-0">{ex.sets} × {ex.reps}</span>
                      </div>
                    ))}
                    {template.exercises.length > 3 && (
                      <div className="text-[10px] text-slate-400 italic">
                        + {template.exercises.length - 3} more exercises
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => onStartTemplate(template)}
                    className="w-full bg-indigo-500 text-white py-3 rounded-xl font-bold flex items-center justify-center hover:bg-indigo-600 active:scale-95 transition-all shadow-lg shadow-indigo-200"
                  >
                    <Play size={18} className="mr-2 fill-current" /> Start Workout
                  </button>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="p-4 space-y-5 overflow-y-auto flex-1 bg-slate-50">
            {/* Current Sequence Queue */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Your Rotating Schedule</h3>
                {sequence.length > 0 && (
                  <button
                    type="button"
                    onClick={() => persistSequence([], 0)}
                    className="text-[11px] font-bold text-slate-500 hover:text-red-600 flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw size={12} /> Reset to A ↔ B
                  </button>
                )}
              </div>

              {sequence.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-5 text-center space-y-1">
                  <p className="text-sm font-bold text-slate-700">Default Mode: Plan A ↔ Plan B</p>
                  <p className="text-xs text-slate-500">Add custom templates, base plans, or cardio activities below to build your own repeating Next Mission sequence.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sequence.map((slot, idx) => {
                    const isActive = idx === activeSequenceIndex;
                    return (
                      <div
                        key={slot.id}
                        className={`bg-white p-3 rounded-2xl border transition-all flex items-center justify-between gap-2 ${
                          isActive
                            ? 'border-indigo-400 ring-2 ring-indigo-100 shadow-sm'
                            : 'border-slate-200/80'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <span className={`w-6 h-6 rounded-full text-xs font-black flex items-center justify-center shrink-0 ${
                            isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {idx + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-800 text-sm truncate">{slot.label}</span>
                              {isActive && (
                                <span className="bg-indigo-100 text-indigo-700 text-[9px] font-black uppercase px-2 py-0.5 rounded-full shrink-0">
                                  Up Next
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-semibold">
                              {slot.type === 'activity'
                                ? `Activity • ${slot.defaultDuration || 30} mins`
                                : slot.type === 'custom_template'
                                ? 'Custom Template'
                                : 'Base Plan'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {!isActive && (
                            <button
                              type="button"
                              onClick={() => persistSequence(sequence, idx)}
                              title="Set as Next Mission"
                              aria-label={`Set ${slot.label} as next`}
                              className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"
                            >
                              <CheckCircle2 size={15} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleMoveSlot(idx, -1)}
                            disabled={idx === 0}
                            aria-label="Move slot up"
                            className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded-lg transition-colors"
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveSlot(idx, 1)}
                            disabled={idx === sequence.length - 1}
                            aria-label="Move slot down"
                            className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded-lg transition-colors"
                          >
                            <ArrowDown size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveSlot(idx)}
                            aria-label={`Remove ${slot.label}`}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Add Custom Templates */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 space-y-2.5">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Add Workout Template</h4>
              {templates.length === 0 ? (
                <p className="text-xs text-slate-400">Create a template in &ldquo;My Templates&rdquo; first, or add Base Plans below.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {templates.map(tpl => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => handleAddTemplateToSequence(tpl)}
                      className="text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/70 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all active:scale-95 text-left"
                    >
                      <Plus size={13} className="shrink-0" />
                      <span className="truncate max-w-[210px]">{tpl.name}</span>
                    </button>
                  ))}
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleAddBasePlanToSequence('plan_a')}
                  className="text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all active:scale-95"
                >
                  <Plus size={13} /> Plan A
                </button>
                <button
                  type="button"
                  onClick={() => handleAddBasePlanToSequence('plan_b')}
                  className="text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all active:scale-95"
                >
                  <Plus size={13} /> Plan B
                </button>
              </div>
            </div>

            {/* Add Cardio / Mobility Activity */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 space-y-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Activity size={13} className="text-emerald-600" /> Slot Cardio / Mobility Day
              </h4>
              <div className="grid grid-cols-3 gap-2">
                <select
                  aria-label="Select activity"
                  value={selectedActivity}
                  onChange={(e) => setSelectedActivity(e.target.value)}
                  className="col-span-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  {SEQUENCE_ACTIVITIES.map(act => (
                    <option key={act} value={act}>{act}</option>
                  ))}
                </select>
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2.5">
                  <input
                    aria-label="Duration in minutes"
                    type="number"
                    min={5}
                    max={240}
                    value={activityDuration}
                    onChange={(e) => setActivityDuration(parseInt(e.target.value, 10) || 30)}
                    className="w-full bg-transparent text-xs font-bold text-slate-700 focus:outline-none"
                  />
                  <span className="text-[11px] font-bold text-slate-400 ml-1">m</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddActivityToSequence}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm"
              >
                <Plus size={15} /> Add {selectedActivity} ({activityDuration}m) to Sequence
              </button>
            </div>
          </div>
        )}
      </div>
      <ConfirmPopup
        isOpen={deletingTemplateId !== null}
        title="Delete Template?"
        message="Are you sure you want to delete this workout template?"
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        onConfirm={async () => {
          if (deletingTemplateId) {
            const updatedTemplates = templates.filter(t => t.id !== deletingTemplateId);
            const updatedSequence = sequence.filter(s => s.templateId !== deletingTemplateId);
            const updatedProfile = {
              ...userProfile,
              workoutTemplates: updatedTemplates,
              goals: {
                ...(userProfile.goals || {}),
                ...(updatedSequence.length !== sequence.length ? { workoutSequence: updatedSequence, sequenceIndex: 0 } : {}),
              },
            };
            onUpdateProfile(updatedProfile);
            await updateProfile(updatedProfile);
          }
          setDeletingTemplateId(null);
        }}
        onCancel={() => setDeletingTemplateId(null)}
      />
    </div>,
    document.body
  );
};
