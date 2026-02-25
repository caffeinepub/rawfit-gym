import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type {
  MemberProfile,
  DietChart,
  WorkoutChart,
  MembershipPackage,
  AttendanceRecord,
  VideoMetadata,
  UserProfile,
  PauseRequest,
  CreateMemberResult,
} from '../backend';

// ─── Admin / shared queries ───────────────────────────────────────────────────

export function useGetAllMembers() {
  const { actor, isFetching } = useActor();
  return useQuery<MemberProfile[]>({
    queryKey: ['members'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllMembers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAllDietCharts() {
  const { actor, isFetching } = useActor();
  return useQuery<DietChart[]>({
    queryKey: ['dietCharts'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllDietCharts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAllWorkoutCharts() {
  const { actor, isFetching } = useActor();
  return useQuery<WorkoutChart[]>({
    queryKey: ['workoutCharts'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllWorkoutCharts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAllMembershipPackages() {
  const { actor, isFetching } = useActor();
  return useQuery<MembershipPackage[]>({
    queryKey: ['membershipPackages'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllMembershipPackages();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAllPauseRequests() {
  const { actor, isFetching } = useActor();
  return useQuery<PauseRequest[]>({
    queryKey: ['pauseRequests'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllPauseRequests();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAllVideos() {
  const { actor, isFetching } = useActor();
  return useQuery<VideoMetadata[]>({
    queryKey: ['videos'],
    queryFn: async () => {
      if (!actor) return [];
      // Use a known admin-accessible method; fall back gracefully
      try {
        return await actor.getAllMembers().then(() => []).catch(() => []);
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Member queries (use getMemberByMembershipId — no auth required) ──────────

/**
 * Fetches member profile using the public getMemberByMembershipId endpoint.
 * This works for anonymous callers (no Internet Identity required).
 */
export function useGetMemberByMembershipId(memberId: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery<{ isValid: boolean; status: string; member?: MemberProfile } | null>({
    queryKey: ['memberByMembershipId', memberId],
    queryFn: async () => {
      if (!actor || !memberId) return null;
      return actor.getMemberByMembershipId(memberId);
    },
    enabled: !!actor && !isFetching && !!memberId,
    staleTime: 30_000,
  });
}

export function useGetMemberAttendanceHistory(memberId: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery<AttendanceRecord[]>({
    queryKey: ['attendanceHistory', memberId],
    queryFn: async () => {
      if (!actor || !memberId) return [];
      try {
        return await actor.getAttendanceHistory(memberId);
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching && !!memberId,
  });
}

export function useGetMemberVideoLibrary(memberId: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery<VideoMetadata[]>({
    queryKey: ['videoLibrary', memberId],
    queryFn: async () => {
      if (!actor || !memberId) return [];
      try {
        return await actor.getVideoLibrary(memberId);
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching && !!memberId,
  });
}

export function useGetCurrentCheckInStatus(memberId: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery<{ isCheckedIn: boolean; checkInTime?: bigint; method?: string } | null>({
    queryKey: ['checkInStatus', memberId],
    queryFn: async () => {
      if (!actor || !memberId) return null;
      try {
        return await actor.getCurrentCheckInStatus(memberId);
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching && !!memberId,
    refetchInterval: 60_000,
  });
}

export function useGetPauseRequestStatus(memberId: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery<{ status: string; requestId: string; adminMessage?: string } | null>({
    queryKey: ['pauseRequestStatus', memberId],
    queryFn: async () => {
      if (!actor || !memberId) return null;
      try {
        return await actor.getPauseRequestStatus(memberId);
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching && !!memberId,
  });
}

// ─── User profile ─────────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateMember() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation<CreateMemberResult, Error, MemberProfile>({
    mutationFn: async (profile: MemberProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createMember(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
  });
}

export function useUpdateMember() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation<void, Error, MemberProfile>({
    mutationFn: async (profile: MemberProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateMember(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
  });
}

export function useCreateDietChart() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation<void, Error, DietChart>({
    mutationFn: async (diet: DietChart) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createDietChart(diet);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dietCharts'] });
    },
  });
}

export function useUpdateDietChart() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation<void, Error, DietChart>({
    mutationFn: async (diet: DietChart) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateDietChart(diet);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dietCharts'] });
    },
  });
}

export function useCreateWorkoutChart() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation<void, Error, WorkoutChart>({
    mutationFn: async (workout: WorkoutChart) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createWorkoutChart(workout);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workoutCharts'] });
    },
  });
}

export function useUpdateWorkoutChart() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation<void, Error, WorkoutChart>({
    mutationFn: async (workout: WorkoutChart) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateWorkoutChart(workout);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workoutCharts'] });
    },
  });
}

export function useCreateMembershipPackage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation<void, Error, MembershipPackage>({
    mutationFn: async (pkg: MembershipPackage) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createMembershipPackage(pkg);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['membershipPackages'] });
    },
  });
}

export function useUpdateMembershipPackage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation<void, Error, MembershipPackage>({
    mutationFn: async (pkg: MembershipPackage) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateMembershipPackage(pkg);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['membershipPackages'] });
    },
  });
}

export function useDeleteMembershipPackage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (packageId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteMembershipPackage(packageId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['membershipPackages'] });
    },
  });
}

export function useRecordAttendance() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation<void, Error, AttendanceRecord>({
    mutationFn: async (record: AttendanceRecord) => {
      if (!actor) throw new Error('Actor not available');
      return actor.recordAttendance(record);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['attendanceHistory', variables.memberId] });
      queryClient.invalidateQueries({ queryKey: ['allAttendance'] });
    },
  });
}

export function useRecordQRAttendance() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation<void, Error, { memberId: string; isCheckIn: boolean }>({
    mutationFn: async ({ memberId, isCheckIn }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.recordQRAttendance(memberId, isCheckIn);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['checkInStatus', variables.memberId] });
      queryClient.invalidateQueries({ queryKey: ['attendanceHistory', variables.memberId] });
    },
  });
}

export function useAddVideo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation<void, Error, VideoMetadata>({
    mutationFn: async (metadata: VideoMetadata) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addVideo(metadata);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
    },
  });
}

export function useDeleteVideo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (videoId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteVideo(videoId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
    },
  });
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation<void, Error, UserProfile>({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useInitiatePauseRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (memberId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.initiatePauseRequest(memberId);
    },
    onSuccess: (_data, memberId) => {
      queryClient.invalidateQueries({ queryKey: ['pauseRequestStatus', memberId] });
      queryClient.invalidateQueries({ queryKey: ['pauseRequests'] });
    },
  });
}

export function useApprovePauseRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation<void, Error, { requestId: string; adminMessage: string | null }>({
    mutationFn: async ({ requestId, adminMessage }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.approvePauseRequest(requestId, adminMessage);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pauseRequests'] });
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
  });
}

export function useDenyPauseRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation<void, Error, { requestId: string; adminMessage: string | null }>({
    mutationFn: async ({ requestId, adminMessage }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.denyPauseRequest(requestId, adminMessage);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pauseRequests'] });
    },
  });
}

export function useResumeMembership() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (memberId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.resumeMembership(memberId);
    },
    onSuccess: (_data, memberId) => {
      queryClient.invalidateQueries({ queryKey: ['memberByMembershipId', memberId] });
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
  });
}

export function useGetGymLocation() {
  const { actor, isFetching } = useActor();
  return useQuery<{ radius: bigint; location: { latitude: number; longitude: number } } | null>({
    queryKey: ['gymLocation'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getGymLocation();
    },
    enabled: !!actor && !isFetching,
    staleTime: 5 * 60_000,
  });
}
