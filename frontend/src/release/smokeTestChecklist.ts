// Production smoke-test checklist for Version 49 (Production Mainnet Deployment)
export interface SmokeTestItem {
  id: string;
  category: 'health' | 'admin' | 'member';
  description: string;
  checked: boolean;
}

export const smokeTestChecklist: SmokeTestItem[] = [
  // Health Checks
  {
    id: 'health-backend',
    category: 'health',
    description: 'Backend health check returns OK on mainnet',
    checked: false,
  },
  {
    id: 'health-version',
    category: 'health',
    description: 'Backend version matches expected (v1.4.9.0)',
    checked: false,
  },
  
  // Admin Flow
  {
    id: 'admin-login',
    category: 'admin',
    description: 'Admin can log in via Internet Identity (production)',
    checked: false,
  },
  {
    id: 'admin-dashboard',
    category: 'admin',
    description: 'Admin dashboard loads with all tabs',
    checked: false,
  },
  {
    id: 'admin-members',
    category: 'admin',
    description: 'Admin can view members list',
    checked: false,
  },
  {
    id: 'admin-pause-requests',
    category: 'admin',
    description: 'Admin can view and manage pause requests',
    checked: false,
  },
  {
    id: 'admin-qr-code',
    category: 'admin',
    description: 'Admin can generate gym QR code',
    checked: false,
  },
  {
    id: 'admin-videos',
    category: 'admin',
    description: 'Admin can access and manage video library',
    checked: false,
  },
  {
    id: 'admin-packages',
    category: 'admin',
    description: 'Admin can manage membership packages',
    checked: false,
  },
  
  // Member Flow
  {
    id: 'member-login',
    category: 'member',
    description: 'Member can log in with membership ID',
    checked: false,
  },
  {
    id: 'member-dashboard',
    category: 'member',
    description: 'Member dashboard loads correctly',
    checked: false,
  },
  {
    id: 'member-status',
    category: 'member',
    description: 'Member can view membership status',
    checked: false,
  },
  {
    id: 'member-pause',
    category: 'member',
    description: 'Member can initiate pause request',
    checked: false,
  },
  {
    id: 'member-resume',
    category: 'member',
    description: 'Member can resume paused membership',
    checked: false,
  },
  {
    id: 'member-qr-scan',
    category: 'member',
    description: 'Member can access QR attendance scanner',
    checked: false,
  },
  {
    id: 'member-videos',
    category: 'member',
    description: 'Member can access video library with GPS validation',
    checked: false,
  },
];

export function getCategoryProgress(category: 'health' | 'admin' | 'member', items: SmokeTestItem[]): {
  completed: number;
  total: number;
  percentage: number;
} {
  const categoryItems = items.filter(item => item.category === category);
  const completed = categoryItems.filter(item => item.checked).length;
  const total = categoryItems.length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  return { completed, total, percentage };
}

export function getOverallProgress(items: SmokeTestItem[]): {
  completed: number;
  total: number;
  percentage: number;
} {
  const completed = items.filter(item => item.checked).length;
  const total = items.length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  return { completed, total, percentage };
}
