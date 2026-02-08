import React from 'react';
import { WorkoutLog, WorkoutType } from '../types';
import { Trash2, Calendar, Clock, Flame, Dumbbell, AlertTriangle, ChevronDown, ChevronUp, Heart } from 'lucide-react';

export interface ProcessedLog extends WorkoutLog {
  isFailedCommitment: boolean;
  formattedDate: string;
}

interface HistoryLogItemProps {
  log: ProcessedLog;
  isExpanded: boolean;
  onToggleExpand: (logId: string) => void;
  onDelete: (logId: string) => void;
}

export const HistoryLogItem = React.memo(({
  log,
  isExpanded,
  onToggleExpand,
  onDelete
}) => {
  return (
    <div
      data-testid={`log-item-${log.id}`}
      className={`bg-white border border-slate-100 rounded-2xl p-4 transition-all ${log.isFailedCommitment ? 'opacity-70 bg-red-50/30' : 'cursor-pointer hover:border-emerald-200 hover:shadow-md'}`}
      onClick={() => !log.isFailedCommitment && onToggleExpand(log.id)}
    >
      <div className="flex justify-between items-center group">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            {log.isFailedCommitment ? (
              <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full uppercase tracking-wide flex items-center">
                <AlertTriangle size={10} className="mr-1" /> Failed Commitment
              </span>
            ) : (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${log.type === WorkoutType.CUSTOM ? 'bg-purple-100 text-purple-700' :
                log.type === WorkoutType.COMMITMENT ? 'bg-amber-100 text-amber-700' :
                  'bg-emerald-100 text-emerald-700'
                }`}>
                {log.type}
              </span>
            )}
            <span className="text-xs font-bold text-slate-400 flex items-center">
              <Calendar size={12} className="mr-1" />
              {log.formattedDate}
            </span>
          </div>

          <div className="flex items-center space-x-3 text-slate-600 text-sm font-bold">
            <span className="flex items-center" title="Duration">
              <Clock size={14} className="mr-1 text-slate-400" />
              {log.durationMinutes}m
            </span>
            {log.vibes !== undefined && (
              <span className="flex items-center text-pink-500" title="Vibes">
                <Heart size={14} className="mr-1 fill-current" />
                {log.vibes}
              </span>
            )}
            {log.calories !== undefined && log.calories > 0 && (
              <span className="flex items-center text-orange-500" title="Calories">
                <Flame size={14} className="mr-1" />
                {log.calories}
              </span>
            )}
            {log.exercises?.length > 0 && (
              <span className="flex items-center text-slate-500">
                <Dumbbell size={14} className="mr-1" />
                {log.exercises.length}
              </span>
            )}
          </div>
          {log.customActivity && (
            <div className="text-xs text-slate-500 mt-1 italic line-clamp-1">
              "{log.customActivity}"
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {!log.isFailedCommitment && (
            <div className="text-slate-300">
              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm('Are you sure you want to delete this log? This cannot be undone.')) {
                onDelete(log.id);
              }
            }}
            className="w-10 h-10 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl flex items-center justify-center transition-all"
            title="Delete Log"
            aria-label={`Delete log from ${log.formattedDate}`}
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Expanded Details View */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-slate-100 animate-fade-in" data-testid={`log-details-${log.id}`}>
          {log.image_data && (
            <div className="mb-4 rounded-xl overflow-hidden border border-emerald-100 shadow-sm max-w-sm mx-auto">
              <img src={log.image_data} alt="Victory" className="w-full h-auto object-cover" />
            </div>
          )}
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Workout Details</h4>
          {log.exercises && log.exercises.length > 0 ? (
            <div className="space-y-3">
              {log.exercises.map((exercise, idx) => (
                <div key={`${log.id}-ex-${idx}`} className="bg-slate-50 rounded-xl p-3">
                  <div className="font-bold text-emerald-900 text-sm mb-1">{exercise.name}</div>
                  <div className="flex flex-wrap gap-2">
                    {exercise.sets.map((set, sIdx) => (
                      <div key={sIdx} className={`text-xs px-2 py-1 rounded border ${set.completed ? 'bg-white border-emerald-200 text-emerald-700' : 'bg-slate-100 border-slate-200 text-slate-400 line-through'}`}>
                        <span className="font-bold">{set.weight}kg</span> <span className="text-slate-400">x</span> <span className="font-bold">{set.reps}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-slate-500 italic bg-slate-50 p-3 rounded-xl text-center">
              No detailed exercise data recorded.
            </div>
          )}
        </div>
      )}
    </div>
  );
});
