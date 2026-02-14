import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface Meal {
    carbs: bigint;
    fats: bigint;
    calories: bigint;
    name: string;
    description: string;
    protein: bigint;
}
export interface Exercise {
    name: string;
    reps: bigint;
    sets: bigint;
    instructions: string;
}
export type Time = bigint;
export interface LocationCoordinates {
    latitude: number;
    longitude: number;
}
export interface WorkoutChart {
    id: string;
    name: string;
    exercises: Array<Exercise>;
    description: string;
}
export interface PauseRequest {
    id: string;
    status: PauseRequestStatus;
    memberId: string;
    processedAt?: Time;
    adminMessage?: string;
    requestedAt: Time;
}
export interface DietChart {
    id: string;
    meals: Array<Meal>;
    name: string;
    description: string;
}
export type CreateMemberResult = {
    __kind__: "missingField";
    missingField: {
        fieldName: string;
    };
} | {
    __kind__: "duplicateContactInfo";
    duplicateContactInfo: null;
} | {
    __kind__: "agentError";
    agentError: string;
} | {
    __kind__: "notFound";
    notFound: {
        id: string;
        entity: string;
    };
} | {
    __kind__: "success";
    success: null;
};
export interface MemberProfile {
    id: string;
    finalPayableAmount: bigint;
    status: MembershipStatus;
    contactInfo: string;
    assignedWorkoutId?: string;
    assignedDietId?: string;
    discountAmount: bigint;
    name: string;
    membershipStart: Time;
    membershipEnd: Time;
    packageId: string;
}
export interface VideoMetadata {
    id: string;
    associatedWorkoutId?: string;
    title: string;
    blob: ExternalBlob;
    description: string;
    category: string;
}
export interface MembershipPackage {
    id: string;
    packageType: string;
    durationInMonths: bigint;
    priceInRupees: bigint;
}
export interface AttendanceRecord {
    status: string;
    memberId: string;
    method: AttendanceMethod;
    checkInTime: Time;
    checkOutTime?: Time;
}
export interface UserProfile {
    memberId?: string;
    name: string;
    email: string;
}
export enum AttendanceMethod {
    qrScan = "qrScan",
    manualEntry = "manualEntry",
    autoCheckout = "autoCheckout"
}
export enum MembershipStatus {
    active = "active",
    inactive = "inactive",
    paused = "paused"
}
export enum PauseRequestStatus {
    expired = "expired",
    pending = "pending",
    denied = "denied",
    approved = "approved"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addVideo(metadata: VideoMetadata): Promise<void>;
    approvePauseRequest(requestId: string, adminMessage: string | null): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createDietChart(diet: DietChart): Promise<void>;
    createMember(profile: MemberProfile): Promise<CreateMemberResult>;
    createMembershipPackage(pkg: MembershipPackage): Promise<void>;
    createWorkoutChart(workout: WorkoutChart): Promise<void>;
    deleteMembershipPackage(packageId: string): Promise<void>;
    deleteVideo(videoId: string): Promise<void>;
    denyPauseRequest(requestId: string, adminMessage: string | null): Promise<void>;
    getAllDietCharts(): Promise<Array<DietChart>>;
    getAllMembers(): Promise<Array<MemberProfile>>;
    getAllMembershipPackages(): Promise<Array<MembershipPackage>>;
    getAllPauseRequests(): Promise<Array<PauseRequest>>;
    getAllWorkoutCharts(): Promise<Array<WorkoutChart>>;
    getAssignedDiet(memberId: string): Promise<DietChart>;
    getAssignedWorkout(memberId: string): Promise<WorkoutChart>;
    getAttendanceHistory(memberId: string): Promise<Array<AttendanceRecord>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCurrentCheckInStatus(memberId: string): Promise<{
        method?: AttendanceMethod;
        checkInTime?: Time;
        isCheckedIn: boolean;
    } | null>;
    getGymLocation(): Promise<{
        radius: bigint;
        location: LocationCoordinates;
    }>;
    getMemberByContactInfo(contactInfo: string): Promise<MemberProfile | null>;
    getMemberProfile(memberId: string): Promise<MemberProfile>;
    getPauseRequestStatus(memberId: string): Promise<{
        status: PauseRequestStatus;
        requestId: string;
        adminMessage?: string;
    } | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getVideoLibrary(memberId: string): Promise<Array<VideoMetadata>>;
    hasPendingPauseRequest(memberId: string): Promise<boolean>;
    healthCheck(): Promise<{
        ok: boolean;
        version: string;
        timestamp: Time;
    }>;
    initiatePauseRequest(memberId: string): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    processAutoCheckout(memberId: string): Promise<void>;
    recordAttendance(record: AttendanceRecord): Promise<void>;
    recordQRAttendance(memberId: string, isCheckIn: boolean): Promise<void>;
    resumeMembership(memberId: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateDietChart(diet: DietChart): Promise<void>;
    updateGymLocation(location: LocationCoordinates, radius: bigint): Promise<void>;
    updateMember(profile: MemberProfile): Promise<void>;
    updateMembershipPackage(pkg: MembershipPackage): Promise<void>;
    updateWorkoutChart(workout: WorkoutChart): Promise<void>;
    validateMemberLogin(memberId: string): Promise<{
        isValid: boolean;
    }>;
}
