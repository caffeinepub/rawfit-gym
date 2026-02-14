import { useGetAllPauseRequests, useApprovePauseRequest, useDenyPauseRequest, useGetAllMembers } from '../../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, XCircle, Clock, Bell } from 'lucide-react';
import { PauseRequestStatus } from '../../backend';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function PauseRequestNotifications() {
  const { data: pauseRequests, isLoading } = useGetAllPauseRequests();
  const { data: members } = useGetAllMembers();
  const approvePauseRequest = useApprovePauseRequest();
  const denyPauseRequest = useDenyPauseRequest();

  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isDenyDialogOpen, setIsDenyDialogOpen] = useState(false);
  const [adminMessage, setAdminMessage] = useState('');

  const getMemberName = (memberId: string) => {
    const member = members?.find((m) => m.id === memberId);
    return member?.name || 'Unknown Member';
  };

  const formatTime = (time: bigint) => {
    const date = new Date(Number(time) / 1000000);
    return date.toLocaleString();
  };

  const handleApprove = (requestId: string) => {
    setSelectedRequest(requestId);
    setAdminMessage('');
    setIsApproveDialogOpen(true);
  };

  const handleDeny = (requestId: string) => {
    setSelectedRequest(requestId);
    setAdminMessage('');
    setIsDenyDialogOpen(true);
  };

  const confirmApprove = async () => {
    if (selectedRequest) {
      await approvePauseRequest.mutateAsync({
        requestId: selectedRequest,
        adminMessage: adminMessage.trim() || undefined,
      });
      setIsApproveDialogOpen(false);
      setSelectedRequest(null);
      setAdminMessage('');
    }
  };

  const confirmDeny = async () => {
    if (selectedRequest) {
      await denyPauseRequest.mutateAsync({
        requestId: selectedRequest,
        adminMessage: adminMessage.trim() || undefined,
      });
      setIsDenyDialogOpen(false);
      setSelectedRequest(null);
      setAdminMessage('');
    }
  };

  const pendingRequests = pauseRequests?.filter((r) => r.status === PauseRequestStatus.pending) || [];

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="bg-orange-100 dark:bg-orange-950 rounded-lg p-2">
              <Bell className="h-5 w-5 text-orange-600" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl">Notifications</CardTitle>
              <CardDescription>Pending pause requests requiring your attention</CardDescription>
            </div>
            {pendingRequests.length > 0 && (
              <Badge variant="destructive" className="text-xs">
                {pendingRequests.length}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : pendingRequests.length > 0 ? (
            <div className="space-y-3">
              {pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="border rounded-lg p-4 space-y-3 bg-card hover:bg-accent/5 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          <Clock className="mr-1 h-3 w-3" />
                          Pending
                        </Badge>
                        <span className="text-sm font-medium">{getMemberName(request.memberId)}</span>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-0.5">
                        <div>Member ID: <span className="font-mono">{request.memberId}</span></div>
                        <div>Requested: {formatTime(request.requestedAt)}</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleApprove(request.id)}
                      disabled={approvePauseRequest.isPending || denyPauseRequest.isPending}
                      className="flex-1"
                    >
                      <CheckCircle className="mr-1 h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeny(request.id)}
                      disabled={approvePauseRequest.isPending || denyPauseRequest.isPending}
                      className="flex-1"
                    >
                      <XCircle className="mr-1 h-4 w-4" />
                      Deny
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm font-medium">No pending pause requests</p>
              <p className="text-xs text-muted-foreground mt-1">All requests have been processed</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approve Dialog */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Pause Request</DialogTitle>
            <DialogDescription>
              The member's account will be paused immediately after approval.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="approve-message">Message to Member (Optional)</Label>
              <Textarea
                id="approve-message"
                placeholder="Add a message for the member..."
                value={adminMessage}
                onChange={(e) => setAdminMessage(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmApprove} disabled={approvePauseRequest.isPending}>
              {approvePauseRequest.isPending ? 'Approving...' : 'Approve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deny Dialog */}
      <Dialog open={isDenyDialogOpen} onOpenChange={setIsDenyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deny Pause Request</DialogTitle>
            <DialogDescription>
              The member's account will remain active. Consider adding a reason for denial.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="deny-message">Reason for Denial (Optional)</Label>
              <Textarea
                id="deny-message"
                placeholder="Explain why the request was denied..."
                value={adminMessage}
                onChange={(e) => setAdminMessage(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDenyDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeny} disabled={denyPauseRequest.isPending}>
              {denyPauseRequest.isPending ? 'Denying...' : 'Deny Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
