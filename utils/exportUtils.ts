import { WorkoutLog } from '../types';
import { shortDateFormatter, formatWithCache } from './dateUtils';

/**
 * BOLT: Optimized convertToCSV export function.
 * - Uses `formatWithCache` with `shortDateFormatter` to eliminate costly `new Date()` allocations and
 *   locale formatting overhead on recurring date strings.
 * - Uses a pre-allocated array and manual index-based loop instead of `.map()` and `.join(',')`
 *   to eliminate lambda closure allocations and intermediate object initialization when exporting large datasets.
 */
export const convertToCSV = (logs: WorkoutLog[]): string => {
  if (!logs || logs.length === 0) {
    return '';
  }

  const headers = 'Date,Type,Duration (min),Calories,Exercises Count,Notes';
  const len = logs.length;
  const rows = new Array<string>(len + 1);
  rows[0] = headers;

  for (let i = 0; i < len; i++) {
    const log = logs[i];
    const date = formatWithCache(shortDateFormatter, log.date);
    const type = log.type;
    const duration = log.durationMinutes;
    const calories = log.calories || 0;
    const exercisesCount = log.exercises?.length || 0;
    const notes = log.customActivity || '';

    rows[i + 1] = `${date},${type},${duration},${calories},${exercisesCount},"${notes}"`;
  }

  return rows.join('\n');
};

export const downloadCSV = (csvContent: string, filename: string) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
