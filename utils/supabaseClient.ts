import { createClient } from '@supabase/supabase-js';

// Access environment variables safely for Vite
// Vite uses import.meta.env and requires variables to be prefixed with VITE_

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || process.env.SUPABASE_KEY || 'placeholder-key';

if (!import.meta.env.VITE_SUPABASE_URL && !process.env.SUPABASE_URL) {
  console.warn('Supabase URL is missing. Check your .env file or Netlify settings and ensure keys start with VITE_');
}

export const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_KEY || process.env.SUPABASE_KEY;
  return !!url && !!key && !url.includes('placeholder');
};

export const supabase = createClient(supabaseUrl, supabaseKey);

const lastSessionChecks = new Map<string, { timestamp: number; isValid: boolean }>();
const activeSessionPromises = new Map<string, Promise<boolean>>();
const SESSION_CACHE_TTL = 10000; // 10 seconds

/**
 * BOLT: Optimizes session validation by introducing a short-lived memory cache (10s TTL)
 * and concurrent request deduplication (thundering herd protection), keyed securely by userId.
 * Prevents cascading waterfalls of multiple sequential/concurrent calls to
 * `supabase.auth.getSession()` during atomic operations like saving a log (which
 * triggers 5-6 checks for profile, gamification logs, streaks, and stats).
 *
 * Performance: Reduces localStorage synchronous reads and network checks from O(C) to O(1)
 * during hot transactional paths, avoiding JWT verification and parsing overhead.
 */
export const isSessionValid = async (userId: string): Promise<boolean> => {
  if (!isSupabaseConfigured()) return true;

  // Security: Explicitly reject missing or empty userId
  if (!userId) {
    console.error("Unauthorized operation: Missing or empty userId");
    return false;
  }

  const now = Date.now();
  const cached = lastSessionChecks.get(userId);
  if (cached && now - cached.timestamp < SESSION_CACHE_TTL) {
    return cached.isValid;
  }

  // Deduplicate concurrent active promises for this specific userId (prevents cross-user pollution)
  let activePromise = activeSessionPromises.get(userId);
  if (activePromise) {
    return activePromise;
  }

  activePromise = (async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const sessionUserId = session?.user?.id;
      const isValid = !!sessionUserId && sessionUserId === userId;

      lastSessionChecks.set(userId, {
        timestamp: Date.now(),
        isValid
      });

      return isValid;
    } catch (e) {
      console.error("Error in session validation:", e);
      return false;
    } finally {
      activeSessionPromises.delete(userId);
    }
  })();

  activeSessionPromises.set(userId, activePromise);

  const isValid = await activePromise;

  // Security: Ensure session user ID exists and matches the provided userId
  if (!isValid) {
    console.error("Unauthorized operation: session user ID mismatch or missing session");
    return false;
  }

  return true;
};

/**
 * BOLT: Exported helper to manually clear the session validity cache (e.g. on logout/login).
 */
export const clearSessionValidationCache = () => {
  lastSessionChecks.clear();
  activeSessionPromises.clear();
};
