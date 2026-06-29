import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { WorkoutLog } from '../types';
import { monthLongYearFormatter } from '../utils/dateUtils';

interface Props {
    logs: WorkoutLog[];
}

export const Calendar: React.FC<Props> = ({ logs }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const { daysInMonth, startDay, monthLabel, workoutDays } = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        // Days in current month
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Day of week the month starts on (0 = Sunday)
        const startDay = new Date(year, month, 1).getDay();

        const monthLabel = monthLongYearFormatter.format(currentDate);

        // BOLT: Optimized identifying workout days using a single-pass loop with an early break.
        // Since logs are sorted DESC, we stop processing once we hit logs older than the current month.
        // We also skip expensive Date instantiations for logs far in the future (newer months).
        const workoutDays = new Set<number>();

        // Boundaries with 48h buffer for timezone safety
        const lowerBound = new Date(year, month, 1, 0, 0, 0);
        lowerBound.setHours(lowerBound.getHours() - 48);
        const lowerBoundISO = lowerBound.toISOString();

        const upperBound = new Date(year, month + 1, 0, 23, 59, 59);
        upperBound.setHours(upperBound.getHours() + 48);
        const upperBoundISO = upperBound.toISOString();

        for (let i = 0; i < logs.length; i++) {
            const log = logs[i];
            // Early break: logs are sorted DESC
            if (log.date < lowerBoundISO) break;
            // Skip logs far in the future
            if (log.date > upperBoundISO) continue;

            const logDate = new Date(log.date);
            if (logDate.getFullYear() === year && logDate.getMonth() === month) {
                workoutDays.add(logDate.getDate());
            }
        }

        return { daysInMonth, startDay, monthLabel, workoutDays };
    }, [currentDate, logs]);

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    // Generate calendar grid
    const days = [];
    // Empty cells for days before start of month
    for (let i = 0; i < startDay; i++) {
        days.push(<div key={`empty-${i}`} className="h-8 w-8"></div>);
    }
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const hasWorkout = workoutDays.has(day);
        days.push(
            <div key={day} className="h-8 w-8 flex items-center justify-center relative">
                <span className={`text-xs font-medium z-10 ${hasWorkout ? 'text-white' : 'text-slate-600'}`}>
                    {day}
                </span>
                {hasWorkout && (
                    <div className="absolute inset-0 bg-emerald-500 rounded-full shadow-sm animate-scale-up"></div>
                )}
            </div>
        );
    }

    const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-600 flex items-center">
                    <CalendarIcon size={16} className="mr-2 text-emerald-500" />
                    Workout History
                </h3>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={handlePrevMonth}
                        className="p-1 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <span className="text-sm font-bold text-slate-700 min-w-[100px] text-center">
                        {monthLabel}
                    </span>
                    <button
                        onClick={handleNextMonth}
                        className="p-1 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {weekDays.map(d => (
                    <div key={d} className="text-[10px] font-bold text-slate-400 uppercase">
                        {d}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1 place-items-center">
                {days}
            </div>

            <div className="mt-3 flex items-center justify-center text-xs text-slate-400">
                <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
                Workout Day
            </div>
        </div>
    );
};
