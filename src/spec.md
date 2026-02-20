# Specification

## Summary
**Goal:** Fix member login functionality for memberships that have been reactivated from paused status by an admin.

**Planned changes:**
- Update backend login validation to correctly recognize members with active status regardless of previous pause history
- Ensure frontend authentication clears cached state and fetches fresh membership status on each login attempt
- Verify admin membership status update flow properly persists changes and invalidates queries

**User-visible outcome:** Members whose memberships have been reactivated by an admin can successfully log in without encountering "contact gym" errors.
