import { RouterProvider, createRouter, createRoute, createRootRoute, Outlet, redirect } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import LoginSelectionPage from './pages/LoginSelectionPage';
import AdminLoginPage from './pages/AdminLoginPage';
import MemberLoginPage from './pages/MemberLoginPage';
import AdminDashboard from './pages/AdminDashboard';
import MemberDashboard from './pages/MemberDashboard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000,
    },
  },
});

// ── Auth helpers ──────────────────────────────────────────────────────────────

function getMemberAuthFromStorage(): { isAuthenticated: boolean; memberId: string | null } {
  try {
    const raw = localStorage.getItem('memberAuth');
    if (!raw) return { isAuthenticated: false, memberId: null };
    const parsed = JSON.parse(raw);
    if (parsed.isAuthenticated && parsed.memberId) {
      return { isAuthenticated: true, memberId: parsed.memberId };
    }
  } catch {
    // ignore
  }
  return { isAuthenticated: false, memberId: null };
}

// ── Root layout ───────────────────────────────────────────────────────────────

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

// ── Routes ────────────────────────────────────────────────────────────────────

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: LoginSelectionPage,
});

const memberLoginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/member-login',
  component: MemberLoginPage,
});

const adminLoginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin-login',
  component: AdminLoginPage,
});

const memberDashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/member-dashboard',
  beforeLoad: () => {
    const { isAuthenticated } = getMemberAuthFromStorage();
    if (!isAuthenticated) {
      throw redirect({ to: '/member-login' });
    }
  },
  component: MemberDashboard,
});

const adminDashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin-dashboard',
  component: AdminDashboard,
});

// ── Router ────────────────────────────────────────────────────────────────────

const routeTree = rootRoute.addChildren([
  indexRoute,
  memberLoginRoute,
  adminLoginRoute,
  memberDashboardRoute,
  adminDashboardRoute,
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <RouterProvider router={router} />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
