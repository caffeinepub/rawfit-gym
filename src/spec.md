# Specification

## Summary
**Goal:** Add clear visibility and handling for membership pause requests, including member status indicators, admin dashboard notifications for pending requests, and automatic denial of requests left pending beyond 3 days.

**Planned changes:**
- Backend: Automatically mark pause requests older than 3 days in `pending` as `denied`, set `processedAt`, and set `adminMessage` to "Auto-rejected due to no admin action within 3 days" (only if no admin message already exists); ensure this expiry logic is applied whenever pause requests are read so UI queries always reflect the persisted auto-rejection.
- Frontend (Admin): Add a Notifications section on the existing admin dashboard showing pending pause requests with member ID, member name (if available), requested timestamp, and Approve/Deny quick actions; show an explicit empty state when none exist.
- Frontend (Member): Add a member-facing status area on the member dashboard that shows membership status and pause request status, including states for Active (no pending request), "Pause request pending approval" (and disable re-requesting), Paused (approved), and Denied (including auto-rejected) with admin message when present.

**User-visible outcome:** Members can see their current membership/pause-request status (including denial reasons), while admins can review and act on pending pause requests directly from the dashboard; pending requests with no admin action are automatically denied after 3 days and appear as processed rather than pending.
