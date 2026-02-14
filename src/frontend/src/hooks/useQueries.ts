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

// Backend Health Check Hook
export function useBackendHealthCheck() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<{ ok: boolean; version: string; timestamp: bigint } | null>({
    queryKey: ['backendHealth'],
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
    staleTime: 0, // Always fresh
    gcTime: 0, // Don't cache
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
      toast.success('Profile saved successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to save profile: ${error.message}`);
    },
  });
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

// Member Management Queries
export function useGetAllMembers() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<MemberProfile[]>({
    queryKey: ['members'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllMembers();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetMemberProfile(memberId: string | undefined) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<MemberProfile | null>({
    queryKey: ['member', memberId],
    queryFn: async () => {
      if (!actor || !memberId) return null;
      return actor.getMemberProfile(memberId);
    },
    enabled: !!actor && !actorFetching && !!memberId,
  });
}

export function useCreateMember() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation<void, Error, MemberProfile>({
    mutationFn: async (profile: MemberProfile) => {
      if (!actor) throw new Error('Actor not available');
      console.log('[useCreateMember] Calling backend createMember with:', profile);
      
      const result = await actor.createMember(profile);
      console.log('[useCreateMember] Backend returned:', result);
      
      // Handle all CreateMemberResult variants
      if (result.__kind__ === 'success') {
        console.log('[useCreateMember] Member created successfully');
        return; // Success - return void
      } else if (result.__kind__ === 'missingField') {
        const fieldName = result.missingField.fieldName;
        const errorMsg = `Missing required field: ${fieldName}`;
        console.error('[useCreateMember]', errorMsg);
        throw new Error(errorMsg);
      } else if (result.__kind__ === 'duplicateContactInfo') {
        const errorMsg = 'A member with this contact information already exists';
        console.error('[useCreateMember]', errorMsg);
        throw new Error(errorMsg);
      } else if (result.__kind__ === 'notFound') {
        const { entity, id } = result.notFound;
        const errorMsg = `${entity} with ID "${id}" not found`;
        console.error('[useCreateMember]', errorMsg);
        throw new Error(errorMsg);
      } else if (result.__kind__ === 'agentError') {
        const errorMsg = result.agentError;
        console.error('[useCreateMember] Agent error:', errorMsg);
        throw new Error(errorMsg);
      } else {
        // Unexpected result variant
        const errorMsg = 'Unexpected response from server';
        console.error('[useCreateMember]', errorMsg, result);
        throw new Error(errorMsg);
      }
    },
    onSuccess: () => {
      console.log('[useCreateMember] onSuccess - invalidating queries and showing toast');
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast.success('Member added successfully!');
    },
    onError: (error: Error) => {
      console.error('[useCreateMember] onError:', error.message);
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast.success('Member updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update member: ${error.message}`);
    },
  });
}

// Pause Request Management
export function useInitiatePauseRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (memberId: string) => {
      if (!actor) throw new Error('Actor not available');
      try {
        return await actor.initiatePauseRequest(memberId);
      } catch (error) {
        if (error instanceof Error) {
          // Map backend errors to user-friendly messages
          if (error.message.includes('already paused')) {
            throw new Error('Your membership is already paused');
          } else if (error.message.includes('inactive')) {
            throw new Error('Cannot pause an inactive membership');
          } else if (error.message.includes('Unauthorized')) {
            throw new Error('You are not authorized to pause this membership');
          }
        }
        throw error;
      }
    },
    onSuccess: (_, memberId) => {
      queryClient.invalidateQueries({ queryKey: ['pauseRequestStatus', memberId] });
      queryClient.invalidateQueries({ queryKey: ['hasPendingPauseRequest', memberId] });
      toast.success('Pause request submitted successfully. Awaiting admin approval.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit pause request');
    },
  });
}

export function useGetPauseRequestStatus(memberId: string | undefined) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<{
    requestId: string;
    status: PauseRequestStatus;
    adminMessage?: string;
  } | null>({
    queryKey: ['pauseRequestStatus', memberId],
    queryFn: async () => {
      if (!actor || !memberId) return null;
      try {
        return await actor.getPauseRequestStatus(memberId);
      } catch (error) {
        console.error('Failed to fetch pause request status:', error);
        return null;
      }
    },
    enabled: !!actor && !actorFetching && !!memberId,
  });
}

export function useHasPendingPauseRequest(memberId: string | undefined) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['hasPendingPauseRequest', memberId],
    queryFn: async () => {
      if (!actor || !memberId) return false;
      try {
        return await actor.hasPendingPauseRequest(memberId);
      } catch (error) {
        console.error('Failed to check pending pause request:', error);
        return false;
      }
    },
    enabled: !!actor && !actorFetching && !!memberId,
  });
}

export function useResumeMembership() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (memberId: string) => {
      if (!actor) throw new Error('Actor not available');
      try {
        return await actor.resumeMembership(memberId);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes('already active')) {
            throw new Error('Your membership is already active');
          } else if (error.message.includes('inactive')) {
            throw new Error('Cannot resume an inactive membership');
          } else if (error.message.includes('Unauthorized')) {
            throw new Error('You are not authorized to resume this membership');
          }
        }
        throw error;
      }
    },
    onSuccess: (_, memberId) => {
      queryClient.invalidateQueries({ queryKey: ['member', memberId] });
      queryClient.invalidateQueries({ queryKey: ['pauseRequestStatus', memberId] });
      queryClient.invalidateQueries({ queryKey: ['hasPendingPauseRequest', memberId] });
      toast.success('Membership resumed successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to resume membership');
    },
  });
}

// Admin Pause Request Management
export function useGetAllPauseRequests() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<PauseRequest[]>({
    queryKey: ['pauseRequests'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getAllPauseRequests();
      } catch (error) {
        console.error('Failed to fetch pause requests:', error);
        return [];
      }
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useApprovePauseRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, adminMessage }: { requestId: string; adminMessage?: string }) => {
      if (!actor) throw new Error('Actor not available');
      try {
        return await actor.approvePauseRequest(requestId, adminMessage || null);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes('Unauthorized')) {
            throw new Error('Only administrators can approve pause requests');
          } else if (error.message.includes('not found')) {
            throw new Error('Pause request not found');
          } else if (error.message.includes('non-pending')) {
            throw new Error('Cannot approve a request that is not pending');
          }
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pauseRequests'] });
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['member'] });
      toast.success('Pause request approved successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to approve pause request');
    },
  });
}

export function useDenyPauseRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, adminMessage }: { requestId: string; adminMessage?: string }) => {
      if (!actor) throw new Error('Actor not available');
      try {
        return await actor.denyPauseRequest(requestId, adminMessage || null);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes('Unauthorized')) {
            throw new Error('Only administrators can deny pause requests');
          } else if (error.message.includes('not found')) {
            throw new Error('Pause request not found');
          } else if (error.message.includes('non-pending')) {
            throw new Error('Cannot deny a request that is not pending');
          }
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pauseRequests'] });
      toast.success('Pause request denied');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to deny pause request');
    },
  });
}

// Diet Chart Queries
export function useGetAllDietCharts() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<DietChart[]>({
    queryKey: ['dietCharts'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllDietCharts();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetAssignedDiet(memberId: string | undefined) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<DietChart | null>({
    queryKey: ['assignedDiet', memberId],
    queryFn: async () => {
      if (!actor || !memberId) return null;
      try {
        return await actor.getAssignedDiet(memberId);
      } catch (error) {
        if (error instanceof Error && error.message.includes('No diet assigned')) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!actor && !actorFetching && !!memberId,
    retry: false,
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
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<WorkoutChart[]>({
    queryKey: ['workoutCharts'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllWorkoutCharts();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetAssignedWorkout(memberId: string | undefined) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<WorkoutChart | null>({
    queryKey: ['assignedWorkout', memberId],
    queryFn: async () => {
      if (!actor || !memberId) return null;
      try {
        return await actor.getAssignedWorkout(memberId);
      } catch (error) {
        if (error instanceof Error && error.message.includes('No workout assigned')) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!actor && !actorFetching && !!memberId,
    retry: false,
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
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<MembershipPackage[]>({
    queryKey: ['packages'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllMembershipPackages();
    },
    enabled: !!actor && !actorFetching,
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
      toast.success('Package deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete package: ${error.message}`);
    },
  });
}

// Attendance Queries
export function useGetAttendanceHistory(memberId: string | undefined) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<AttendanceRecord[]>({
    queryKey: ['attendance', memberId],
    queryFn: async () => {
      if (!actor || !memberId) return [];
      return actor.getAttendanceHistory(memberId);
    },
    enabled: !!actor && !actorFetching && !!memberId,
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
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
      queryClient.invalidateQueries({ queryKey: ['attendance', variables.memberId] });
      queryClient.invalidateQueries({ queryKey: ['checkInStatus', variables.memberId] });
    },
    onError: (error: Error) => {
      console.error('QR attendance error:', error);
      throw error;
    },
  });
}

export function useGetCurrentCheckInStatus(memberId: string | undefined) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<{
    isCheckedIn: boolean;
    checkInTime: bigint | null;
    method: AttendanceMethod | null;
  } | null>({
    queryKey: ['checkInStatus', memberId],
    queryFn: async () => {
      if (!actor || !memberId) return null;
      const result = await actor.getCurrentCheckInStatus(memberId);
      if (!result) return null;
      return {
        isCheckedIn: result.isCheckedIn,
        checkInTime: result.checkInTime ?? null,
        method: result.method ?? null,
      };
    },
    enabled: !!actor && !actorFetching && !!memberId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

// Video Library Queries
export function useGetVideoLibrary(memberId: string | undefined) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<VideoMetadata[]>({
    queryKey: ['videos', memberId],
    queryFn: async () => {
      if (!actor || !memberId) return [];
      return actor.getVideoLibrary(memberId);
    },
    enabled: !!actor && !actorFetching && !!memberId,
  });
}

// Admin video library - fetches videos for all members by aggregating
export function useGetAllVideos() {
  const { actor, isFetching: actorFetching } = useActor();
  const { data: members } = useGetAllMembers();

  return useQuery<VideoMetadata[]>({
    queryKey: ['allVideos'],
    queryFn: async () => {
      if (!actor || !members || members.length === 0) return [];
      
      // Get videos for the first member with an assigned workout
      // Since videos are filtered by workout, we need at least one member
      const memberWithWorkout = members.find(m => m.assignedWorkoutId);
      if (!memberWithWorkout) return [];
      
      try {
        return await actor.getVideoLibrary(memberWithWorkout.id);
      } catch (error) {
        console.error('Failed to fetch videos:', error);
        return [];
      }
    },
    enabled: !!actor && !actorFetching && !!members,
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
      queryClient.invalidateQueries({ queryKey: ['allVideos'] });
      queryClient.invalidateQueries({ queryKey: ['videos'] });
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
      queryClient.invalidateQueries({ queryKey: ['allVideos'] });
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      toast.success('Video deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete video: ${error.message}`);
    },
  });
}

// Gym Location Queries
export function useGetGymLocation() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<{ location: LocationCoordinates; radius: bigint }>({
    queryKey: ['gymLocation'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getGymLocation();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useUpdateGymLocation() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ location, radius }: { location: LocationCoordinates; radius: number }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateGymLocation(location, BigInt(radius));
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
