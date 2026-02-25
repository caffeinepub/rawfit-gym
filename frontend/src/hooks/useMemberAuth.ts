import { useState, useEffect, useCallback } from 'react';
import { useActor } from './useActor';

const MEMBER_AUTH_KEY = 'memberAuth_memberId';
const MEMBER_AUTH_NAME_KEY = 'memberAuth_name';
const MEMBER_AUTH_EVENT = 'memberAuthChange';

export interface MemberAuthState {
  memberId: string | null;
  memberName: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface MemberAuthActions {
  login: (membershipId: string) => Promise<boolean>;
  logout: () => void;
}

export function useMemberAuth(): MemberAuthState & MemberAuthActions {
  const { actor } = useActor();

  const [state, setState] = useState<MemberAuthState>(() => {
    try {
      const storedId = localStorage.getItem(MEMBER_AUTH_KEY);
      const storedName = localStorage.getItem(MEMBER_AUTH_NAME_KEY);
      return {
        memberId: storedId || null,
        memberName: storedName || null,
        isLoading: false,
        error: null,
      };
    } catch {
      return { memberId: null, memberName: null, isLoading: false, error: null };
    }
  });

  // Sync across tabs via storage event
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === MEMBER_AUTH_KEY) {
        const newId = e.newValue || null;
        const newName = localStorage.getItem(MEMBER_AUTH_NAME_KEY) || null;
        setState(prev => ({ ...prev, memberId: newId, memberName: newName }));
      }
    };

    // Sync within same tab via custom event
    const handleCustomEvent = (e: Event) => {
      const detail = (e as CustomEvent).detail as { memberId: string | null; memberName: string | null };
      setState(prev => ({ ...prev, memberId: detail.memberId, memberName: detail.memberName }));
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(MEMBER_AUTH_EVENT, handleCustomEvent);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(MEMBER_AUTH_EVENT, handleCustomEvent);
    };
  }, []);

  const login = useCallback(async (membershipId: string): Promise<boolean> => {
    if (!actor) {
      setState(prev => ({ ...prev, error: 'Connection not ready. Please try again.' }));
      return false;
    }

    const trimmedId = membershipId.trim();
    if (!trimmedId) {
      setState(prev => ({ ...prev, error: 'Please enter your membership ID.' }));
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await actor.memberLogin(trimmedId);

      if (!result.isValid) {
        let errorMsg = 'Membership not found or inactive.';
        if (result.name === '' && result.status) {
          // Member not found
          errorMsg = 'No membership found with this ID. Please check and try again.';
        } else if (result.status === 'inactive') {
          errorMsg = 'Your membership is inactive. Please contact the gym.';
        }
        setState(prev => ({ ...prev, isLoading: false, error: errorMsg }));
        return false;
      }

      // Successful login — persist to localStorage
      try {
        localStorage.setItem(MEMBER_AUTH_KEY, trimmedId);
        localStorage.setItem(MEMBER_AUTH_NAME_KEY, result.name || '');
      } catch {
        // localStorage might be unavailable
      }

      // Update state directly (don't rely only on event)
      setState({
        memberId: trimmedId,
        memberName: result.name || '',
        isLoading: false,
        error: null,
      });

      // Also dispatch event for other tabs/instances
      window.dispatchEvent(
        new CustomEvent(MEMBER_AUTH_EVENT, {
          detail: { memberId: trimmedId, memberName: result.name || '' },
        })
      );

      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      let userMessage = 'Login failed. Please try again.';

      if (message.includes('not found') || message.includes('Not found')) {
        userMessage = 'No membership found with this ID.';
      } else if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
        userMessage = 'Network error. Please check your connection and try again.';
      } else if (message.includes('Unauthorized') || message.includes('unauthorized')) {
        userMessage = 'Access denied. Please contact the gym.';
      }

      setState(prev => ({ ...prev, isLoading: false, error: userMessage }));
      return false;
    }
  }, [actor]);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(MEMBER_AUTH_KEY);
      localStorage.removeItem(MEMBER_AUTH_NAME_KEY);
    } catch {
      // ignore
    }

    // Update state directly
    setState({ memberId: null, memberName: null, isLoading: false, error: null });

    // Dispatch event for other tabs
    window.dispatchEvent(
      new CustomEvent(MEMBER_AUTH_EVENT, {
        detail: { memberId: null, memberName: null },
      })
    );
  }, []);

  return { ...state, login, logout };
}
