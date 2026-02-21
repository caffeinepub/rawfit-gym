import { useState, useEffect } from 'react';
import { useActor } from './useActor';
import { useSaveCallerUserProfile } from './useQueries';
import { memberAuthLogger } from '../lib/memberAuthLogger';

const MEMBER_AUTH_KEY = 'rawfit_member_auth';

interface MemberAuthState {
  memberId: string | null;
  isLoading: boolean;
}

// Custom event for cross-tab synchronization
const MEMBER_AUTH_EVENT = 'member_auth_change';

export function useMemberAuth() {
  const [state, setState] = useState<MemberAuthState>(() => {
    const stored = localStorage.getItem(MEMBER_AUTH_KEY);
    return {
      memberId: stored || null,
      isLoading: false,
    };
  });

  // Sync state across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === MEMBER_AUTH_KEY) {
        memberAuthLogger.crossTabSync(e.newValue);
        setState({
          memberId: e.newValue,
          isLoading: false,
        });
      }
    };

    const handleCustomEvent = (e: CustomEvent) => {
      memberAuthLogger.crossTabSync(e.detail.memberId);
      setState({
        memberId: e.detail.memberId,
        isLoading: false,
      });
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener(MEMBER_AUTH_EVENT, handleCustomEvent as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener(MEMBER_AUTH_EVENT, handleCustomEvent as EventListener);
    };
  }, []);

  const logout = () => {
    memberAuthLogger.localStorageOperation('remove');
    localStorage.removeItem(MEMBER_AUTH_KEY);
    
    // Dispatch custom event for cross-tab sync
    window.dispatchEvent(
      new CustomEvent(MEMBER_AUTH_EVENT, {
        detail: { memberId: null },
      })
    );
  };

  return {
    memberId: state.memberId,
    isLoading: state.isLoading,
    logout,
  };
}

interface LoginError {
  type: 'not-found' | 'expired' | 'inactive' | 'paused' | 'network' | 'unauthorized' | 'unknown';
  message: string;
  originalError?: any;
}

export function useMemberLogin() {
  const { actor } = useActor();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<LoginError | null>(null);
  const saveProfile = useSaveCallerUserProfile();

  const parseBackendError = (err: any, memberId: string): LoginError => {
    const errorMessage = err?.message || String(err);
    
    memberAuthLogger.validationError(memberId, err);

    // Parse specific error messages from backend traps
    if (errorMessage.includes('Member not found')) {
      return {
        type: 'not-found',
        message: 'Membership ID not found. Please check your ID or contact the gym desk.',
        originalError: err,
      };
    }

    if (errorMessage.includes('Membership is not valid')) {
      return {
        type: 'expired',
        message: 'Your membership has expired. Please contact the gym desk to renew.',
        originalError: err,
      };
    }

    if (errorMessage.includes('Unauthorized')) {
      return {
        type: 'unauthorized',
        message: 'Authentication failed. Please try logging in again.',
        originalError: err,
      };
    }

    // Check for network/connection errors
    if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('Failed to fetch')) {
      return {
        type: 'network',
        message: 'Network error. Please check your connection and try again.',
        originalError: err,
      };
    }

    // Default unknown error
    return {
      type: 'unknown',
      message: 'Login failed. Please try again or contact the gym desk for assistance.',
      originalError: err,
    };
  };

  const login = async (membershipId: string) => {
    if (!actor) {
      setError({
        type: 'network',
        message: 'Backend service not available. Please try again.',
      });
      return;
    }

    const attemptId = memberAuthLogger.loginAttempt(membershipId);
    setIsLoading(true);
    setError(null);

    try {
      memberAuthLogger.validationRequest(membershipId);
      
      // Call backend memberLogin method
      const result = await actor.memberLogin(membershipId);
      
      memberAuthLogger.validationResponse(membershipId, result);

      // Check if membership is valid
      if (!result.isValid) {
        const errorType: LoginError = {
          type: 'expired',
          message: 'Your membership has expired. Please contact the gym desk to renew.',
        };
        setError(errorType);
        setIsLoading(false);
        return;
      }

      // Check membership status
      if (result.status === 'inactive') {
        const errorType: LoginError = {
          type: 'inactive',
          message: 'Your membership is inactive. Please contact the gym desk to reactivate.',
        };
        setError(errorType);
        setIsLoading(false);
        return;
      }

      if (result.status === 'paused') {
        // Paused memberships can still log in to view status and resume
        memberAuthLogger.loginSuccess(membershipId, result.status);
      }

      // Store member ID in localStorage
      memberAuthLogger.localStorageOperation('set', membershipId);
      localStorage.setItem(MEMBER_AUTH_KEY, membershipId);

      // Save user profile with memberId for backend authorization
      try {
        await saveProfile.mutateAsync({
          name: result.name || 'Member',
          email: '',
          memberId: membershipId,
        });
        memberAuthLogger.profileSave(membershipId, true);
      } catch (profileError) {
        memberAuthLogger.profileSave(membershipId, false);
        console.error('Failed to save profile, but continuing login:', profileError);
      }

      // Dispatch custom event for cross-tab sync
      memberAuthLogger.crossTabSync(membershipId);
      window.dispatchEvent(
        new CustomEvent(MEMBER_AUTH_EVENT, {
          detail: { memberId: membershipId },
        })
      );

      setIsLoading(false);
    } catch (err: any) {
      const parsedError = parseBackendError(err, membershipId);
      setError(parsedError);
      setIsLoading(false);
    }
  };

  const logout = () => {
    memberAuthLogger.localStorageOperation('remove');
    localStorage.removeItem(MEMBER_AUTH_KEY);
    
    // Dispatch custom event for cross-tab sync
    window.dispatchEvent(
      new CustomEvent(MEMBER_AUTH_EVENT, {
        detail: { memberId: null },
      })
    );
  };

  return {
    login,
    logout,
    isLoading,
    error,
  };
}
