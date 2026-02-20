import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, ArrowLeft, AlertCircle, RefreshCw, WifiOff } from 'lucide-react';
import { useMemberLogin } from '../hooks/useMemberAuth';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useBackendHealthCheck } from '../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';

interface MemberLoginPageProps {
  onBack: () => void;
}

function MemberLoginContent({ onBack }: MemberLoginPageProps) {
  const [membershipId, setMembershipId] = useState('');
  const { login, isLoading, error } = useMemberLogin();
  const queryClient = useQueryClient();
  const [isRetrying, setIsRetrying] = useState(false);
  const [failureCount, setFailureCount] = useState(0);
  const [showHealthCheck, setShowHealthCheck] = useState(false);
  const { data: healthData, refetch: refetchHealth } = useBackendHealthCheck();

  // Log errors for debugging
  useEffect(() => {
    if (error) {
      console.error('MemberLoginPage - Login error:', error);
      setFailureCount((prev) => prev + 1);
    }
  }, [error]);

  // Trigger health check after multiple failures
  useEffect(() => {
    if (failureCount >= 2 && error) {
      console.log('MemberLoginPage - Multiple failures detected, triggering health check');
      setShowHealthCheck(true);
      refetchHealth();
    }
  }, [failureCount, error, refetchHealth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (membershipId.trim()) {
      console.log('MemberLoginPage - Attempting login with ID:', membershipId.trim());
      // Clear any cached data before login attempt
      await queryClient.invalidateQueries({ queryKey: ['memberProfile', membershipId.trim()] });
      await login(membershipId.trim());
    }
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    console.log('MemberLoginPage - Retrying login...');
    // Clear cached data before retry
    if (membershipId.trim()) {
      await queryClient.invalidateQueries({ queryKey: ['memberProfile', membershipId.trim()] });
    }
    // Small delay to show retry state
    setTimeout(async () => {
      if (membershipId.trim()) {
        await login(membershipId.trim());
      }
      setIsRetrying(false);
    }, 300);
  };

  const handleReload = () => {
    window.location.reload();
  };

  // Determine if error is a server/connection error or a validation error
  const isServerError = error?.includes('Server unavailable') || error?.includes('connection');
  const isBackendUnreachable = showHealthCheck && healthData === null;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-accent/10">
      {/* Hero Section */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
          {/* Left Side - Branding */}
          <div className="text-center lg:text-left space-y-6">
            <Button variant="ghost" onClick={onBack} className="mb-4" disabled={isLoading || isRetrying}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login Options
            </Button>
            <div className="flex flex-col items-center lg:items-start gap-4">
              <div className="flex items-center gap-3">
                <img 
                  src="/assets/generated/rawfit-gym-logo-transparent.dim_200x200.png" 
                  alt="RawFit Gym Logo" 
                  className="h-16 w-16 object-contain"
                />
                <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  RawFit Gym
                </h1>
              </div>
              <p className="text-2xl font-semibold text-primary">
                Think Fit, Be Fit
              </p>
            </div>
            <p className="text-xl text-muted-foreground max-w-md mx-auto lg:mx-0">
              Access your personalized fitness dashboard. View your diet plans, workout routines, and track your progress.
            </p>
            <div className="hidden lg:block">
              <img
                src="/assets/generated/gym-hero-image.dim_1200x600.jpg"
                alt="RawFit Gym"
                className="rounded-2xl shadow-2xl border border-border"
              />
            </div>
          </div>

          {/* Right Side - Login Card */}
          <div className="flex justify-center">
            <Card className="w-full max-w-md shadow-xl">
              <CardHeader className="space-y-3">
                <CardTitle className="text-3xl text-center">Member Login</CardTitle>
                <CardDescription className="text-center text-base">
                  Enter your membership ID to access your dashboard
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="membershipId">Membership ID</Label>
                    <Input
                      id="membershipId"
                      placeholder="Enter your membership ID"
                      value={membershipId}
                      onChange={(e) => setMembershipId(e.target.value)}
                      required
                      disabled={isLoading || isRetrying}
                      className="h-12 text-base"
                      autoComplete="off"
                    />
                  </div>

                  {error && isBackendUnreachable && (
                    <Alert variant="destructive">
                      <WifiOff className="h-4 w-4" />
                      <AlertTitle>Server Connection Failed</AlertTitle>
                      <AlertDescription>
                        Unable to reach the backend server. The server may be offline or experiencing issues. Please reload the page to try again.
                      </AlertDescription>
                    </Alert>
                  )}

                  {error && !isBackendUnreachable && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>{isServerError ? 'Connection Error' : 'Login Failed'}</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-3">
                    {isBackendUnreachable ? (
                      <Button
                        type="button"
                        onClick={handleReload}
                        size="lg"
                        className="w-full text-lg h-14"
                      >
                        <RefreshCw className="mr-2 h-5 w-5" />
                        Reload
                      </Button>
                    ) : (
                      <>
                        <Button
                          type="submit"
                          disabled={isLoading || isRetrying || !membershipId.trim()}
                          size="lg"
                          className="w-full text-lg h-14"
                        >
                          {isLoading || isRetrying ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              {isRetrying ? 'Retrying...' : 'Verifying membership...'}
                            </>
                          ) : (
                            'Login'
                          )}
                        </Button>

                        {error && membershipId.trim() && !isBackendUnreachable && (
                          <Button
                            type="button"
                            onClick={handleRetry}
                            variant="outline"
                            size="lg"
                            className="w-full text-lg h-14"
                            disabled={isRetrying || isLoading}
                          >
                            <RefreshCw className={`mr-2 h-5 w-5 ${isRetrying ? 'animate-spin' : ''}`} />
                            Retry Login
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </form>

                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    <span>View your personalized diet plan</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    <span>Access your workout routines</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    <span>Track your attendance history</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-muted-foreground border-t">
        <p>
          © {new Date().getFullYear()}. Built with ❤️ using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-medium"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}

export default function MemberLoginPage({ onBack }: MemberLoginPageProps) {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex h-screen items-center justify-center bg-background p-4">
          <div className="max-w-md w-full space-y-4 text-center">
            <h2 className="text-2xl font-bold text-destructive">Member Login Failed to Load</h2>
            <p className="text-muted-foreground">
              The member login page encountered an error. Please refresh the page and try again.
            </p>
            <div className="flex flex-col gap-2">
              <Button onClick={() => window.location.reload()} variant="outline" size="lg">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Page
              </Button>
              <Button onClick={onBack} variant="ghost" size="lg">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login Options
              </Button>
            </div>
          </div>
        </div>
      }
    >
      <MemberLoginContent onBack={onBack} />
    </ErrorBoundary>
  );
}
