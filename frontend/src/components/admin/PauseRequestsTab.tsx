import { useState } from 'react';
import { useGetAllPauseRequests, useApprovePauseRequest, useDenyPauseRequest, useGetAllMembers } from '../../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, XCircle, Clock, User } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PauseRequestStatus } from '../../backend';
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

export default function PauseRequestsTab() {
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

  const getMemberContact = (memberId: string) => {
    const member = members?.find((m) => m.id === memberId);
    return member?.contactInfo || 'N/A';
  };

  const formatTime = (time: bigint) => {
    const date = new Date(Number(time) / 1000000);
    return date.toLocaleString();
  };

  const getStatusBadge = (status: PauseRequestStatus) => {
    switch (status) {
      case PauseRequestStatus.pending:
        return <Badge variant="outline" className="text-xs"><Clock className="mr-1 h-3 w-3" />Pending</Badge>;
      case PauseRequestStatus.approved:
        return <Badge variant="default" className="text-xs bg-green-600"><CheckCircle className="mr-1 h-3 w-3" />Approved</Badge>;
      case PauseRequestStatus.denied:
        return <Badge variant="destructive" className="text-xs"><XCircle className="mr-1 h-3 w-3" />Denied</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">Unknown</Badge>;
    }
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
        adminMessage: adminMessage.trim() || null,
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
        adminMessage: adminMessage.trim() || null,
      });
      setIsDenyDialogOpen(false);
      setSelectedRequest(null);
      setAdminMessage('');
    }
  };

  const pendingRequests = pauseRequests?.filter((r) => r.status === PauseRequestStatus.pending) || [];
  const processedRequests = pauseRequests?.filter((r) => r.status !== PauseRequestStatus.pending) || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Pause Requests</h2>
        <p className="text-muted-foreground">Review and manage member pause requests</p>
      </div>

      {/* Pending Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-600" />
            Pending Requests
          </CardTitle>
          <CardDescription>Requests awaiting your approval</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : pendingRequests.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member ID</TableHead>
                    <TableHead>Member Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Requested At</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-mono text-sm">{request.memberId}</TableCell>
                      <TableCell className="font-medium">{getMemberName(request.memberId)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{getMemberContact(request.memberId)}</TableCell>
                      <TableCell className="text-sm">{formatTime(request.requestedAt)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleApprove(request.id)}
                            disabled={approvePauseRequest.isPending || denyPauseRequest.isPending}
                          >
                            <CheckCircle className="mr-1 h-4 w-4" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeny(request.id)}
                            disabled={approvePauseRequest.isPending || denyPauseRequest.isPending}
                          >
                            <XCircle className="mr-1 h-4 w-4" />
                            Deny
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No pending requests</p>
              <p className="text-sm text-muted-foreground">All pause requests have been processed</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processed Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Request History</CardTitle>
          <CardDescription>Previously processed pause requests</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : processedRequests.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member ID</TableHead>
                    <TableHead>Member Name</TableHead>
                    <TableHead>Requested At</TableHead>
                    <TableHead>Processed At</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Admin Message</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-mono text-sm">{request.memberId}</TableCell>
                      <TableCell className="font-medium">{getMemberName(request.memberId)}</TableCell>
                      <TableCell className="text-sm">{formatTime(request.requestedAt)}</TableCell>
                      <TableCell className="text-sm">
                        {request.processedAt ? formatTime(request.processedAt) : '-'}
                      </TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                        {request.adminMessage || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <User className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No processed requests</p>
              <p className="text-sm text-muted-foreground">Request history will appear here</p>
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
    </div>
  );
}
