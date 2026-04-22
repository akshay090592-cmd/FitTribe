## 2025-05-15 - [Authorization & Data Isolation]
**Vulnerability:** Potential unauthorized cross-tribe data access and weak ownership verification.
**Learning:** Functions like `getLatestTribePhoto` could return data from any tribe if the ID was missing, and log operations relied heavily on RLS alone without application-level user ID verification.
**Prevention:** Always enforce tribe/user ID filters in database queries, even when RLS is present, as a defense-in-depth measure.

## 2025-05-20 - [Excessive Data Exposure in Profiles]
**Vulnerability:** Fetching the entire profile object (`select('*')`) for public/tribe member views exposed PII (Email, DOB, Physical stats).
**Learning:** Functions designed for public/tribe-wide display should use explicit column selection to minimize data transfer and protect user privacy.
**Prevention:** Use a whitelist-based `select()` in Supabase queries for profile-related data when fetching for anyone other than the account owner.

## 2025-05-25 - [IDOR in Social Interactions & Notifications]
**Vulnerability:** Users could potentially mark anyone's notifications as read or delete any user's reactions by guessing or obtaining internal IDs.
**Learning:** Object-level authorization must be enforced in the application layer by including the owner's `user_id` in all mutation queries (UPDATE/DELETE), even if Row Level Security (RLS) is expected to handle it.
**Prevention:** Always require a `userId` parameter in service functions that modify user-owned data and append a `.eq('user_id', userId)` filter to the Supabase query builder.

## 2026-04-13 - [Security Hardening: Randomness & Ownership]
**Vulnerability:** Predictable tribe codes using `Math.random()` and unauthorized deletion of non-tribe photos in `saveTribePhoto`.
**Learning:** Standard PRNGs are predictable and unsuitable for security-sensitive identifiers. Additionally, maintenance-style deletions (cleaning up old records) must always be scoped to the owner when a group-level filter (like `tribe_id`) is missing.
**Prevention:** Use `crypto.getRandomValues()` for all random string generation and enforce user ownership filters in all DELETE operations, even when cleaning up "global" or orphaned records.

## 2026-04-14 - [Centralized Authorization Utility]
**Pattern:** Reusable `isSessionValid` helper for defense-in-depth authorization.
**Learning:** To prevent IDOR and ensure data isolation across multiple service modules (Storage, Notifications, etc.) without circular dependencies, authorization logic should be centralized in a foundational module like `supabaseClient.ts`.
**Prevention:** Always use the centralized `isSessionValid` check at the start of any service function that performs user-specific data retrieval or modification.

## 2026-04-15 - [Session Hardening & Input Sanitization]
**Vulnerability:** Potential authorization bypass in `isSessionValid` due to loose equality/missing checks, and lack of length limits on user-provided strings.
**Learning:** Defense-in-depth requires explicit verification that both the target user ID and the session user ID are present before comparison, to avoid edge-case bypasses. Furthermore, all public-facing mutations should enforce strict length limits to prevent storage-based DoS.
**Prevention:** Always validate that session identifiers are non-falsy before performing ownership checks, and use whitelisted sanitization for all string inputs.

## 2026-04-16 - [Hardened Session Validation]
**Vulnerability:** Fail-open authorization logic in `isSessionValid` due to loose equality with `undefined`/`null`.
**Learning:** Comparing two missing values (e.g., `undefined === undefined`) can lead to unauthorized access in authorization helpers if input and session data are both absent.
**Prevention:** Always perform explicit truthiness checks on both the target ID and the session ID before performing a comparison in authorization logic.
