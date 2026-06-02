import { differenceInCalendarDays } from 'date-fns';

/**
 * BOLT: Pre-instantiate formatters to avoid high overhead of repeated locale parsing
 * and object creation in high-frequency loops.
 */
export const monthDayFormatter = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });
export const monthYearFormatter = new Intl.DateTimeFormat(undefined, { month: 'short', year: '2-digit' });
export const monthLongFormatter = new Intl.DateTimeFormat(undefined, { month: 'long' });
export const monthLongYearFormatter = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' });
export const weekdayShortFormatter = new Intl.DateTimeFormat(undefined, { weekday: 'short' });
export const weekdayLongFormatter = new Intl.DateTimeFormat(undefined, { weekday: 'long' });
export const shortDateFormatter = new Intl.DateTimeFormat(undefined); // Default toLocaleDateString behavior

/**
 * BOLT: High-performance string-based comparison for ISO-8601 date strings.
 * Significantly faster than localeCompare for sorting and range checks.
 * Returns: 1 if a > b, -1 if a < b, 0 if equal.
 */
export const compareISODates = (a: string, b: string): number => {
    if (a > b) return 1;
    if (a < b) return -1;
    return 0;
};

/**
 * Formats a date string into a relative time string (e.g., "Just now", "2h ago", "Yesterday", "2d ago").
 * Uses calendar days for "Yesterday" and "Xd ago" to ensure consistency with the calendar view
 * and avoid timezone/time-of-day confusion.
 */
export const formatTimeAgo = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();

    // Use calendar days to determine "Yesterday" and "d ago"
    const diffDays = differenceInCalendarDays(now, date);

    if (diffDays === 0) {
        const diffMs = now.getTime() - date.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

        if (diffHours === 0) {
            const diffMins = Math.floor(diffMs / (1000 * 60));
            if (diffMins === 0) return 'Just now';
            return `${diffMins}m ago`;
        }
        return `${diffHours}h ago`;
    }

    if (diffDays === 1) {
        return 'Yesterday';
    }

    return `${diffDays}d ago`;
};
