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
