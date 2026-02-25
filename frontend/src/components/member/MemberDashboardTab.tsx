import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Calendar, Package, User, AlertCircle, CheckCircle, PauseCircle, Clock } from 'lucide-react';
import type { MemberProfile } from '../../backend';
import { MembershipStatus, PauseRequestStatus } from '../../backend';
import { useGetPauseRequestStatus, useInitiatePauseRequest, useResumeMembership } from '../../hooks/useQueries';
import MemberMembershipStatusCard from './MemberMembershipStatusCard';
import QRAttendanceCard from './QRAttendanceCard';

interface MemberDashboardTabProps {
  memberId: string;
  memberProfile: MemberProfile | null;
}

function formatDate(timestamp: bigint | number): string {
  const ms = typeof timestamp === 'bigint' ? Number(timestamp) / 1_000_000 : timestamp;
  return new Date(ms).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function MemberDashboardTab({ memberId, memberProfile }: MemberDashboardTabProps) {
  const { data: pauseStatus, isLoading: pauseLoading } = useGetPauseRequestStatus(memberId);
  const initiatePause = useInitiatePauseRequest();
  const resumeMembership = useResumeMembership();

  const handlePauseRequest = async () => {
    try {
      await initiatePause.mutateAsync(memberId);
    } catch {
      // Error handled by mutation state
    }
  };

  const handleResume = async () => {
    try {
      await resumeMembership.mutateAsync(memberId);
    } catch {
      // Error handled by mutation state
    }
  };

  if (!memberProfile) {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Unable to load membership details. Your login is valid — please try refreshing.
          </AlertDescription>
        </Alert>
        <QRAttendanceCard memberId={memberId} />
      </div>
    );
  }

  const isPaused = memberProfile.status === MembershipStatus.paused;
  const isActive = memberProfile.status === MembershipStatus.active;
  const hasPendingRequest = pauseStatus?.status === PauseRequestStatus.pending;
  const hasDeniedRequest = pauseStatus?.status === PauseRequestStatus.denied;

  // Build the pauseRequestStatus shape expected by MemberMembershipStatusCard
  const pauseRequestStatusForCard = pauseStatus
    ? {
        requestId: pauseStatus.requestId,
        status: pauseStatus.status as PauseRequestStatus,
        adminMessage: pauseStatus.adminMessage,
      }
    : null;

  return (
    <div className="space-y-4">
      {/* Membership Status Card */}
      <MemberMembershipStatusCard
        memberProfile={memberProfile}
        pauseRequestStatus={pauseRequestStatusForCard}
      />

      {/* QR Attendance */}
      {isActive && <QRAttendanceCard memberId={memberId} />}

      {/* Membership Info */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            Membership Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Name</span>
            <span className="font-medium">{memberProfile.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Member ID</span>
            <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">{memberProfile.id}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Start Date
            </span>
            <span>{formatDate(memberProfile.membershipStart)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" /> End Date
            </span>
            <span>{formatDate(memberProfile.membershipEnd)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground flex items-center gap-1">
              <Package className="w-3 h-3" /> Package
            </span>
            <span>{memberProfile.packageId}</span>
          </div>
        </CardContent>
      </Card>

      {/* Pause / Resume Controls */}
      {isActive && !hasPendingRequest && (
        <Card>
          <CardContent className="pt-4">
            {hasDeniedRequest && pauseStatus?.adminMessage && (
              <Alert variant="destructive" className="mb-3">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <strong>Pause request denied:</strong> {pauseStatus.adminMessage}
                </AlertDescription>
              </Alert>
            )}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handlePauseRequest}
              disabled={initiatePause.isPending}
            >
              {initiatePause.isPending ? (
                <><Loader2 className="w-3 h-3 mr-2 animate-spin" /> Requesting…</>
              ) : (
                <><PauseCircle className="w-3 h-3 mr-2" /> Request Membership Pause</>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {isActive && hasPendingRequest && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Your pause request is pending admin approval.
          </AlertDescription>
        </Alert>
      )}

      {isPaused && (
        <Card>
          <CardContent className="pt-4">
            <Button
              size="sm"
              className="w-full"
              onClick={handleResume}
              disabled={resumeMembership.isPending}
            >
              {resumeMembership.isPending ? (
                <><Loader2 className="w-3 h-3 mr-2 animate-spin" /> Resuming…</>
              ) : (
                <><CheckCircle className="w-3 h-3 mr-2" /> Resume Membership</>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
