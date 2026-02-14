import { useState } from 'react';
import { useGetAllMembershipPackages, useDeleteMembershipPackage } from '../../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, Package, Trash2, Edit } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import PackageFormDialog from './PackageFormDialog';
import type { MembershipPackage } from '../../backend';
import { formatINR, formatINRPerMonth } from '../../lib/currencyUtils';

export default function PackagesTab() {
  const { data: packages, isLoading } = useGetAllMembershipPackages();
  const deleteMutation = useDeleteMembershipPackage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPackage, setSelectedPackage] = useState<MembershipPackage | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [packageToDelete, setPackageToDelete] = useState<MembershipPackage | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const filteredPackages = packages?.filter((pkg) =>
    pkg.packageType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (pkg: MembershipPackage, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPackage(pkg);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedPackage(null);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (pkg: MembershipPackage, e: React.MouseEvent) => {
    e.stopPropagation();
    setPackageToDelete(pkg);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (packageToDelete) {
      await deleteMutation.mutateAsync(packageToDelete.id);
      setIsDeleteDialogOpen(false);
      setPackageToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setPackageToDelete(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Membership Packages</h2>
          <p className="text-muted-foreground">Manage membership plans and pricing in INR</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Create Package
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search packages..."
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
      ) : filteredPackages && filteredPackages.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPackages.map((pkg) => (
            <Card key={pkg.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-100 dark:bg-purple-950 rounded-full p-2">
                      <Package className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{pkg.packageType}</CardTitle>
                      <CardDescription className="text-xs">
                        {Number(pkg.durationInMonths)} month{Number(pkg.durationInMonths) !== 1 ? 's' : ''}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleEdit(pkg, e)}
                      className="h-8 w-8"
                      title="Edit package"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleDeleteClick(pkg, e)}
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      disabled={deleteMutation.isPending}
                      title="Delete package"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-3xl font-bold text-primary">{formatINR(pkg.priceInRupees)}</div>
                <div className="text-sm text-muted-foreground">
                  {formatINRPerMonth(pkg.priceInRupees, pkg.durationInMonths)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No packages found</p>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery ? 'Try adjusting your search' : 'Create your first membership package'}
            </p>
            {!searchQuery && (
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Create Package
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <PackageFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        package={selectedPackage}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this package?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the package "{packageToDelete?.packageType}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDelete} disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
