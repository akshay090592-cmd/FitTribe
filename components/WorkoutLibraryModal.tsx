import React, { useState } from 'react';
import { WorkoutTemplate, UserProfile } from '../types';
import { TemplateEditor } from './TemplateEditor';
import { updateProfile } from '../utils/storage';
import { X, Plus, Play, Edit, Trash2, Library } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile | null;
  onStartTemplate: (template: WorkoutTemplate) => void;
  onUpdateProfile: (profile: UserProfile) => void;
}

export const WorkoutLibraryModal: React.FC<Props> = ({ isOpen, onClose, userProfile, onStartTemplate, onUpdateProfile }) => {
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  const [editingTemplate, setEditingTemplate] = useState<WorkoutTemplate | undefined>(undefined);

  if (!isOpen || !userProfile) return null;

  const templates = userProfile.workoutTemplates || [];

  const handleSaveTemplate = async (template: WorkoutTemplate) => {
    let updatedTemplates = [...templates];
    if (view === 'edit') {
      updatedTemplates = updatedTemplates.map(t => t.id === template.id ? template : t);
    } else {
      updatedTemplates.push(template);
    }

    const updatedProfile = { ...userProfile, workoutTemplates: updatedTemplates };
    onUpdateProfile(updatedProfile);
    await updateProfile(updatedProfile);
    setView('list');
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Delete this workout template?")) return;
    const updatedTemplates = templates.filter(t => t.id !== id);
    const updatedProfile = { ...userProfile, workoutTemplates: updatedTemplates };
    onUpdateProfile(updatedProfile);
    await updateProfile(updatedProfile);
  };

  if (view === 'create' || view === 'edit') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
        <div className="bg-white w-full max-w-md h-[80vh] rounded-[32px] overflow-hidden shadow-2xl">
          <TemplateEditor
            onSave={handleSaveTemplate}
            onCancel={() => { setView('list'); setEditingTemplate(undefined); }}
            initialTemplate={editingTemplate}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-md max-h-[85vh] flex flex-col rounded-[32px] overflow-hidden shadow-2xl animate-scale-up">
        {/* Header */}
        <div className="bg-indigo-600 p-6 flex justify-between items-center relative overflow-hidden flex-shrink-0">
          <div className="absolute inset-0 bg-[url('/assets/jungle_bg_pattern.webp')] opacity-10"></div>
          <h2 className="text-2xl font-bold text-white font-['Fredoka'] relative z-10 flex items-center">
            <Library className="mr-2" /> Workout Library
          </h2>
          <button onClick={onClose} className="text-white/80 hover:text-white bg-white/10 p-2 rounded-full backdrop-blur-md transition-all active:scale-95 relative z-10">
            <X size={24} />
          </button>
        </div>

        {/* List */}
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
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-slate-800 text-lg">{template.name}</h3>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => { setEditingTemplate(template); setView('edit'); }}
                      className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="mb-4 space-y-1">
                  {template.exercises.slice(0, 3).map((ex, idx) => (
                    <div key={idx} className="text-xs text-slate-500 flex justify-between">
                      <span>• {ex.name}</span>
                      <span className="font-mono">{ex.sets} x {ex.reps}</span>
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
      </div>
    </div>
  );
};
