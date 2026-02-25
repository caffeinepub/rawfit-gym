import React, { useState, useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Loader2, AlertCircle, Dumbbell, KeyRound, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useMemberAuth } from '../hooks/useMemberAuth';

export default function MemberLoginPage() {
  const navigate = useNavigate();
  const { login, isLoading } = useMemberAuth();

  const [membershipId, setMembershipId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = membershipId.trim();
    if (!trimmed) {
      setError('Please enter your membership ID.');
      inputRef.current?.focus();
      return;
    }

    const success = await login(trimmed);
    if (success) {
      navigate({ to: '/member-dashboard' });
    } else {
      inputRef.current?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Logo / Branding */}
      <div className="flex flex-col items-center mb-8">
        <img
          src="/assets/generated/rawfit-gym-logo-transparent.dim_200x200.png"
          alt="RawFit Gym"
          className="w-20 h-20 mb-3 object-contain"
        />
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">RawFit Gym</h1>
        <p className="text-muted-foreground text-sm mt-1">Think Fit, Be Fit</p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-lg p-6">
        <div className="flex items-center gap-2 mb-5">
          <KeyRound className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-card-foreground">Member Login</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="membershipId" className="text-sm font-medium text-foreground">
              Membership ID
            </label>
            <Input
              id="membershipId"
              ref={inputRef}
              type="text"
              placeholder="Enter your membership ID"
              value={membershipId}
              onChange={e => {
                setMembershipId(e.target.value);
                if (error) setError(null);
              }}
              disabled={isLoading}
              autoComplete="off"
              autoFocus
              className="w-full"
            />
          </div>

          {error && (
            <Alert variant="destructive" className="py-3">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="text-sm font-semibold">Login Failed</AlertTitle>
              <AlertDescription className="text-xs mt-0.5">{error}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !membershipId.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verifying…
              </>
            ) : (
              <>
                <Dumbbell className="w-4 h-4 mr-2" />
                Login
              </>
            )}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => navigate({ to: '/' })}
            className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to login selection
          </button>
        </div>
      </div>

      <p className="mt-8 text-xs text-muted-foreground text-center">
        Having trouble? Contact the gym front desk.
      </p>

      <footer className="mt-8 text-xs text-muted-foreground text-center">
        © {new Date().getFullYear()} RawFit Gym · Built with{' '}
        <span className="text-red-500">♥</span> using{' '}
        <a
          href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname || 'rawfit-gym')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground transition-colors"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}
