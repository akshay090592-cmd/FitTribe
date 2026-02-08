
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import React from 'react';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock scrollTo
window.HTMLElement.prototype.scrollTo = vi.fn();
window.scrollTo = vi.fn();

vi.mock('react-helmet-async', () => ({
  Helmet: ({ children }: any) => <>{children}</>,
  HelmetProvider: ({ children }: any) => <>{children}</>,
}));

// Mock dependencies
vi.mock('../utils/storage', () => ({
  getUserLogs: vi.fn().mockResolvedValue([]),
  getCurrentProfile: vi.fn().mockResolvedValue({ displayName: 'TestUser' }),
  createProfile: vi.fn(),
  saveLog: vi.fn(), addXPLog: vi.fn(), addPointLog: vi.fn(),
  getMood: vi.fn().mockResolvedValue('normal'),
  getTeamStats: vi.fn().mockResolvedValue({ userStats: {} }),
  getGamificationState: vi.fn().mockResolvedValue({}),
  getStreaks: vi.fn().mockResolvedValue(0),
  getStreakRisk: vi.fn().mockResolvedValue(false),
  updateUserCommitment: vi.fn(),
  updateProfile: vi.fn(),
  initSyncListener: vi.fn(),
  processOfflineQueue: vi.fn(),
  getOfflineQueue: vi.fn().mockReturnValue([]), // Added this mock
}));

vi.mock('../services/firebase', () => ({
  requestNotificationPermission: vi.fn(),
  onMessageListener: vi.fn().mockReturnValue(() => { }),
}));

vi.mock('../services/notificationService', () => ({
  notifyTribeOnActivity: vi.fn(),
  getUnreadNotifications: vi.fn().mockResolvedValue([]),
  markNotificationRead: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../utils/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(() => ({
      update: vi.fn(() => ({ eq: vi.fn() })),
    })),
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnValue({
        subscribe: vi.fn()
      })
    }),
    removeChannel: vi.fn(),
  },
  isSupabaseConfigured: vi.fn(() => true),
}));

vi.mock('../components/LoadingSpinner', () => ({
  LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>
}));

vi.mock('../components/NotificationPopup', () => ({
  NotificationPopup: ({ isOpen, title, body, onClose }: any) => (
    isOpen ? (
      <div data-testid="notification-popup">
        <h1>{title}</h1>
        <p>{body}</p>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null
  )
}));

// Mock Toast context
vi.mock('../components/Toast', () => ({
  useToast: () => ({ showToast: vi.fn() }),
  ToastProvider: ({ children }: any) => <div>{children}</div>
}));

vi.mock('../components/TribePulse', () => ({ TribePulse: () => <div>TribePulse</div> }));
vi.mock('../components/ReloadPrompt', () => ({ ReloadPrompt: () => <div>ReloadPrompt</div> }));

import App from '../App';

describe('Notification Handling', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.clearAllMocks();

    if (!navigator.serviceWorker) {
      Object.defineProperty(navigator, 'serviceWorker', {
        value: {
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        },
        writable: true
      });
    } else {
      navigator.serviceWorker.addEventListener = vi.fn();
      navigator.serviceWorker.removeEventListener = vi.fn();
    }
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: originalLocation
    });
  });

  it('shows notification popup when URL parameters are present (Cold Start)', async () => {
    const mockLocation = {
      ...originalLocation,
      search: '?notification_click=true&title=TestTitle&body=TestBody',
      pathname: '/',
      assign: vi.fn(),
      replace: vi.fn(),
      reload: vi.fn(),
    };

    delete (window as any).location;
    window.location = mockLocation as any;

    const replaceStateSpy = vi.spyOn(window.history, 'replaceState');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('notification-popup')).toBeInTheDocument();
    });

    expect(screen.getByText('TestTitle')).toBeInTheDocument();
    expect(screen.getByText('TestBody')).toBeInTheDocument();

    expect(replaceStateSpy).toHaveBeenCalled();
  });

  it('shows notification popup when Service Worker sends a message (Foreground/Background)', async () => {
    const mockLocation = {
      ...originalLocation,
      search: '',
    };
    delete (window as any).location;
    window.location = mockLocation as any;

    let messageHandler: (event: MessageEvent) => void = () => { };

    (navigator.serviceWorker.addEventListener as any).mockImplementation((event: string, handler: any) => {
      if (event === 'message') {
        messageHandler = handler;
      }
    });

    render(<App />);

    const messageEvent = new MessageEvent('message', {
      data: {
        type: 'NOTIFICATION_CLICK',
        payload: {
          title: 'SW Title',
          body: 'SW Body'
        }
      }
    });

    act(() => {
      messageHandler(messageEvent);
    });

    await waitFor(() => {
      expect(screen.getByTestId('notification-popup')).toBeInTheDocument();
    });

    expect(screen.getByText('SW Title')).toBeInTheDocument();
    expect(screen.getByText('SW Body')).toBeInTheDocument();
  });
});
