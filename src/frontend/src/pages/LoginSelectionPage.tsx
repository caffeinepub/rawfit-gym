import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, User, Loader2 } from 'lucide-react';
import AdminLoginPage from './AdminLoginPage';
import MemberLoginPage from './MemberLoginPage';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function LoginSelectionContent() {
  const [selectedLogin, setSelectedLogin] = useState<'selection' | 'admin' | 'member'>('selection');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleLoginSelection = (type: 'admin' | 'member') => {
    setIsTransitioning(true);
    // Small delay to show loading state
    setTimeout(() => {
      setSelectedLogin(type);
      setIsTransitioning(false);
    }, 100);
  };

  const handleBack = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setSelectedLogin('selection');
      setIsTransitioning(false);
    }, 100);
  };

  // Show loading state during transitions
  if (isTransitioning) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading login page...</p>
        </div>
      </div>
    );
  }

  if (selectedLogin === 'admin') {
    return <AdminLoginPage onBack={handleBack} />;
  }

  if (selectedLogin === 'member') {
    return <MemberLoginPage onBack={handleBack} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-accent/10">
      {/* Hero Section */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-6xl space-y-8">
          {/* Branding */}
          <div className="text-center space-y-4">
            <div className="flex flex-col items-center gap-4">
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
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Your complete gym management solution. Track workouts, manage diets, and achieve your fitness goals.
            </p>
          </div>

          {/* Login Options */}
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Member Login */}
            <Card className="shadow-xl hover:shadow-2xl transition-shadow cursor-pointer" onClick={() => handleLoginSelection('member')}>
              <CardHeader className="space-y-3">
                <div className="flex justify-center">
                  <div className="bg-primary/10 rounded-full p-4">
                    <User className="h-12 w-12 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-2xl text-center">Member Login</CardTitle>
                <CardDescription className="text-center text-base">
                  Access your personalized fitness dashboard with your membership ID
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button size="lg" className="w-full text-lg h-12">
                  Login as Member
                </Button>
              </CardContent>
            </Card>

            {/* Admin Login */}
            <Card className="shadow-xl hover:shadow-2xl transition-shadow cursor-pointer" onClick={() => handleLoginSelection('admin')}>
              <CardHeader className="space-y-3">
                <div className="flex justify-center">
                  <div className="bg-primary/10 rounded-full p-4">
                    <Shield className="h-12 w-12 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-2xl text-center">Admin Login</CardTitle>
                <CardDescription className="text-center text-base">
                  Manage gym operations with Internet Identity authentication
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button size="lg" variant="outline" className="w-full text-lg h-12">
                  Login as Admin
                </Button>
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

export default function LoginSelectionPage() {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex h-screen items-center justify-center bg-background p-4">
          <div className="max-w-md w-full space-y-4 text-center">
            <h2 className="text-2xl font-bold text-destructive">Login Page Failed to Load</h2>
            <p className="text-muted-foreground">
              The login page encountered an error. Please refresh the page and try again.
            </p>
            <Button onClick={() => window.location.reload()} variant="outline" size="lg">
              Refresh Page
            </Button>
          </div>
        </div>
      }
    >
      <LoginSelectionContent />
    </ErrorBoundary>
  );
}
