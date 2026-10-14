import '@testing-library/jest-dom';

process.env.TZ = 'UTC';

const storeMap = new WeakMap<object, Record<string, string>>();

const getStore = (instance: object): Record<string, string> => {
  let s = storeMap.get(instance);
  if (!s) {
    s = {};
    storeMap.set(instance, s);
  }
  return s;
};

if (typeof Storage !== 'undefined') {
  Storage.prototype.getItem = function (key: string) {
    const store = getStore(this);
    return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
  };
  Storage.prototype.setItem = function (key: string, value: string) {
    const store = getStore(this);
    store[key] = String(value);
  };
  Storage.prototype.removeItem = function (key: string) {
    const store = getStore(this);
    delete store[key];
  };
  Storage.prototype.clear = function () {
    storeMap.set(this, {});
  };
  Storage.prototype.key = function (index: number) {
    const store = getStore(this);
    const keys = Object.keys(store);
    return keys[index] ?? null;
  };
  Object.defineProperty(Storage.prototype, 'length', {
    get() {
      return Object.keys(getStore(this)).length;
    },
    configurable: true,
  });
}

const createMemoryStorage = (): Storage => {
  return Object.create(typeof Storage !== 'undefined' ? Storage.prototype : Object.prototype);
};

const mockLocal = createMemoryStorage();
Object.defineProperty(globalThis, 'localStorage', { value: mockLocal, writable: true, configurable: true });
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', { value: mockLocal, writable: true, configurable: true });
}

const mockSession = createMemoryStorage();
Object.defineProperty(globalThis, 'sessionStorage', { value: mockSession, writable: true, configurable: true });
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'sessionStorage', { value: mockSession, writable: true, configurable: true });
}
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
    getApps: vi.fn().mockReturnValue([]),
    getApp: vi.fn().mockReturnValue({}),
}));

vi.mock('firebase/messaging', () => ({
    getMessaging: vi.fn().mockReturnValue({}),
    getToken: vi.fn().mockResolvedValue('mock-fcm-token'),
    onMessage: vi.fn().mockReturnValue(vi.fn()),
}));
