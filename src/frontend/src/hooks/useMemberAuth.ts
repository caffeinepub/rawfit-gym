import { useState, useEffect } from 'react';
import { useActor } from './useActor';

const MEMBER_AUTH_KEY = 'rawfit_member_auth';
const MEMBER_AUTH_CHANGED_EVENT = 'member-auth-changed';

interface MemberAuthState {
  memberId: string | null;
  isLoading: boolean;
}

export function useMemberAuth() {
  const [state, setState] = useState<MemberAuthState>({
    memberId: null,
    isLoading: true,
  });

  useEffect(() => {
    // Check for stored member ID on mount
    try {
      const storedMemberId = localStorage.getItem(MEMBER_AUTH_KEY);
      console.log('useMemberAuth - Loaded stored member ID:', storedMemberId);
      setState({
        memberId: storedMemberId,
        isLoading: false,
      });
    } catch (error) {
      console.error('useMemberAuth - Error loading stored member ID:', error);
      setState({
        memberId: null,
        isLoading: false,
      });
    }

    // Listen for auth changes
    const handleAuthChange = () => {
      console.log('useMemberAuth - Auth change detected');
      try {
        const storedMemberId = localStorage.getItem(MEMBER_AUTH_KEY);
        setState({
          memberId: storedMemberId,
          isLoading: false,
        });
      } catch (error) {
        console.error('useMemberAuth - Error handling auth change:', error);
        setState({
          memberId: null,
          isLoading: false,
        });
      }
    };

    window.addEventListener(MEMBER_AUTH_CHANGED_EVENT, handleAuthChange);
    window.addEventListener('storage', handleAuthChange);

    return () => {
      window.removeEventListener(MEMBER_AUTH_CHANGED_EVENT, handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  const logout = () => {
    try {
      console.log('useMemberAuth - Logging out member');
      localStorage.removeItem(MEMBER_AUTH_KEY);
      setState({ memberId: null, isLoading: false });
      // Trigger auth change event
      window.dispatchEvent(new Event(MEMBER_AUTH_CHANGED_EVENT));
    } catch (error) {
      console.error('useMemberAuth - Error during logout:', error);
    }
  };

  return {
    memberId: state.memberId,
    isLoading: state.isLoading,
    logout,
  };
}

export function useMemberLogin() {
  const { actor, isFetching } = useActor();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (memberId: string) => {
    setIsLoading(true);
    setError(null);

    console.log('useMemberLogin - Starting login for member ID:', memberId);

    try {
      // Check if actor is available
      if (!actor) {
        console.error('useMemberLogin - Actor not available');
        throw new Error('Server unavailable. Please try again in a moment.');
      }

      // Use the public validateMemberLogin endpoint
      let validationResult;
      try {
        console.log('useMemberLogin - Validating member login...');
        validationResult = await actor.validateMemberLogin(memberId);
        console.log('useMemberLogin - Validation result:', validationResult);
      } catch (err) {
        console.error('useMemberLogin - Backend call error:', err);
        
        // Classify error: connectivity vs validation failure
        const errorMessage = err instanceof Error ? err.message : String(err);
        
        // Backend validation failures (legacy traps) contain these keywords
        if (
          errorMessage.includes('Unauthorized') ||
          errorMessage.includes('Access denied') ||
          errorMessage.includes('not found') ||
          errorMessage.includes('not active') ||
          errorMessage.includes('inactive')
        ) {
          // This is a validation failure, not a connectivity issue
          console.warn('useMemberLogin - Validation failure detected in error:', errorMessage);
          throw new Error('Invalid or inactive membership ID. Please check your ID and try again, or contact the gym if your membership should be active.');
        }
        
        // True connectivity/agent errors
        throw new Error('Server unavailable. Please check your connection and try again.');
      }

      // Backend returns only { isValid: boolean }
      // isValid is true only if membership exists AND is currently active
      if (!validationResult.isValid) {
        console.warn('useMemberLogin - Invalid or inactive membership:', memberId);
        throw new Error('Invalid or inactive membership ID. Please check your ID and try again, or contact the gym if your membership should be active.');
      }

      // Store member ID in localStorage
      console.log('useMemberLogin - Login successful, storing member ID');
      localStorage.setItem(MEMBER_AUTH_KEY, memberId);
      
      // Trigger auth change event to update App without reload
      console.log('useMemberLogin - Triggering auth change event');
      window.dispatchEvent(new Event(MEMBER_AUTH_CHANGED_EVENT));
      
      setIsLoading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed. Please try again.';
      console.error('useMemberLogin - Login failed:', errorMessage);
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  return { 
    login, 
    isLoading: isLoading || isFetching, 
    error 
  };
}
