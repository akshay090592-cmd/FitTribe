import React, { useState, useMemo } from 'react';
import { WorkoutLog, WorkoutType } from '../types';
import { X, Dumbbell, Search, Filter, Download } from 'lucide-react';
import { convertToCSV, downloadCSV } from '../utils/exportUtils';
import { HistoryLogItem, ProcessedLog } from './HistoryLogItem';
import { monthDayFormatter } from '../utils/dateUtils';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: WorkoutLog[];
  onDelete: (logId: string) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, logs, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  /**
   * BOLT: Optimize HistoryModal by pre-processing logs once per data update.
   * This hoists expensive date formatting and searchable text generation out of the
   * filtering loop that runs on every keystroke.
   */
  const processedLogs = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();

    return logs.map((log): ProcessedLog & { searchableText: string } => {
      const activityName = log.customActivity?.toLowerCase() || '';
      const typeName = log.type?.toLowerCase() || '';

      return {
        ...log,
        isFailedCommitment: log.type === WorkoutType.COMMITMENT && Date.parse(log.date) < todayTimestamp,
        formattedDate: monthDayFormatter.format(new Date(log.date)),
        searchableText: `${activityName} ${typeName}`
      };
    });
    // NOTE: Removal of .sort() as logs are already provided in descending order from storage/parent.
  }, [logs]);

  const filteredLogs = useMemo(() => {
    const term = searchTerm.toLowerCase();

    return processedLogs.filter(log => {
      // Filter by Type
      if (filterType !== 'ALL' && log.type !== filterType) return false;

      // Filter by Search (using pre-generated searchableText)
      if (term && !log.searchableText.includes(term)) return false;

      return true;
    });
  }, [processedLogs, filterType, searchTerm]);

  const handleExport = () => {
    if (filteredLogs.length === 0) return;
    const csv = convertToCSV(filteredLogs);
    downloadCSV(csv, `workout_history_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const toggleExpand = (logId: string) => {
    setExpandedLogId(prev => prev === logId ? null : logId);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" data-testid="history-modal">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden max-h-[85vh] flex flex-col animate-scale-up">
        {/* Header */}
        <div className="bg-emerald-600 p-6 text-white shrink-0">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-bold font-['Fredoka']">Logbook</h2>
              <p className="text-emerald-100 text-sm font-medium opacity-90">{filteredLogs.length} Adventures</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleExport}
                className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                title="Export CSV"
                disabled={filteredLogs.length === 0}
              >
                <Download size={20} />
              </button>
              <button
                onClick={onClose}
                className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 text-emerald-700/50" size={16} />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/90 text-emerald-900 placeholder-emerald-700/50 text-sm font-bold rounded-xl py-2 pl-9 pr-3 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
            </div>
            <div className="relative">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="appearance-none bg-emerald-800/50 text-white text-xs font-bold py-2 pl-3 pr-8 rounded-xl border border-emerald-500/30 outline-none focus:ring-2 focus:ring-white/30 h-full"
              >
                <option value="ALL">All Types</option>
                <option value={WorkoutType.A}>Plan A</option>
                <option value={WorkoutType.B}>Plan B</option>
                <option value={WorkoutType.CUSTOM}>Custom</option>
                <option value={WorkoutType.COMMITMENT}>Commitment</option>
              </select>
              <Filter className="absolute right-2.5 top-2.5 text-emerald-300 pointer-events-none" size={12} />
            </div>
          </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto p-4 space-y-3 flex-1 bg-slate-50">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <Dumbbell size={48} className="mx-auto mb-4 opacity-50" />
              <p className="font-bold">No workouts found.</p>
              {searchTerm || filterType !== 'ALL' ? (
                <p className="text-sm">Try adjusting your filters.</p>
              ) : (
                <p className="text-sm">Time to get moving!</p>
              )}
            </div>
          ) : (
            filteredLogs.map((log) => (
              <HistoryLogItem
                key={log.id}
                log={log}
                isExpanded={expandedLogId === log.id}
                onToggleExpand={toggleExpand}
                onDelete={onDelete}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};
