import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, ArrowLeft, AlertCircle, RefreshCw, XCircle, Clock, UserX } from 'lucide-react';
import { useMemberLogin } from '../hooks/useMemberAuth';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useQueryClient } from '@tanstack/react-query';

interface MemberLoginPageProps {
  onBack: () => void;
}

function MemberLoginContent({ onBack }: MemberLoginPageProps) {
  const [membershipId, setMembershipId] = useState('');
  const [attemptCount, setAttemptCount] = useState(0);
  const { login, isLoading, error } = useMemberLogin();
  const queryClient = useQueryClient();
  const [isRetrying, setIsRetrying] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (membershipId.trim()) {
      const timestamp = new Date().toISOString();
      const currentAttempt = attemptCount + 1;
      
      console.log(`[MemberLogin] Form submission - Attempt ${currentAttempt} at ${timestamp}`, {
        membershipIdLength: membershipId.trim().length,
        attemptCount: currentAttempt,
      });

      // Clear all cached data before login attempt
      queryClient.removeQueries({ queryKey: ['memberProfile', membershipId.trim()] });
      queryClient.removeQueries({ queryKey: ['members'] });
      queryClient.removeQueries({ queryKey: ['pauseRequestStatus', membershipId.trim()] });
      
      setAttemptCount(currentAttempt);
      await login(membershipId.trim());
    }
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    const timestamp = new Date().toISOString();
    const currentAttempt = attemptCount + 1;
    
    console.log(`[MemberLogin] Retry button clicked - Attempt ${currentAttempt} at ${timestamp}`, {
      membershipId: membershipId.trim(),
      errorType: error?.type,
      attemptCount: currentAttempt,
    });
    
    // Clear all cached data before retry
    if (membershipId.trim()) {
      queryClient.removeQueries({ queryKey: ['memberProfile', membershipId.trim()] });
      queryClient.removeQueries({ queryKey: ['members'] });
      queryClient.removeQueries({ queryKey: ['pauseRequestStatus', membershipId.trim()] });
    }
    
    // Small delay to show retry state
    setTimeout(async () => {
      if (membershipId.trim()) {
        setAttemptCount(currentAttempt);
        await login(membershipId.trim());
      }
      setIsRetrying(false);
    }, 300);
  };

  // Get error icon based on error type
  const getErrorIcon = () => {
    if (!error) return <AlertCircle className="h-4 w-4" />;
    
    switch (error.type) {
      case 'not-found':
        return <XCircle className="h-4 w-4" />;
      case 'expired':
        return <Clock className="h-4 w-4" />;
      case 'inactive':
        return <UserX className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  // Get error title based on error type
  const getErrorTitle = () => {
    if (!error) return 'Login Failed';
    
    switch (error.type) {
      case 'not-found':
        return 'Membership Not Found';
      case 'expired':
        return 'Membership Expired';
      case 'inactive':
        return 'Membership Inactive';
      case 'network':
        return 'Connection Error';
      case 'unauthorized':
        return 'Authentication Failed';
      default:
        return 'Login Failed';
    }
  };

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
              Access your personalized fitness dashboard. Track your progress, view your diet and workout plans.
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
                {error && (
                  <Alert variant="destructive">
                    {getErrorIcon()}
                    <AlertTitle>{getErrorTitle()}</AlertTitle>
                    <AlertDescription className="mt-2">
                      {error.message}
                      {attemptCount > 0 && (
                        <div className="mt-2 text-xs opacity-80">
                          Attempt {attemptCount}
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="membershipId">Membership ID</Label>
                    <Input
                      id="membershipId"
                      placeholder="Enter your membership ID"
                      value={membershipId}
                      onChange={(e) => setMembershipId(e.target.value)}
                      disabled={isLoading || isRetrying}
                      required
                      autoFocus
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading || isRetrying || !membershipId.trim()}
                    size="lg"
                    className="w-full text-lg h-14"
                  >
                    {isLoading || isRetrying ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        {isRetrying ? 'Retrying...' : 'Logging in...'}
                      </>
                    ) : (
                      'Login'
                    )}
                  </Button>

                  {error && (
                    <Button
                      type="button"
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
                </form>

                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    <span>View your diet and workout plans</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    <span>Track your attendance</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    <span>Access workout videos</span>
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
          © {new Date().getFullYear()} RawFit Gym. Built with ❤️ using{' '}
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
