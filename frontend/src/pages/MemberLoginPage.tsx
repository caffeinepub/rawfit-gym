import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useMemberAuth } from '../hooks/useMemberAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, ArrowLeft, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function MemberLoginPage() {
  const navigate = useNavigate();
  const { login, isActorReady } = useMemberAuth();

  const [membershipId, setMembershipId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setError(null);

    if (!membershipId.trim()) {
      setError('Please enter your Membership ID.');
      return;
    }

    if (!isActorReady) {
      setError('Service is initializing. Please wait a moment and try again.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(membershipId.trim());
      if (result.success) {
        navigate({ to: '/member-dashboard' });
      } else {
        setError(result.error || 'Login failed. Please check your Membership ID.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img
            src="/assets/generated/rawfit-gym-logo-transparent.dim_200x200.png"
            alt="RawFit Gym"
            className="w-20 h-20 mb-3"
          />
          <h1 className="text-3xl font-bold text-primary tracking-tight">RawFit Gym</h1>
          <p className="text-muted-foreground text-sm mt-1">Think Fit, Be Fit</p>
        </div>

        <Card className="shadow-lg border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl text-center">Member Login</CardTitle>
            <CardDescription className="text-center">
              Enter your Membership ID to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="membershipId" className="text-sm font-medium text-foreground">
                  Membership ID
                </label>
                <Input
                  id="membershipId"
                  type="text"
                  placeholder="Enter your Membership ID"
                  value={membershipId}
                  onChange={(e) => {
                    setMembershipId(e.target.value);
                    if (error) setError(null);
                  }}
                  disabled={isLoading}
                  autoComplete="off"
                  autoFocus
                  className="text-base"
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {!isActorReady && !isLoading && (
                <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Connecting to service…
                </p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !membershipId.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying…
                  </>
                ) : (
                  'Login'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-4 text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: '/' })}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
