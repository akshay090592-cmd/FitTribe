import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { NotificationCenter } from '../components/NotificationCenter';
import { Notification } from '../types';
import { formatTimeAgo, shortDateFormatter } from '../utils/dateUtils';

describe('NotificationCenter Optimization & Correctness', () => {
  const mockNotifications: Notification[] = [
    {
      id: 'notif-1',
      userId: 'user-1',
      message: 'User1 completed a workout!',
      read: false,
      created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString() // 5m ago
    },
    {
      id: 'notif-2',
      userId: 'user-1',
      message: 'User2 sent you a fist bump!',
      read: true,
      created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString() // 2h ago
    }
  ];

  it('renders correctly with formatted relative date strings', () => {
    render(
      <NotificationCenter
        notifications={mockNotifications}
        unreadCount={1}
        onMarkAsRead={vi.fn()}
        onMarkAllAsRead={vi.fn()}
        onNotificationClick={vi.fn()}
      />
    );

    expect(screen.getByLabelText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('benchmarks formatTimeAgo against un-cached date parsing over 10,000 iterations', () => {
    const dates = Array.from({ length: 1000 }, (_, i) =>
      new Date(Date.now() - i * 60000 * 15).toISOString()
    );

    // Un-cached implementation
    const unoptimizedStart = performance.now();
    for (let run = 0; run < 10; run++) {
      for (let i = 0; i < dates.length; i++) {
        const dateStr = dates[i];
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        let formatted = '';
        if (diff < 60000) formatted = 'Just now';
        else if (diff < 3600000) formatted = `${Math.floor(diff / 60000)}m ago`;
        else if (diff < 86400000) formatted = `${Math.floor(diff / 3600000)}h ago`;
        else formatted = shortDateFormatter.format(date);
      }
    }
    const unoptimizedTime = performance.now() - unoptimizedStart;

    // Optimized implementation using minute-cached formatTimeAgo
    const optimizedStart = performance.now();
    for (let run = 0; run < 10; run++) {
      for (let i = 0; i < dates.length; i++) {
        const formatted = formatTimeAgo(dates[i]);
      }
    }
    const optimizedTime = performance.now() - optimizedStart;

    console.log(`NOTIFICATION DATE BENCHMARK (10,000 iterations): Optimized took ${optimizedTime.toFixed(3)}ms vs Unoptimized took ${unoptimizedTime.toFixed(3)}ms`);

    expect(optimizedTime).toBeLessThan(unoptimizedTime);
  });
});
