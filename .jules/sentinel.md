## 2025-05-15 - [Authorization & Data Isolation]
**Vulnerability:** Potential unauthorized cross-tribe data access and weak ownership verification.
**Learning:** Functions like `getLatestTribePhoto` could return data from any tribe if the ID was missing, and log operations relied heavily on RLS alone without application-level user ID verification.
**Prevention:** Always enforce tribe/user ID filters in database queries, even when RLS is present, as a defense-in-depth measure.
