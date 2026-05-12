## 2026-04-24 - Parallelized Profile Loading
**Learning:** Sequential await calls in initial application loading (like `loadProfile`) create significant cumulative latency, especially as the number of data points (logs, stats, gamification) grows. Reusing already fetched data (like the `logs` array) for multiple derived calculations (`mood`, `streak`, `streakRisk`) can eliminate multiple redundant database/network requests.
**Action:** Always look for independent async calls in lifecycle methods and group them with `Promise.all`. Ensure utility functions support passing pre-fetched data to avoid "Internal N+1" scenarios where multiple utilities fetch the same raw data.

## 2026-05-15 - Database Fetch Minimization
**Learning:** Selective column selection in Supabase queries (.select('col1, col2')) significantly reduces the JSON payload size, especially when dealing with large 'log_data' JSONB fields. For "all-at-once" feeds, server-side pagination (.range()) combined with selective fetching is the most effective way to improve TTF (Time to Feed).
**Action:** Default to selective fetching for list views. Use .select('*', { count: 'exact', head: true }) for counting instead of fetching full records.

## 2026-05-16 - Cache Alignment for Tribe Data
**Learning:** Standardizing the fetch parameters (like pageSize=100) across components that request the same tribe-wide data (SocialFeed, TribePulse, getTeamStats) enables effective request deduplication and ensures that subsequent component-specific requests (like getUserLogs) can be fulfilled entirely from the pre-warmed cache.
**Action:** Always identify common data fetch patterns and standardize their parameters to maximize cache utility and minimize redundant network round-trips.

## 2026-05-10 - Expensive Date Formatting in Loops
**Learning:** Using `toLocaleDateString()` or instantiating `Intl.DateTimeFormat` inside high-frequency loops (like data processing for charts) creates significant performance overhead due to repeated locale parsing and object creation.
**Action:** Always lift `Intl.DateTimeFormat` instantiations to the module level or memoize them when used in render-critical paths or data processing utilities.

## 2026-05-11 - Lazy Loading Auxiliary Components
**Learning:** Statically importing heavy auxiliary components (like 16+ blog pages and legal documents) into the main `App.tsx` creates a massive initial bundle that delays Time to Interactive (TTI) for the dashboard, even if those pages are never visited. Code-splitting these into separate chunks via `React.lazy` significantly reduces the entry payload.
**Action:** Always lazy-load components that are not part of the critical initial render path (e.g., blogs, secondary info pages, and even desktop-only widgets if they are heavy). Use `React.Suspense` to provide a smooth loading state for these asynchronous chunks.

## 2026-05-12 - App-wide Date Formatting Optimization
**Learning:** Centralizing `Intl.DateTimeFormat` objects in a utility file instead of calling `toLocaleDateString` or creating new `Intl` objects in component renders/loops significantly reduces CPU overhead and memory pressure. This is especially impactful in "data-heavy" components like Analytics, History, and Popups where many dates are formatted in a single pass.
**Action:** Always prefer shared, pre-instantiated formatters from `utils/dateUtils.ts` for consistent and high-performance date representation across the app.
