# Specification

## Summary
**Goal:** Fix the member login flow so that valid membership IDs successfully authenticate members and redirect them to the MemberDashboard.

**Planned changes:**
- Fix the backend `getMemberByMembershipId` query to correctly return member data for valid membership IDs and a clear null/error for invalid ones
- Fix the `useMemberAuth` hook to correctly handle both success and failure responses from the backend without throwing unhandled errors
- Fix the `MemberLoginPage` form submission to authenticate the member, persist auth state to localStorage, and navigate to the MemberDashboard on success
- Fix the `MemberDashboardGuard` in `App.tsx` to correctly read persisted localStorage auth state and allow access to the dashboard route
- Display an appropriate error message on the login page when the membership ID is not found

**User-visible outcome:** Members can log in with a valid membership ID, are redirected to the MemberDashboard, and their session persists across page refreshes. Invalid IDs show an error message without crashing the app.
