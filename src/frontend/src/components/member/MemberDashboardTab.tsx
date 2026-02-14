import { useMemberAuth } from '../../hooks/useMemberAuth';
import { useGetMemberProfile, useGetAssignedDiet, useGetAssignedWorkout, useGetAttendanceHistory, useGetAllMembershipPackages, useInitiatePauseRequest, useResumeMembership, useGetPauseRequestStatus } from '../../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Apple, Dumbbell, CalendarCheck, Pause, Play } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MembershipStatus, AttendanceMethod, PauseRequestStatus } from '../../backend';
import { formatINR } from '../../lib/currencyUtils';
import QRAttendanceCard from './QRAttendanceCard';
import MemberMembershipStatusCard from './MemberMembershipStatusCard';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function MemberDashboardTab() {
  const { memberId } = useMemberAuth();
  
  const { data: memberProfile, isLoading: profileLoading } = useGetMemberProfile(memberId || undefined);
  const { data: diet, isLoading: dietLoading } = useGetAssignedDiet(memberId || undefined);
  const { data: workout, isLoading: workoutLoading } = useGetAssignedWorkout(memberId || undefined);
  const { data: attendance, isLoading: attendanceLoading } = useGetAttendanceHistory(memberId || undefined);
  const { data: packages } = useGetAllMembershipPackages();
  const { data: pauseRequestStatus } = useGetPauseRequestStatus(memberId || undefined);
  
  const initiatePauseRequest = useInitiatePauseRequest();
  const resumeMembership = useResumeMembership();

  const isMembershipActive = memberProfile && Number(memberProfile.membershipEnd) > Date.now() * 1000000;
  const isPaused = memberProfile?.status === MembershipStatus.paused;
  const hasPendingRequest = pauseRequestStatus?.status === PauseRequestStatus.pending;

  const formatTime = (time: bigint) => {
    const date = new Date(Number(time) / 1000000);
    return date.toLocaleString();
  };

  const handlePauseMembership = async () => {
    if (memberId) {
      await initiatePauseRequest.mutateAsync(memberId);
    }
  };

  const handleResumeMembership = async () => {
    if (memberId) {
      await resumeMembership.mutateAsync(memberId);
    }
  };

  const getPackageName = (packageId: string) => {
    return packages?.find((pkg) => pkg.id === packageId)?.packageType || 'Unknown Package';
  };

  const getPackagePrice = (packageId: string) => {
    const pkg = packages?.find((p) => p.id === packageId);
    return pkg ? Number(pkg.priceInRupees) : 0;
  };

  const getAttendanceMethodBadge = (method: AttendanceMethod) => {
    switch (method) {
      case AttendanceMethod.qrScan:
        return <Badge variant="default" className="text-[10px] md:text-xs">QR Scan</Badge>;
      case AttendanceMethod.manualEntry:
        return <Badge variant="secondary" className="text-[10px] md:text-xs">Manual</Badge>;
      case AttendanceMethod.autoCheckout:
        return <Badge variant="outline" className="text-[10px] md:text-xs">Auto</Badge>;
      default:
        return <Badge variant="secondary" className="text-[10px] md:text-xs">Unknown</Badge>;
    }
  };

  if (!memberId) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">My Dashboard</h2>
          <p className="text-sm md:text-base text-muted-foreground">Your personalized fitness dashboard</p>
        </div>
        <Alert>
          <AlertDescription>
            You are not registered as a gym member yet. Please contact an administrator to set up your membership.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const hasDiscount = memberProfile && memberProfile.discountAmount && Number(memberProfile.discountAmount) > 0;
  const originalPrice = memberProfile ? getPackagePrice(memberProfile.packageId) : 0;

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">My Dashboard</h2>
        <p className="text-sm md:text-base text-muted-foreground">Your personalized fitness dashboard</p>
      </div>

      {/* QR Attendance Card */}
      <QRAttendanceCard memberId={memberId} />

      {/* Membership Status Card */}
      {profileLoading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </CardContent>
        </Card>
      ) : memberProfile ? (
        <MemberMembershipStatusCard
          memberProfile={memberProfile}
          pauseRequestStatus={pauseRequestStatus}
        />
      ) : null}

      {/* Membership Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 rounded-full p-2">
              <User className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg md:text-xl">Membership Information</CardTitle>
              <CardDescription className="text-xs md:text-sm">Your current membership details</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {profileLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : memberProfile ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs md:text-sm text-muted-foreground">Status:</span>
                <Badge variant={isMembershipActive && !isPaused ? 'default' : 'destructive'} className="text-xs">
                  {isPaused ? 'Paused' : isMembershipActive ? 'Active' : 'Expired'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs md:text-sm text-muted-foreground">Package:</span>
                <span className="text-xs md:text-sm font-medium">{getPackageName(memberProfile.packageId)}</span>
              </div>
              {hasDiscount ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs md:text-sm text-muted-foreground">Original Price:</span>
                    <span className="text-xs md:text-sm line-through text-muted-foreground">
                      {formatINR(originalPrice)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs md:text-sm text-muted-foreground">Discount Applied:</span>
                    <span className="text-xs md:text-sm text-green-600 dark:text-green-400 font-medium">
                      - {formatINR(memberProfile.discountAmount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-xs md:text-sm text-muted-foreground">Amount Paid:</span>
                    <span className="text-sm md:text-base text-primary">
                      {formatINR(memberProfile.finalPayableAmount)}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-xs md:text-sm text-muted-foreground">Package Price:</span>
                  <span className="text-xs md:text-sm font-medium">{formatINR(originalPrice)}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs md:text-sm text-muted-foreground">Membership Expires:</span>
                <span className="text-xs md:text-sm font-medium">
                  {new Date(Number(memberProfile.membershipEnd) / 1000000).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs md:text-sm text-muted-foreground">Contact:</span>
                <span className="text-xs md:text-sm font-medium">{memberProfile.contactInfo}</span>
              </div>
              
              {/* Pause/Resume Membership */}
              <div className="pt-3 border-t">
                {isPaused ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="default" size="sm" className="w-full" disabled={resumeMembership.isPending}>
                        <Play className="mr-2 h-4 w-4" />
                        Resume Membership
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Resume Membership</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to resume your membership? You will regain access to all gym facilities and services.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleResumeMembership}>
                          Resume
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full" 
                        disabled={initiatePauseRequest.isPending || hasPendingRequest}
                      >
                        <Pause className="mr-2 h-4 w-4" />
                        {hasPendingRequest ? 'Pause Request Pending' : 'Request Pause'}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Request Membership Pause</AlertDialogTitle>
                        <AlertDialogDescription>
                          Your pause request will be sent to the admin for approval. You will temporarily lose access to gym facilities once approved.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handlePauseMembership}>
                          Submit Request
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          ) : (
            <p className="text-xs md:text-sm text-muted-foreground">No membership information available</p>
          )}
        </CardContent>
      </Card>

      {/* Diet Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="bg-green-100 dark:bg-green-950 rounded-full p-2">
              <Apple className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-lg md:text-xl">My Diet Chart</CardTitle>
              <CardDescription className="text-xs md:text-sm">Your personalized nutrition plan</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {dietLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : diet ? (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-base md:text-lg">{diet.name}</h4>
                <p className="text-xs md:text-sm text-muted-foreground">{diet.description}</p>
              </div>
              <div className="space-y-3">
                {diet.meals.map((meal, index) => (
                  <div key={index} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium text-sm md:text-base">{meal.name}</h5>
                      <Badge variant="secondary" className="text-xs">{Number(meal.calories)} cal</Badge>
                    </div>
                    <p className="text-xs md:text-sm text-muted-foreground">{meal.description}</p>
                    <div className="flex gap-3 md:gap-4 text-[10px] md:text-xs text-muted-foreground">
                      <span>Protein: {Number(meal.protein)}g</span>
                      <span>Carbs: {Number(meal.carbs)}g</span>
                      <span>Fats: {Number(meal.fats)}g</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs md:text-sm text-muted-foreground">No diet chart assigned yet</p>
          )}
        </CardContent>
      </Card>

      {/* Workout Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 dark:bg-orange-950 rounded-full p-2">
              <Dumbbell className="h-4 w-4 md:h-5 md:w-5 text-orange-600" />
            </div>
            <div>
              <CardTitle className="text-lg md:text-xl">My Workout Chart</CardTitle>
              <CardDescription className="text-xs md:text-sm">Your personalized exercise routine</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {workoutLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : workout ? (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-base md:text-lg">{workout.name}</h4>
                <p className="text-xs md:text-sm text-muted-foreground">{workout.description}</p>
              </div>
              <div className="space-y-3">
                {workout.exercises.map((exercise, index) => (
                  <div key={index} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium text-sm md:text-base">{exercise.name}</h5>
                      <Badge variant="secondary" className="text-xs">
                        {Number(exercise.sets)} × {Number(exercise.reps)}
                      </Badge>
                    </div>
                    <p className="text-xs md:text-sm text-muted-foreground">{exercise.instructions}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs md:text-sm text-muted-foreground">No workout chart assigned yet</p>
          )}
        </CardContent>
      </Card>

      {/* Attendance History */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 dark:bg-blue-950 rounded-full p-2">
              <CalendarCheck className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg md:text-xl">My Attendance History</CardTitle>
              <CardDescription className="text-xs md:text-sm">Your recent gym visits</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {attendanceLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : attendance && attendance.length > 0 ? (
            <div className="overflow-x-auto -mx-2 md:mx-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs md:text-sm">Check-In</TableHead>
                    <TableHead className="text-xs md:text-sm">Check-Out</TableHead>
                    <TableHead className="text-xs md:text-sm">Method</TableHead>
                    <TableHead className="text-xs md:text-sm">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendance.slice(0, 10).map((record, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-[10px] md:text-sm">{formatTime(record.checkInTime)}</TableCell>
                      <TableCell className="text-[10px] md:text-sm">
                        {record.checkOutTime ? formatTime(record.checkOutTime) : '-'}
                      </TableCell>
                      <TableCell>{getAttendanceMethodBadge(record.method)}</TableCell>
                      <TableCell>
                        <Badge variant={record.status === 'checked_in' ? 'default' : 'secondary'} className="text-[10px] md:text-xs">
                          {record.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-xs md:text-sm text-muted-foreground">No attendance records yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
