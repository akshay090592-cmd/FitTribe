import { WorkoutLog } from '../types';

export const convertToCSV = (logs: WorkoutLog[]): string => {
  if (!logs || logs.length === 0) {
    return '';
  }

  const headers = ['Date', 'Type', 'Duration (min)', 'Calories', 'Exercises Count', 'Notes'];
  const rows = logs.map(log => {
    const date = new Date(log.date).toLocaleDateString();
    const type = log.type;
    const duration = log.durationMinutes;
    const calories = log.calories || 0;
    const exercisesCount = log.exercises?.length || 0;
    const notes = log.customActivity || '';

    return [date, type, duration, calories, exercisesCount, `"${notes}"`].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
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
