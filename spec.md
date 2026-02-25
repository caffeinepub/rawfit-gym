# Specification

## Summary
**Goal:** Fix the member login authentication flow so that valid membership IDs successfully authenticate members and route them to the MemberDashboard.

**Planned changes:**
- Fix the membership ID validation call to the backend in MemberLoginPage
- Fix error handling and user-facing error messages on MemberLoginPage
- Fix the `useMemberAuth` hook's login function and localStorage persistence
- Fix the authentication state check in App.tsx to correctly render MemberDashboard or redirect to login
- Add a loading spinner to MemberLoginPage while the backend validation call is in progress
- Disable the submit button during an in-flight request to prevent duplicate submissions
- Display full error details (including backend error variants) on the login page when validation fails
- Ensure the backend `validateMember` (or equivalent) function returns correct results for active members

**User-visible outcome:** Members can log in with a valid membership ID and are taken to the MemberDashboard. Invalid IDs show a clear error message. Login state persists across page refreshes, and logging out returns the user to the login selection page.
