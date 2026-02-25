import React, { useEffect, useState } from 'react';
import { RouterProvider, createRouter, createRoute, createRootRoute, Outlet, redirect } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';

import LoginSelectionPage from './pages/LoginSelectionPage';
import AdminLoginPage from './pages/AdminLoginPage';
import MemberLoginPage from './pages/MemberLoginPage';
import AdminDashboard from './pages/AdminDashboard';
import MemberDashboard from './pages/MemberDashboard';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useMemberAuth } from './hooks/useMemberAuth';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

// ─── Route guards ─────────────────────────────────────────────────────────────

function getMemberAuthId(): string | null {
  try {
    return localStorage.getItem('memberAuth_memberId');
  } catch {
    return null;
  }
}

// ─── Layout wrapper (provides hooks to child routes) ─────────────────────────

function RootLayout() {
  return <Outlet />;
}

// ─── Page wrappers that use auth hooks ───────────────────────────────────────

function AdminDashboardGuard() {
  const { identity } = useInternetIdentity();
  if (!identity) {
    window.location.replace('/#/admin-login');
    return null;
  }
  return <AdminDashboard />;
}

function MemberDashboardGuard() {
  const { memberId } = useMemberAuth();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setChecked(true);
  }, []);

  if (!checked) return null;

  if (!memberId) {
    window.location.replace('/#/member-login');
    return null;
  }

  return <MemberDashboard />;
}

// ─── Router ───────────────────────────────────────────────────────────────────

const rootRoute = createRootRoute({ component: RootLayout });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: LoginSelectionPage,
});

const adminLoginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin-login',
  component: AdminLoginPage,
});

const memberLoginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/member-login',
  component: MemberLoginPage,
});

const adminDashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin-dashboard',
  component: AdminDashboardGuard,
});

const memberDashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/member-dashboard',
  component: MemberDashboardGuard,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  adminLoginRoute,
  memberLoginRoute,
  adminDashboardRoute,
  memberDashboardRoute,
]);

const router = createRouter({ routeTree });

// ─── App ──────────────────────────────────────────────────────────────────────

function AppInner() {
  const { identity, isInitializing } = useInternetIdentity();
  const { memberId } = useMemberAuth();

  // Auto-redirect authenticated users away from login pages
  useEffect(() => {
    if (isInitializing) return;
    const path = window.location.hash.replace('#', '') || '/';

    if (identity && (path === '/' || path === '/admin-login')) {
      router.navigate({ to: '/admin-dashboard' });
    } else if (memberId && (path === '/' || path === '/member-login')) {
      router.navigate({ to: '/member-dashboard' });
    }
  }, [identity, memberId, isInitializing]);

  return <RouterProvider router={router} />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <AppInner />
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
