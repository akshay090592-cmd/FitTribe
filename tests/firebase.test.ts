
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requestNotificationPermission } from '../services/firebase';
import { supabase } from '../utils/supabaseClient';

// Mock dependencies
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
}));

vi.mock('firebase/messaging', () => ({
  getMessaging: vi.fn(),
  getToken: vi.fn(),
  onMessage: vi.fn(),
}));

vi.mock('../utils/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  },
}));

vi.mock('../services/firebase', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    onMessageListener: vi.fn().mockImplementation((callback) => {
      // Simulate receiving a message immediately for testing purposes
      callback({ notification: { title: 'Test' } });
      // Return a dummy unsubscribe function
      return () => {};
    }),
  };
});

describe('Firebase Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should request notification permission', async () => {
    // Mock Notification API
    global.Notification = {
      requestPermission: vi.fn().mockResolvedValue('granted'),
    } as any;

    const { getToken } = await import('firebase/messaging');
    (getToken as any).mockResolvedValue('mock-fcm-token');

    await requestNotificationPermission('user-123');

    expect(Notification.requestPermission).toHaveBeenCalled();
    expect(getToken).toHaveBeenCalled();
    expect(supabase.from).toHaveBeenCalledWith('profiles');
  });

  it('should not get token if permission denied', async () => {
    global.Notification = {
      requestPermission: vi.fn().mockResolvedValue('denied'),
    } as any;

    const { getToken } = await import('firebase/messaging');

    await requestNotificationPermission('user-123');

    expect(Notification.requestPermission).toHaveBeenCalled();
    expect(getToken).not.toHaveBeenCalled();
  });
});
