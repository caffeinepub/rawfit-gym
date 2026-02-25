import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Clock, XCircle, Pause } from 'lucide-react';
import { MemberProfile, PauseRequestStatus } from '../../backend';

interface MemberMembershipStatusCardProps {
  memberProfile: MemberProfile;
  pauseRequestStatus?: {
    requestId: string;
    status: PauseRequestStatus;
    adminMessage?: string;
  } | null;
}

export default function MemberMembershipStatusCard({
  memberProfile,
  pauseRequestStatus,
}: MemberMembershipStatusCardProps) {
  const isMembershipActive = Number(memberProfile.membershipEnd) > Date.now() * 1000000;
  const isPaused = memberProfile.status === 'paused';
  const hasPendingRequest = pauseRequestStatus?.status === PauseRequestStatus.pending;
  const isDenied = pauseRequestStatus?.status === PauseRequestStatus.denied || pauseRequestStatus?.status === PauseRequestStatus.expired;

  const getStatusDisplay = () => {
    if (isPaused) {
      return {
        label: 'Paused',
        variant: 'outline' as const,
        icon: <Pause className="h-4 w-4" />,
        color: 'text-orange-600',
      };
    }
    if (isMembershipActive) {
      return {
        label: 'Active',
        variant: 'default' as const,
        icon: <CheckCircle className="h-4 w-4" />,
        color: 'text-green-600',
      };
    }
    return {
      label: 'Expired',
      variant: 'destructive' as const,
      icon: <XCircle className="h-4 w-4" />,
      color: 'text-red-600',
    };
  };

  const status = getStatusDisplay();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg md:text-xl">Membership Status</CardTitle>
        <CardDescription className="text-xs md:text-sm">Current status and pause request information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
          <div className="flex items-center gap-2">
            <div className={status.color}>{status.icon}</div>
            <span className="text-sm font-medium">Current Status:</span>
          </div>
          <Badge variant={status.variant} className="text-xs">
            {status.label}
          </Badge>
        </div>

        {/* Pause Request Status */}
        {hasPendingRequest && (
          <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900">
            <Clock className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-xs md:text-sm text-orange-900 dark:text-orange-100">
              <strong>Pause request pending approval</strong>
              <p className="mt-1 text-xs text-orange-700 dark:text-orange-200">
                Your pause request is being reviewed by an administrator. You will be notified once a decision is made.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {isDenied && pauseRequestStatus?.adminMessage && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription className="text-xs md:text-sm">
              <strong>Pause request denied</strong>
              <p className="mt-1 text-xs">{pauseRequestStatus.adminMessage}</p>
            </AlertDescription>
          </Alert>
        )}

        {isDenied && !pauseRequestStatus?.adminMessage && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription className="text-xs md:text-sm">
              <strong>Pause request denied</strong>
              <p className="mt-1 text-xs">Your pause request was not approved. Please contact the administrator for more information.</p>
            </AlertDescription>
          </Alert>
        )}

        {isPaused && (
          <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900">
            <Pause className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-xs md:text-sm text-blue-900 dark:text-blue-100">
              <strong>Membership paused</strong>
              <p className="mt-1 text-xs text-blue-700 dark:text-blue-200">
                Your membership is currently paused. You can resume it at any time using the button below.
              </p>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
