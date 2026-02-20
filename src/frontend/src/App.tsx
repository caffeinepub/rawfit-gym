import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile, useGetCallerUserRole, useBackendHealthCheck } from './hooks/useQueries';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import LoginSelectionPage from './pages/LoginSelectionPage';
import ProfileSetupModal from './components/ProfileSetupModal';
import AdminDashboard from './pages/AdminDashboard';
import MemberDashboard from './pages/MemberDashboard';
import AccessDeniedScreen from './components/AccessDeniedScreen';
import { Loader2 } from 'lucide-react';
import { useMemberAuth } from './hooks/useMemberAuth';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ProductionVersionNotice } from './components/ProductionVersionNotice';
import { SmokeTestOverlay } from './release/SmokeTestOverlay';

function AppContent() {
  const { identity, isInitializing, loginError } = useInternetIdentity();
  const { memberId: memberAuthId, isLoading: memberAuthLoading } = useMemberAuth();
  
  const isAdminAuthenticated = !!identity;
  const isMemberAuthenticated = !!memberAuthId;
  const isAuthenticated = isAdminAuthenticated || isMemberAuthenticated;

  // Only fetch admin profile/role when admin is authenticated (not for member-only sessions)
  const { data: userProfile, isLoading: profileLoading, isFetched: profileFetched } = useGetCallerUserProfile({
    enabled: isAdminAuthenticated,
  });
  const { data: userRole, isLoading: roleLoading } = useGetCallerUserRole({
    enabled: isAdminAuthenticated,
  });

  // Health check state for prolonged loading detection and smoke test overlay
  const [showHealthCheck, setShowHealthCheck] = useState(false);
  const { data: healthData, refetch: refetchHealth, isError: healthCheckError } = useBackendHealthCheck();

  // Smoke test overlay state (controlled by URL parameter)
  const [showSmokeTest, setShowSmokeTest] = useState(false);

  // Check URL for smoke test parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const smokeTestParam = params.get('smoketest');
    if (smokeTestParam === '1' || smokeTestParam === 'true') {
      setShowSmokeTest(true);
    }
  }, []);

  // Log authentication state for debugging
  useEffect(() => {
    console.log('App - Authentication state:', {
      isAdminAuthenticated,
      isMemberAuthenticated,
      isAuthenticated,
      isInitializing,
      memberAuthLoading,
      profileLoading,
      roleLoading,
      userRole,
      loginError: loginError?.message,
      healthData: healthData ? { version: healthData.version, ok: healthData.ok } : null,
    });
  }, [isAdminAuthenticated, isMemberAuthenticated, isAuthenticated, isInitializing, memberAuthLoading, profileLoading, roleLoading, userRole, loginError, healthData]);

  // Detect prolonged loading after admin authentication and trigger health check
  useEffect(() => {
    if (isAdminAuthenticated && (profileLoading || roleLoading)) {
      const timer = setTimeout(() => {
        console.log('App - Prolonged loading detected, triggering health check');
        setShowHealthCheck(true);
        refetchHealth();
      }, 8000); // 8 seconds threshold

      return () => clearTimeout(timer);
    } else {
      setShowHealthCheck(false);
    }
  }, [isAdminAuthenticated, profileLoading, roleLoading, refetchHealth]);

  // Show loading state during initialization
  if (isInitializing || memberAuthLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Starting RawFit Gym application...</p>
        </div>
      </div>
    );
  }

  // Show loading state while fetching admin user data after authentication
  if (isAdminAuthenticated && (profileLoading || roleLoading)) {
    // If health check triggered and backend is unreachable, show connectivity error
    if (showHealthCheck && (healthData === null || healthCheckError)) {
      return (
        <div className="flex h-screen items-center justify-center bg-background p-4">
          <div className="max-w-md w-full space-y-4">
            <Alert variant="destructive">
              <WifiOff className="h-4 w-4" />
              <AlertTitle>Unable to Connect to Server</AlertTitle>
              <AlertDescription>
                The backend server is not responding. This may be due to a deployment issue or network problem. Please reload the page to try again.
              </AlertDescription>
            </Alert>
            <div className="flex justify-center">
              <Button onClick={() => window.location.reload()} size="lg">
                <RefreshCw className="mr-2 h-4 w-4" />
                Reload
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Show login error if Internet Identity initialization failed
  if (loginError && !isAuthenticated) {
    console.error('App - Login error detected:', loginError);
    return (
      <div className="flex h-screen items-center justify-center bg-background p-4">
        <div className="max-w-md w-full space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Authentication Service Error</AlertTitle>
            <AlertDescription>
              {loginError.message || 'Failed to initialize authentication service. Please try again.'}
            </AlertDescription>
          </Alert>
          <div className="flex justify-center">
            <Button onClick={() => window.location.reload()} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Reload Application
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show login selection page if not authenticated
  if (!isAuthenticated) {
    return (
      <>
        <LoginSelectionPage />
        {/* Production version notice (only shows on mismatch) */}
        {healthData && (
          <div className="fixed bottom-4 right-4 max-w-md z-50">
            <ProductionVersionNotice reportedVersion={healthData.version} />
          </div>
        )}
        {/* Smoke test overlay */}
        <SmokeTestOverlay
          open={showSmokeTest}
          onClose={() => setShowSmokeTest(false)}
          healthData={healthData}
        />
      </>
    );
  }

  // Member-only authentication: bypass admin profile/role checks
  if (isMemberAuthenticated && !isAdminAuthenticated) {
    console.log('App - Member-only session detected, rendering MemberDashboard');
    return (
      <>
        <MemberDashboard />
        {/* Production version notice (only shows on mismatch) */}
        {healthData && (
          <div className="fixed bottom-4 right-4 max-w-md z-50">
            <ProductionVersionNotice reportedVersion={healthData.version} />
          </div>
        )}
        {/* Smoke test overlay */}
        <SmokeTestOverlay
          open={showSmokeTest}
          onClose={() => setShowSmokeTest(false)}
          healthData={healthData}
        />
      </>
    );
  }

  // Admin authentication flow: check profile setup and role
  if (isAdminAuthenticated) {
    // Show profile setup modal if admin doesn't have a profile
    const showProfileSetup = !profileLoading && profileFetched && userProfile === null;

    if (showProfileSetup) {
      return (
        <div className="flex h-screen items-center justify-center bg-background">
          <ProfileSetupModal open={true} />
        </div>
      );
    }

    // Show access denied for guests
    if (userRole === 'guest') {
      return <AccessDeniedScreen />;
    }

    // Render admin dashboard
    return (
      <>
        <AdminDashboard />
        {/* Production version notice (only shows on mismatch) */}
        {healthData && (
          <div className="fixed bottom-4 right-4 max-w-md z-50">
            <ProductionVersionNotice reportedVersion={healthData.version} />
          </div>
        )}
        {/* Smoke test overlay */}
        <SmokeTestOverlay
          open={showSmokeTest}
          onClose={() => setShowSmokeTest(false)}
          healthData={healthData}
        />
      </>
    );
  }

  // Fallback (should not reach here)
  return <LoginSelectionPage />;
}

export default function App() {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex h-screen items-center justify-center bg-background p-4">
          <div className="max-w-md w-full space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Application Error</AlertTitle>
              <AlertDescription>
                The application encountered an unexpected error. Please reload the page to try again.
              </AlertDescription>
            </Alert>
            <div className="flex justify-center">
              <Button onClick={() => window.location.reload()} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Reload Application
              </Button>
            </div>
          </div>
        </div>
      }
    >
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AppContent />
        <Toaster />
      </ThemeProvider>
    </ErrorBoundary>
  );
}
