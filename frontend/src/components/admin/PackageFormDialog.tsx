import { useState, useEffect } from 'react';
import { useCreateMembershipPackage, useUpdateMembershipPackage } from '../../hooks/useQueries';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { formatINR } from '../../lib/currencyUtils';
import type { MembershipPackage } from '../../backend';

interface PackageFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  package: MembershipPackage | null;
}

export default function PackageFormDialog({ open, onOpenChange, package: pkg }: PackageFormDialogProps) {
  const createPackage = useCreateMembershipPackage();
  const updatePackage = useUpdateMembershipPackage();

  const [formData, setFormData] = useState({
    packageType: '',
    durationInMonths: '',
    priceInRupees: '',
  });

  useEffect(() => {
    if (pkg) {
      setFormData({
        packageType: pkg.packageType,
        durationInMonths: Number(pkg.durationInMonths).toString(),
        priceInRupees: Number(pkg.priceInRupees).toString(),
      });
    } else {
      setFormData({
        packageType: '',
        durationInMonths: '',
        priceInRupees: '',
      });
    }
  }, [pkg, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const packageData: MembershipPackage = {
      id: pkg?.id || `package_${Date.now()}`,
      packageType: formData.packageType,
      durationInMonths: BigInt(formData.durationInMonths),
      priceInRupees: BigInt(formData.priceInRupees),
    };

    if (pkg) {
      updatePackage.mutate(packageData, {
        onSuccess: () => onOpenChange(false),
      });
    } else {
      createPackage.mutate(packageData, {
        onSuccess: () => onOpenChange(false),
      });
    }
  };

  const isPending = createPackage.isPending || updatePackage.isPending;

  // Preview formatted price if valid
  const previewPrice = formData.priceInRupees && !isNaN(Number(formData.priceInRupees)) 
    ? formatINR(Number(formData.priceInRupees))
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{pkg ? 'Edit Package' : 'Create Package'}</DialogTitle>
          <DialogDescription>
            {pkg ? 'Update membership package details' : 'Create a new membership package'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="packageType">Package Type *</Label>
            <Input
              id="packageType"
              placeholder="e.g., Basic, Premium, VIP"
              value={formData.packageType}
              onChange={(e) => setFormData({ ...formData, packageType: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duration (months) *</Label>
            <Input
              id="duration"
              type="number"
              min="1"
              placeholder="e.g., 6"
              value={formData.durationInMonths}
              onChange={(e) => setFormData({ ...formData, durationInMonths: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="priceInRupees">Price (₹ INR) *</Label>
            <Input
              id="priceInRupees"
              type="number"
              min="0"
              placeholder="Enter price in INR (₹)"
              value={formData.priceInRupees}
              onChange={(e) => setFormData({ ...formData, priceInRupees: e.target.value })}
              required
            />
            <p className="text-xs text-muted-foreground">
              Enter the amount in Indian Rupees. Example: 1499 will display as ₹1,499
            </p>
            {previewPrice && (
              <p className="text-sm font-medium text-primary">
                Preview: {previewPrice}
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="flex-1">
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : pkg ? (
                'Update Package'
              ) : (
                'Create Package'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
