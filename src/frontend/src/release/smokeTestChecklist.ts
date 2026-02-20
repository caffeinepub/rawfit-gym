// Production smoke-test checklist for Version 37

export interface SmokeTestItem {
  id: string;
  category: 'admin' | 'member' | 'health';
  description: string;
  instructions: string;
}

export const SMOKE_TEST_CHECKLIST: SmokeTestItem[] = [
  // Health Check Tests
  {
    id: 'health-1',
    category: 'health',
    description: 'Backend health check succeeds',
    instructions: 'Verify that the backend reports "ok: true" and returns version v1.2.1',
  },
  {
    id: 'health-2',
    category: 'health',
    description: 'Frontend-backend connectivity',
    instructions: 'Confirm no connectivity errors appear during normal operation',
  },

  // Admin Flow Tests
  {
    id: 'admin-1',
    category: 'admin',
    description: 'Internet Identity login works',
    instructions: 'Click Admin Login → authenticate with Internet Identity → verify successful login',
  },
  {
    id: 'admin-2',
    category: 'admin',
    description: 'Admin dashboard loads',
    instructions: 'After login, verify the admin dashboard displays with all tabs visible',
  },
  {
    id: 'admin-3',
    category: 'admin',
    description: 'Pause request notification section visible',
    instructions: 'Navigate to Dashboard tab → verify "Pending Pause Requests" widget appears',
  },
  {
    id: 'admin-4',
    category: 'admin',
    description: 'Approve pause request',
    instructions: 'If pending requests exist, click Approve → add optional message → verify success',
  },
  {
    id: 'admin-5',
    category: 'admin',
    description: 'Deny pause request',
    instructions: 'If pending requests exist, click Deny → add optional message → verify success',
  },
  {
    id: 'admin-6',
    category: 'admin',
    description: 'Pause Requests tab loads',
    instructions: 'Click Pause Requests tab → verify pending and processed requests display correctly',
  },

  // Member Flow Tests
  {
    id: 'member-1',
    category: 'member',
    description: 'Membership ID login works',
    instructions: 'Click Member Login → enter valid membership ID → verify successful login',
  },
  {
    id: 'member-2',
    category: 'member',
    description: 'Member dashboard loads',
    instructions: 'After login, verify member dashboard displays with Dashboard and Video Library tabs',
  },
  {
    id: 'member-3',
    category: 'member',
    description: 'Membership status card displays correctly',
    instructions: 'Verify status card shows Active/Paused/Expired status with correct styling',
  },
  {
    id: 'member-4',
    category: 'member',
    description: 'Pause request status (pending)',
    instructions: 'If pause request pending, verify "Awaiting Admin Approval" message displays',
  },
  {
    id: 'member-5',
    category: 'member',
    description: 'Pause request status (denied)',
    instructions: 'If pause request denied, verify admin message displays with orange styling',
  },
  {
    id: 'member-6',
    category: 'member',
    description: 'Pause request status (paused)',
    instructions: 'If membership paused, verify "Paused" badge and Resume button display',
  },
  {
    id: 'member-7',
    category: 'member',
    description: 'Request pause functionality',
    instructions: 'For active membership, click "Request Pause" → verify success toast and pending status',
  },
  {
    id: 'member-8',
    category: 'member',
    description: 'Resume membership functionality',
    instructions: 'For paused membership, click "Resume Membership" → verify success and active status',
  },
];

export function getSmokeTestsByCategory(category: 'admin' | 'member' | 'health'): SmokeTestItem[] {
  return SMOKE_TEST_CHECKLIST.filter((test) => test.category === category);
}
