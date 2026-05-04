## 2026-04-24 - Parallelized Profile Loading
**Learning:** Sequential await calls in initial application loading (like `loadProfile`) create significant cumulative latency, especially as the number of data points (logs, stats, gamification) grows. Reusing already fetched data (like the `logs` array) for multiple derived calculations (`mood`, `streak`, `streakRisk`) can eliminate multiple redundant database/network requests.
**Action:** Always look for independent async calls in lifecycle methods and group them with `Promise.all`. Ensure utility functions support passing pre-fetched data to avoid "Internal N+1" scenarios where multiple utilities fetch the same raw data.

## 2026-05-15 - Database Fetch Minimization
**Learning:** Selective column selection in Supabase queries (.select('col1, col2')) significantly reduces the JSON payload size, especially when dealing with large 'log_data' JSONB fields. For "all-at-once" feeds, server-side pagination (.range()) combined with selective fetching is the most effective way to improve TTF (Time to Feed).
**Action:** Default to selective fetching for list views. Use .select('*', { count: 'exact', head: true }) for counting instead of fetching full records.

## 2026-05-16 - Cache Alignment for Tribe Data
**Learning:** Standardizing the fetch parameters (like pageSize=100) across components that request the same tribe-wide data (SocialFeed, TribePulse, getTeamStats) enables effective request deduplication and ensures that subsequent component-specific requests (like getUserLogs) can be fulfilled entirely from the pre-warmed cache.
**Action:** Always identify common data fetch patterns and standardize their parameters to maximize cache utility and minimize redundant network round-trips.
