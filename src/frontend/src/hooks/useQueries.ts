import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type {
  UserProfile,
  UserRole,
  MemberProfile,
  DietChart,
  WorkoutChart,
  MembershipPackage,
  AttendanceRecord,
  VideoMetadata,
  LocationCoordinates,
  CreateMemberResult,
  AttendanceMethod,
  PauseRequest,
  PauseRequestStatus,
} from '../backend';
import { toast } from 'sonner';
import { useInternetIdentity } from './useInternetIdentity';

// Backend Health Check Hook
export function useBackendHealthCheck() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  
  // Include principal in query key to ensure refetch after login
  const principalKey = identity?.getPrincipal().toString() || 'anonymous';

  return useQuery<{ ok: boolean; version: string; timestamp: bigint } | null>({
    queryKey: ['backendHealth', principalKey],
    queryFn: async () => {
      if (!actor) return null;
      try {
        const result = await actor.healthCheck();
        return result;
      } catch (error) {
        console.error('[useBackendHealthCheck] Health check failed:', error);
        return null;
      }
    },
    enabled: !!actor && !actorFetching,
    retry: 2,
    retryDelay: 1000,
    staleTime: 30000, // Cache for 30 seconds to avoid excessive calls
    gcTime: 60000, // Keep in cache for 1 minute
  });
}

// User Profile Queries
export function useGetCallerUserProfile(options?: { enabled?: boolean }) {
  const { actor, isFetching: actorFetching } = useActor();
  const enabled = options?.enabled ?? true;

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching && enabled,
    retry: 2,
    retryDelay: 1000,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useGetCallerUserRole(options?: { enabled?: boolean }) {
  const { actor, isFetching: actorFetching } = useActor();
  const enabled = options?.enabled ?? true;

  return useQuery<UserRole>({
    queryKey: ['currentUserRole'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !actorFetching && enabled,
    retry: 2,
    retryDelay: 1000,
  });
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// Member Queries
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

export function useGetMemberProfile(memberId: string | null | undefined) {
  const { actor, isFetching } = useActor();
  const normalizedMemberId = memberId || null;

  return useQuery<MemberProfile | null>({
    queryKey: ['memberProfile', normalizedMemberId],
    queryFn: async () => {
      if (!actor || !normalizedMemberId) return null;
      try {
        return await actor.getMemberProfile(normalizedMemberId);
      } catch (error) {
        console.error('Error fetching member profile:', error);
        return null;
      }
    },
    enabled: !!actor && !isFetching && !!normalizedMemberId,
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache
  });
}

export function useCreateMember() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: MemberProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createMember(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast.success('Member created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create member: ${error.message}`);
    },
  });
}

export function useUpdateMember() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: MemberProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateMember(profile);
    },
    onSuccess: async (_, variables) => {
      // Invalidate all member-related queries to ensure fresh data
      await queryClient.invalidateQueries({ queryKey: ['members'] });
      await queryClient.invalidateQueries({ queryKey: ['memberProfile', variables.id] });
      await queryClient.invalidateQueries({ queryKey: ['validateMemberLogin', variables.id] });
      await queryClient.invalidateQueries({ queryKey: ['pauseRequests'] });
      await queryClient.invalidateQueries({ queryKey: ['pauseRequestStatus', variables.id] });
      toast.success('Member updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update member: ${error.message}`);
    },
  });
}

// Diet Chart Queries
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

export function useGetAssignedDiet(memberId: string | null | undefined) {
  const { actor, isFetching } = useActor();
  const normalizedMemberId = memberId || null;

  return useQuery<DietChart | null>({
    queryKey: ['assignedDiet', normalizedMemberId],
    queryFn: async () => {
      if (!actor || !normalizedMemberId) return null;
      try {
        return await actor.getAssignedDiet(normalizedMemberId);
      } catch (error) {
        console.error('Error fetching assigned diet:', error);
        return null;
      }
    },
    enabled: !!actor && !isFetching && !!normalizedMemberId,
  });
}

export function useCreateDietChart() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (diet: DietChart) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createDietChart(diet);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dietCharts'] });
      toast.success('Diet chart created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create diet chart: ${error.message}`);
    },
  });
}

export function useUpdateDietChart() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (diet: DietChart) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateDietChart(diet);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dietCharts'] });
      toast.success('Diet chart updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update diet chart: ${error.message}`);
    },
  });
}

// Workout Chart Queries
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

export function useGetAssignedWorkout(memberId: string | null | undefined) {
  const { actor, isFetching } = useActor();
  const normalizedMemberId = memberId || null;

  return useQuery<WorkoutChart | null>({
    queryKey: ['assignedWorkout', normalizedMemberId],
    queryFn: async () => {
      if (!actor || !normalizedMemberId) return null;
      try {
        return await actor.getAssignedWorkout(normalizedMemberId);
      } catch (error) {
        console.error('Error fetching assigned workout:', error);
        return null;
      }
    },
    enabled: !!actor && !isFetching && !!normalizedMemberId,
  });
}

export function useCreateWorkoutChart() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (workout: WorkoutChart) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createWorkoutChart(workout);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workoutCharts'] });
      toast.success('Workout chart created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create workout chart: ${error.message}`);
    },
  });
}

export function useUpdateWorkoutChart() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (workout: WorkoutChart) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateWorkoutChart(workout);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workoutCharts'] });
      toast.success('Workout chart updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update workout chart: ${error.message}`);
    },
  });
}

// Membership Package Queries
export function useGetAllMembershipPackages() {
  const { actor, isFetching } = useActor();

  return useQuery<MembershipPackage[]>({
    queryKey: ['packages'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllMembershipPackages();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateMembershipPackage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pkg: MembershipPackage) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createMembershipPackage(pkg);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      toast.success('Package created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create package: ${error.message}`);
    },
  });
}

export function useUpdateMembershipPackage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pkg: MembershipPackage) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateMembershipPackage(pkg);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      toast.success('Package updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update package: ${error.message}`);
    },
  });
}

export function useDeleteMembershipPackage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (packageId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteMembershipPackage(packageId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      toast.success('Package deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete package: ${error.message}`);
    },
  });
}

// Attendance Queries
export function useGetAttendanceHistory(memberId: string | null | undefined) {
  const { actor, isFetching } = useActor();
  const normalizedMemberId = memberId || null;

  return useQuery<AttendanceRecord[]>({
    queryKey: ['attendanceHistory', normalizedMemberId],
    queryFn: async () => {
      if (!actor || !normalizedMemberId) return [];
      try {
        return await actor.getAttendanceHistory(normalizedMemberId);
      } catch (error) {
        console.error('Error fetching attendance history:', error);
        return [];
      }
    },
    enabled: !!actor && !isFetching && !!normalizedMemberId,
  });
}

export function useGetCurrentCheckInStatus(memberId: string | null | undefined) {
  const { actor, isFetching } = useActor();
  const normalizedMemberId = memberId || null;

  return useQuery<{ isCheckedIn: boolean; checkInTime: bigint | null; method: AttendanceMethod | null } | null>({
    queryKey: ['checkInStatus', normalizedMemberId],
    queryFn: async () => {
      if (!actor || !normalizedMemberId) return null;
      try {
        const result = await actor.getCurrentCheckInStatus(normalizedMemberId);
        if (!result) return null;
        // Convert optional fields to null for consistency
        return {
          isCheckedIn: result.isCheckedIn,
          checkInTime: result.checkInTime ?? null,
          method: result.method ?? null,
        };
      } catch (error) {
        console.error('Error fetching check-in status:', error);
        return null;
      }
    },
    enabled: !!actor && !isFetching && !!normalizedMemberId,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useRecordAttendance() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (record: AttendanceRecord) => {
      if (!actor) throw new Error('Actor not available');
      return actor.recordAttendance(record);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['attendanceHistory', variables.memberId] });
      queryClient.invalidateQueries({ queryKey: ['checkInStatus', variables.memberId] });
      toast.success('Attendance recorded successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to record attendance: ${error.message}`);
    },
  });
}

export function useRecordQRAttendance() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ memberId, isCheckIn }: { memberId: string; isCheckIn: boolean }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.recordQRAttendance(memberId, isCheckIn);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['attendanceHistory', variables.memberId] });
      queryClient.invalidateQueries({ queryKey: ['checkInStatus', variables.memberId] });
      const action = variables.isCheckIn ? 'Check-in' : 'Check-out';
      toast.success(`${action} recorded successfully`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to record attendance: ${error.message}`);
    },
  });
}

// Video Library Queries
export function useGetVideoLibrary(memberId: string | null | undefined) {
  const { actor, isFetching } = useActor();
  const normalizedMemberId = memberId || null;

  return useQuery<VideoMetadata[]>({
    queryKey: ['videoLibrary', normalizedMemberId],
    queryFn: async () => {
      if (!actor || !normalizedMemberId) return [];
      try {
        return await actor.getVideoLibrary(normalizedMemberId);
      } catch (error) {
        console.error('Error fetching video library:', error);
        return [];
      }
    },
    enabled: !!actor && !isFetching && !!normalizedMemberId,
  });
}

export function useGetAllVideos() {
  const { actor, isFetching } = useActor();

  return useQuery<VideoMetadata[]>({
    queryKey: ['allVideos'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        const members = await actor.getAllMembers();
        if (members.length === 0) return [];
        const videos = await actor.getVideoLibrary(members[0].id);
        return videos;
      } catch (error) {
        console.error('Error fetching all videos:', error);
        return [];
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddVideo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (metadata: VideoMetadata) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addVideo(metadata);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videoLibrary'] });
      queryClient.invalidateQueries({ queryKey: ['allVideos'] });
      toast.success('Video added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add video: ${error.message}`);
    },
  });
}

export function useDeleteVideo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (videoId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteVideo(videoId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videoLibrary'] });
      queryClient.invalidateQueries({ queryKey: ['allVideos'] });
      toast.success('Video deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete video: ${error.message}`);
    },
  });
}

// Gym Location Queries
export function useGetGymLocation() {
  const { actor, isFetching } = useActor();

  return useQuery<{ location: LocationCoordinates; radius: bigint }>({
    queryKey: ['gymLocation'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getGymLocation();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateGymLocation() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ location, radius }: { location: LocationCoordinates; radius: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateGymLocation(location, radius);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gymLocation'] });
      toast.success('Gym location updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update gym location: ${error.message}`);
    },
  });
}

// Pause Request Queries
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

export function useGetPauseRequestStatus(memberId: string | null | undefined) {
  const { actor, isFetching } = useActor();
  const normalizedMemberId = memberId || null;

  return useQuery<{ requestId: string; status: PauseRequestStatus; adminMessage?: string } | null>({
    queryKey: ['pauseRequestStatus', normalizedMemberId],
    queryFn: async () => {
      if (!actor || !normalizedMemberId) return null;
      try {
        return await actor.getPauseRequestStatus(normalizedMemberId);
      } catch (error) {
        console.error('Error fetching pause request status:', error);
        return null;
      }
    },
    enabled: !!actor && !isFetching && !!normalizedMemberId,
  });
}

export function useHasPendingPauseRequest(memberId: string | null | undefined) {
  const { actor, isFetching } = useActor();
  const normalizedMemberId = memberId || null;

  return useQuery<boolean>({
    queryKey: ['hasPendingPauseRequest', normalizedMemberId],
    queryFn: async () => {
      if (!actor || !normalizedMemberId) return false;
      try {
        return await actor.hasPendingPauseRequest(normalizedMemberId);
      } catch (error) {
        console.error('Error checking pending pause request:', error);
        return false;
      }
    },
    enabled: !!actor && !isFetching && !!normalizedMemberId,
  });
}

export function useInitiatePauseRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (memberId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.initiatePauseRequest(memberId);
    },
    onSuccess: (_, memberId) => {
      queryClient.invalidateQueries({ queryKey: ['pauseRequests'] });
      queryClient.invalidateQueries({ queryKey: ['pauseRequestStatus', memberId] });
      queryClient.invalidateQueries({ queryKey: ['hasPendingPauseRequest', memberId] });
      toast.success('Pause request submitted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to submit pause request: ${error.message}`);
    },
  });
}

export function useApprovePauseRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, adminMessage }: { requestId: string; adminMessage?: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.approvePauseRequest(requestId, adminMessage || null);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['pauseRequests'] });
      await queryClient.invalidateQueries({ queryKey: ['members'] });
      await queryClient.invalidateQueries({ queryKey: ['memberProfile'] });
      await queryClient.invalidateQueries({ queryKey: ['pauseRequestStatus'] });
      toast.success('Pause request approved');
    },
    onError: (error: Error) => {
      toast.error(`Failed to approve pause request: ${error.message}`);
    },
  });
}

export function useDenyPauseRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, adminMessage }: { requestId: string; adminMessage?: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.denyPauseRequest(requestId, adminMessage || null);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['pauseRequests'] });
      await queryClient.invalidateQueries({ queryKey: ['pauseRequestStatus'] });
      toast.success('Pause request denied');
    },
    onError: (error: Error) => {
      toast.error(`Failed to deny pause request: ${error.message}`);
    },
  });
}

export function useResumeMembership() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (memberId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.resumeMembership(memberId);
    },
    onSuccess: async (_, memberId) => {
      await queryClient.invalidateQueries({ queryKey: ['memberProfile', memberId] });
      await queryClient.invalidateQueries({ queryKey: ['members'] });
      await queryClient.invalidateQueries({ queryKey: ['pauseRequestStatus', memberId] });
      toast.success('Membership resumed successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to resume membership: ${error.message}`);
    },
  });
}
