# Specification

## Summary
**Goal:** Publish the currently deployed preview build (Version 36) to the live/production deployment so end users receive all implemented changes.

**Planned changes:**
- Promote the preview deployment (Version 36) to production, including any required backend canister upgrade/migration while preserving existing stored data.
- Run a production smoke-test for Admin and Member flows and fix any release-blocking issues found during verification.

**User-visible outcome:** The live/production URL matches the current preview (Version 36) UI and behavior, and Admin/Member experiences (including pause-request status, notifications, approvals/denials, and auto-expiry behavior) work correctly in production.
