import { useState } from 'react';
import { useGetAllMembers, useGetAttendanceHistory, useRecordAttendance } from '../../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarCheck, Search, QrCode } from 'lucide-react';
import { AttendanceMethod, AttendanceRecord } from '../../backend';
import GymQRCodeGenerator from './GymQRCodeGenerator';

export default function AttendanceTab() {
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: members, isLoading: membersLoading } = useGetAllMembers();
  const { data: attendance, isLoading: attendanceLoading } = useGetAttendanceHistory(selectedMemberId || undefined);
  const recordAttendance = useRecordAttendance();

  const filteredMembers = members?.filter((member) =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleManualCheckIn = async () => {
    if (!selectedMemberId) return;

    const record: AttendanceRecord = {
      memberId: selectedMemberId,
      checkInTime: BigInt(Date.now() * 1000000),
      checkOutTime: undefined,
      status: 'checked_in',
      method: AttendanceMethod.manualEntry,
    };

    await recordAttendance.mutateAsync(record);
  };

  const handleManualCheckOut = async () => {
    if (!selectedMemberId || !attendance || attendance.length === 0) return;

    const lastRecord = attendance[attendance.length - 1];
    if (lastRecord.checkOutTime) {
      return; // Already checked out
    }

    const record: AttendanceRecord = {
      memberId: selectedMemberId,
      checkInTime: lastRecord.checkInTime,
      checkOutTime: BigInt(Date.now() * 1000000),
      status: 'checked_out',
      method: AttendanceMethod.manualEntry,
    };

    await recordAttendance.mutateAsync(record);
  };

  const formatTime = (time: bigint) => {
    const date = new Date(Number(time) / 1000000);
    return date.toLocaleString();
  };

  const getAttendanceMethodBadge = (method: AttendanceMethod) => {
    switch (method) {
      case AttendanceMethod.qrScan:
        return (
          <Badge variant="default" className="text-xs">
            <QrCode className="mr-1 h-3 w-3" />
            QR Scan
          </Badge>
        );
      case AttendanceMethod.manualEntry:
        return <Badge variant="secondary" className="text-xs">Manual</Badge>;
      case AttendanceMethod.autoCheckout:
        return <Badge variant="outline" className="text-xs">Auto</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">Unknown</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'checked_in':
        return <Badge variant="default" className="text-xs">Checked In</Badge>;
      case 'checked_out':
        return <Badge variant="secondary" className="text-xs">Checked Out</Badge>;
      case 'auto_checked_out':
        return <Badge variant="outline" className="text-xs">Auto Checked Out</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Attendance Management</h2>
        <p className="text-muted-foreground">Track and manage member attendance</p>
      </div>

      {/* Gym QR Code Generator */}
      <GymQRCodeGenerator />

      {/* Manual Attendance Entry */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 dark:bg-blue-950 rounded-full p-2">
              <CalendarCheck className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle>Manual Attendance Entry</CardTitle>
              <CardDescription>Record attendance manually for members</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="member-search">Search Member</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="member-search"
                placeholder="Search by name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="member-select">Select Member</Label>
            <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
              <SelectTrigger id="member-select">
                <SelectValue placeholder="Choose a member" />
              </SelectTrigger>
              <SelectContent>
                {membersLoading ? (
                  <div className="p-2">
                    <Skeleton className="h-8 w-full" />
                  </div>
                ) : filteredMembers && filteredMembers.length > 0 ? (
                  filteredMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name} ({member.id})
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-sm text-muted-foreground">No members found</div>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleManualCheckIn}
              disabled={!selectedMemberId || recordAttendance.isPending}
              className="flex-1"
            >
              Manual Check-In
            </Button>
            <Button
              onClick={handleManualCheckOut}
              disabled={!selectedMemberId || recordAttendance.isPending}
              variant="outline"
              className="flex-1"
            >
              Manual Check-Out
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Attendance History */}
      {selectedMemberId && (
        <Card>
          <CardHeader>
            <CardTitle>Attendance History</CardTitle>
            <CardDescription>
              Viewing attendance records for {members?.find((m) => m.id === selectedMemberId)?.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {attendanceLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : attendance && attendance.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Check-In Time</TableHead>
                      <TableHead>Check-Out Time</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendance.map((record, index) => (
                      <TableRow key={index}>
                        <TableCell className="text-sm">{formatTime(record.checkInTime)}</TableCell>
                        <TableCell className="text-sm">
                          {record.checkOutTime ? formatTime(record.checkOutTime) : '-'}
                        </TableCell>
                        <TableCell>{getAttendanceMethodBadge(record.method)}</TableCell>
                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No attendance records found for this member
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
