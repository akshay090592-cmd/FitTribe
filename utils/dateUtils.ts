import { differenceInCalendarDays } from 'date-fns';

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
