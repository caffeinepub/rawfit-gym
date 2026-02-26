import { useState, useEffect, useCallback } from 'react';
import { useActor } from './useActor';
import { MembershipStatus } from '../backend';
import { memberAuthLogger } from '../lib/memberAuthLogger';

const MEMBER_AUTH_KEY = 'memberAuth';

export interface MemberAuthState {
  isAuthenticated: boolean;
  memberId: string | null;
  memberName: string | null;
}

interface StoredMemberAuth {
  isAuthenticated: boolean;
  memberId: string;
  memberName: string;
}

function readFromStorage(): MemberAuthState {
  try {
    const raw = localStorage.getItem(MEMBER_AUTH_KEY);
    if (!raw) return { isAuthenticated: false, memberId: null, memberName: null };
    const parsed: StoredMemberAuth = JSON.parse(raw);
    if (parsed.isAuthenticated && parsed.memberId) {
      return {
        isAuthenticated: true,
        memberId: parsed.memberId,
        memberName: parsed.memberName || null,
      };
    }
  } catch {
    // ignore
  }
  return { isAuthenticated: false, memberId: null, memberName: null };
}

function writeToStorage(state: StoredMemberAuth) {
  try {
    localStorage.setItem(MEMBER_AUTH_KEY, JSON.stringify(state));
    memberAuthLogger.localStorageOperation('set', state.memberId);
  } catch {
    // ignore
  }
}

function clearStorage() {
  try {
    localStorage.removeItem(MEMBER_AUTH_KEY);
    memberAuthLogger.localStorageOperation('remove');
  } catch {
    // ignore
  }
}

export function useMemberAuth() {
  const { actor, isFetching: actorFetching } = useActor();
  const [authState, setAuthState] = useState<MemberAuthState>(readFromStorage);

  // Sync across tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === MEMBER_AUTH_KEY) {
        memberAuthLogger.crossTabSync(e.newValue);
        setAuthState(readFromStorage());
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const login = useCallback(
    async (membershipId: string): Promise<{ success: boolean; error?: string }> => {
      const trimmedId = membershipId.trim();
      if (!trimmedId) {
        return { success: false, error: 'Please enter your Membership ID.' };
      }

      memberAuthLogger.loginAttempt(trimmedId);

      if (!actor) {
        memberAuthLogger.validationError(trimmedId, new Error('Actor not available'));
        return { success: false, error: 'Service not ready. Please try again.' };
      }

      try {
        memberAuthLogger.validationRequest(trimmedId);
        const result = await actor.memberLogin(trimmedId);
        memberAuthLogger.validationResponse(trimmedId, result);

        if (!result.isValid) {
          if (result.status === MembershipStatus.inactive) {
            return { success: false, error: 'Membership ID not found or membership is inactive.' };
          }
          return { success: false, error: 'Membership ID not found or invalid.' };
        }

        // Allow both active and paused members to log in
        if (
          result.status === MembershipStatus.active ||
          result.status === MembershipStatus.paused
        ) {
          const newState: StoredMemberAuth = {
            isAuthenticated: true,
            memberId: trimmedId,
            memberName: result.name || trimmedId,
          };
          writeToStorage(newState);
          setAuthState({
            isAuthenticated: true,
            memberId: trimmedId,
            memberName: result.name || trimmedId,
          });
          memberAuthLogger.loginSuccess(trimmedId, result.status);
          return { success: true };
        }

        return { success: false, error: 'Membership is not active.' };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        memberAuthLogger.validationError(trimmedId, err);

        if (message.includes('Member not found') || message.includes('not found')) {
          return { success: false, error: 'Membership ID not found.' };
        }
        if (message.includes('Unauthorized')) {
          return { success: false, error: 'Access denied. Please try again.' };
        }
        return {
          success: false,
          error: 'Login failed. Please check your Membership ID and try again.',
        };
      }
    },
    [actor]
  );

  const logout = useCallback(() => {
    clearStorage();
    setAuthState({ isAuthenticated: false, memberId: null, memberName: null });
  }, []);

  return {
    ...authState,
    login,
    logout,
    isActorReady: !!actor && !actorFetching,
    authError: null as string | null,
  };
}
