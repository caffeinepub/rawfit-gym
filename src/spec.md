# Specification

## Summary
**Goal:** Fix the member login authentication flow that is currently showing 'failed' errors when members attempt to log in with their membership ID.

**Planned changes:**
- Investigate and fix the member login authentication flow in both frontend and backend
- Add detailed error logging and diagnostics to capture why login attempts are failing
- Verify that the backend's validateMemberLogin method correctly queries member records and returns appropriate error responses
- Ensure the useMemberAuth hook properly validates membership IDs against the backend
- Update error messages to be specific and actionable instead of generic 'failed' status

**User-visible outcome:** Members can successfully log in using their membership ID with clear, actionable error messages if login fails for specific reasons (invalid ID, expired membership, etc.).
