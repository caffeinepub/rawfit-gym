import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, ArrowLeft, AlertCircle, RefreshCw } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useEffect, useState } from 'react';

interface AdminLoginPageProps {
  onBack: () => void;
}

function AdminLoginContent({ onBack }: AdminLoginPageProps) {
  const { login, loginStatus, loginError, clear, isInitializing } = useInternetIdentity();
  const [isRetrying, setIsRetrying] = useState(false);

  const isLoggingIn = loginStatus === 'logging-in';
  const hasError = loginStatus === 'loginError';

  // Log initialization state for debugging
  useEffect(() => {
    console.log('AdminLoginPage - loginStatus:', loginStatus);
    if (loginError) {
      console.error('AdminLoginPage - loginError:', loginError);
    }
  }, [loginStatus, loginError]);

  const handleLogin = async () => {
    try {
      console.log('AdminLoginPage - Attempting login...');
      await login();
    } catch (error: any) {
      console.error('AdminLoginPage - Login error:', error);
      // Error is handled by the useInternetIdentity hook
    }
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    console.log('AdminLoginPage - Retrying login...');
    try {
      // Clear any existing error state
      await clear();
      // Small delay to ensure state is cleared
      setTimeout(() => {
        setIsRetrying(false);
        handleLogin();
      }, 300);
    } catch (error) {
      console.error('AdminLoginPage - Retry error:', error);
      setIsRetrying(false);
    }
  };

  // Show loading state during initialization
  if (isInitializing) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Connecting to authentication service...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-accent/10">
      {/* Hero Section */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
          {/* Left Side - Branding */}
          <div className="text-center lg:text-left space-y-6">
            <Button variant="ghost" onClick={onBack} className="mb-4" disabled={isLoggingIn || isRetrying}>
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
              Admin access for complete gym management. Manage members, diets, workouts, and more.
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
                <CardTitle className="text-3xl text-center">Admin Login</CardTitle>
                <CardDescription className="text-center text-base">
                  Sign in with Internet Identity to access the admin dashboard
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {hasError && loginError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Authentication Error</AlertTitle>
                    <AlertDescription>
                      {loginError.message || 'Failed to connect to Internet Identity. Please check your connection and try again.'}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-3">
                  <Button
                    onClick={handleLogin}
                    disabled={isLoggingIn || isRetrying}
                    size="lg"
                    className="w-full text-lg h-14"
                  >
                    {isLoggingIn || isRetrying ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        {isRetrying ? 'Retrying...' : 'Connecting to Internet Identity...'}
                      </>
                    ) : (
                      'Login with Internet Identity'
                    )}
                  </Button>

                  {hasError && (
                    <Button
                      onClick={handleRetry}
                      variant="outline"
                      size="lg"
                      className="w-full text-lg h-14"
                      disabled={isRetrying}
                    >
                      <RefreshCw className={`mr-2 h-5 w-5 ${isRetrying ? 'animate-spin' : ''}`} />
                      Retry Login
                    </Button>
                  )}
                </div>

                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    <span>Secure authentication</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    <span>Full management access</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    <span>Manage all gym operations</span>
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
          © 2025. Built with ❤️ using{' '}
          <a
            href="https://caffeine.ai"
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

export default function AdminLoginPage({ onBack }: AdminLoginPageProps) {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex h-screen items-center justify-center bg-background p-4">
          <div className="max-w-md w-full space-y-4 text-center">
            <h2 className="text-2xl font-bold text-destructive">Admin Login Failed to Load</h2>
            <p className="text-muted-foreground">
              The admin login page encountered an error. Please refresh the page and try again.
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
      <AdminLoginContent onBack={onBack} />
    </ErrorBoundary>
  );
}
