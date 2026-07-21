import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest';

let isSessionValid: any;
let clearSessionValidationCache: any;
let supabase: any;

beforeAll(async () => {
  // Set environment variables before dynamically importing supabaseClient
  process.env.SUPABASE_URL = 'https://valid-project.supabase.co';
  process.env.SUPABASE_KEY = 'some-valid-jwt-key';

  const module = await import('../utils/supabaseClient');
  isSessionValid = module.isSessionValid;
  clearSessionValidationCache = module.clearSessionValidationCache;
  supabase = module.supabase;
});

describe('isSessionValid Cache and Performance Optimization', () => {
  let getSessionSpy: any;

  beforeEach(() => {
    vi.useFakeTimers();
    clearSessionValidationCache();
    // Spy directly on the exported supabase instance's auth.getSession
    getSessionSpy = vi.spyOn(supabase.auth, 'getSession');
  });

  afterEach(() => {
    vi.useRealTimers();
    getSessionSpy.mockRestore();
  });

  it('should call getSession exactly once for multiple sequential checks within TTL', async () => {
    getSessionSpy.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    } as any);

    // First call - should hit Supabase
    const check1 = await isSessionValid('user-1');
    expect(check1).toBe(true);
    expect(getSessionSpy).toHaveBeenCalledTimes(1);

    // Second call (immediate) - should hit cache
    const check2 = await isSessionValid('user-1');
    expect(check2).toBe(true);
    expect(getSessionSpy).toHaveBeenCalledTimes(1);

    // Third call after 5 seconds - should still hit cache
    vi.advanceTimersByTime(5000);
    const check3 = await isSessionValid('user-1');
    expect(check3).toBe(true);
    expect(getSessionSpy).toHaveBeenCalledTimes(1);
  });

  it('should call getSession exactly once for multiple concurrent checks (thundering herd)', async () => {
    getSessionSpy.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    } as any);

    // Trigger concurrent checks
    const [check1, check2, check3] = await Promise.all([
      isSessionValid('user-1'),
      isSessionValid('user-1'),
      isSessionValid('user-1'),
    ]);

    expect(check1).toBe(true);
    expect(check2).toBe(true);
    expect(check3).toBe(true);
    expect(getSessionSpy).toHaveBeenCalledTimes(1);
  });

  it('should hit Supabase again after TTL (10 seconds) expires', async () => {
    getSessionSpy.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    } as any);

    // First call - should hit Supabase
    const check1 = await isSessionValid('user-1');
    expect(check1).toBe(true);
    expect(getSessionSpy).toHaveBeenCalledTimes(1);

    // Advance past TTL (10001 ms)
    vi.advanceTimersByTime(10001);

    // Second call - should hit Supabase again
    const check2 = await isSessionValid('user-1');
    expect(check2).toBe(true);
    expect(getSessionSpy).toHaveBeenCalledTimes(2);
  });

  it('should bypass cache and call getSession for a different user ID', async () => {
    getSessionSpy.mockResolvedValueOnce({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    } as any).mockResolvedValueOnce({
      data: { session: { user: { id: 'user-2' } } },
      error: null,
    } as any);

    // Check user-1
    const check1 = await isSessionValid('user-1');
    expect(check1).toBe(true);
    expect(getSessionSpy).toHaveBeenCalledTimes(1);

    // Check user-2 (different ID, should bypass cache and call getSession)
    const check2 = await isSessionValid('user-2');
    expect(check2).toBe(true);
    expect(getSessionSpy).toHaveBeenCalledTimes(2);
  });

  it('should clear cache and hit Supabase again when clearSessionValidationCache is called', async () => {
    getSessionSpy.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    } as any);

    // First call - should hit Supabase
    const check1 = await isSessionValid('user-1');
    expect(check1).toBe(true);
    expect(getSessionSpy).toHaveBeenCalledTimes(1);

    // Clear cache
    clearSessionValidationCache();

    // Second call (immediate) - should hit Supabase again
    const check2 = await isSessionValid('user-1');
    expect(check2).toBe(true);
    expect(getSessionSpy).toHaveBeenCalledTimes(2);
  });

  it('should reject and cache negative result if user IDs mismatch', async () => {
    getSessionSpy.mockResolvedValue({
      data: { session: { user: { id: 'user-different' } } },
      error: null,
    } as any);

    // Suppress console.error output during mock test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // First call - fails and is cached as invalid
    const check1 = await isSessionValid('user-1');
    expect(check1).toBe(false);
    expect(getSessionSpy).toHaveBeenCalledTimes(1);

    // Second call (immediate) - returns cached invalid result without calling Supabase
    const check2 = await isSessionValid('user-1');
    expect(check2).toBe(false);
    expect(getSessionSpy).toHaveBeenCalledTimes(1);

    consoleSpy.mockRestore();
  });

  it('should completely isolate session states for different user IDs (no cross-user pollution)', async () => {
    getSessionSpy.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
      error: null,
    } as any);

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Concurrent check for user-1 (valid) and user-2 (invalid because session resolves to user-1)
    const [check1, check2] = await Promise.all([
      isSessionValid('user-1'),
      isSessionValid('user-2'),
    ]);

    expect(check1).toBe(true);
    expect(check2).toBe(false); // User-2 check should fail because getSession returns user-1

    // Should call getSession exactly 2 times (once per user ID) because they are fully isolated!
    expect(getSessionSpy).toHaveBeenCalledTimes(2);

    consoleSpy.mockRestore();
  });
});
