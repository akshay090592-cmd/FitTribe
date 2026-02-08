import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', {
    value: vi.fn(),
    writable: true
});

// Global mock for Firebase to avoid "messaging/unsupported-browser" errors in JSDOM
vi.mock('../services/firebase', () => ({
    requestNotificationPermission: vi.fn().mockResolvedValue(undefined),
    onMessageListener: vi.fn(() => vi.fn(() => { })), // Returns an unsubscribe function
}));

// Mock firebase modules directly as they have top-level side effects
vi.mock('firebase/app', () => ({
    initializeApp: vi.fn().mockReturnValue({}),
}));

vi.mock('firebase/messaging', () => ({
    getMessaging: vi.fn().mockReturnValue({}),
    getToken: vi.fn().mockResolvedValue('mock-fcm-token'),
    onMessage: vi.fn().mockReturnValue(vi.fn()),
}));
