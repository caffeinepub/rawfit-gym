import { useState } from 'react';
import { useGetAllMembers, useGetAllMembershipPackages } from '../../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, User, IdCard } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import MemberFormDialog from './MemberFormDialog';
import type { MemberProfile } from '../../backend';
import { formatINR } from '../../lib/currencyUtils';
import { MembershipStatus } from '../../backend';

export default function MembersTab() {
  const { data: members, isLoading } = useGetAllMembers();
  const { data: packages } = useGetAllMembershipPackages();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<MemberProfile | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredMembers = members?.filter((member) =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.contactInfo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPackageName = (packageId: string) => {
    return packages?.find((pkg) => pkg.id === packageId)?.packageType || 'Unknown';
  };

  const getPackagePrice = (packageId: string) => {
    const pkg = packages?.find((p) => p.id === packageId);
    return pkg ? Number(pkg.priceInRupees) : 0;
  };

  const isMembershipActive = (member: MemberProfile) => {
    const now = Date.now() * 1000000; // Convert to nanoseconds
    return Number(member.membershipEnd) > now && member.status === MembershipStatus.active;
  };

  const getMemberStatusBadge = (member: MemberProfile) => {
    const now = Date.now() * 1000000;
    const isExpired = Number(member.membershipEnd) <= now;

    if (member.status === MembershipStatus.paused) {
      return <Badge variant="outline" className="bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-300 border-orange-300">Paused</Badge>;
    } else if (isExpired) {
      return <Badge variant="destructive">Expired</Badge>;
    } else {
      return <Badge variant="default">Active</Badge>;
    }
  };

  const handleEdit = (member: MemberProfile) => {
    setSelectedMember(member);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedMember(null);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Members</h2>
          <p className="text-muted-foreground">Manage gym member profiles and registrations</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Member
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search members by name, contact, or membership ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredMembers && filteredMembers.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredMembers.map((member) => {
            const hasDiscount = member.discountAmount && Number(member.discountAmount) > 0;
            const originalPrice = getPackagePrice(member.packageId);
            
            return (
              <Card key={member.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleEdit(member)}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 rounded-full p-2">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{member.name}</CardTitle>
                        <CardDescription className="text-xs">{member.contactInfo}</CardDescription>
                      </div>
                    </div>
                  </div>
                  {/* Prominent Membership ID Display */}
                  <div className="flex items-center gap-2 mt-3 px-3 py-2 bg-primary/5 rounded-md border border-primary/20">
                    <IdCard className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold text-primary">ID: {member.id}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Package:</span>
                    <span className="font-medium">{getPackageName(member.packageId)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Status:</span>
                    {getMemberStatusBadge(member)}
                  </div>
                  {hasDiscount ? (
                    <>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Original Price:</span>
                        <span className="line-through text-muted-foreground text-xs">
                          {formatINR(originalPrice)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Discount:</span>
                        <span className="text-green-600 dark:text-green-400 font-medium">
                          - {formatINR(member.discountAmount)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm font-semibold">
                        <span className="text-muted-foreground">Final Price:</span>
                        <span className="text-primary">
                          {formatINR(member.finalPayableAmount)}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Price:</span>
                      <span className="font-medium">{formatINR(originalPrice)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Expires:</span>
                    <span className="font-medium">
                      {new Date(Number(member.membershipEnd) / 1000000).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No members found</p>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery ? 'Try adjusting your search' : 'Get started by adding your first member'}
            </p>
            {!searchQuery && (
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Add Member
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <MemberFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        member={selectedMember}
      />
    </div>
  );
}
