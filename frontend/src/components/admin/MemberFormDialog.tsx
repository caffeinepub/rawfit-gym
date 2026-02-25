import { useState, useEffect, Suspense } from 'react';
import { useCreateMember, useUpdateMember, useGetAllMembershipPackages, useGetAllDietCharts, useGetAllWorkoutCharts } from '../../hooks/useQueries';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, AlertCircle, Info, IdCard, Calendar as CalendarIcon } from 'lucide-react';
import { ErrorBoundary } from '../ErrorBoundary';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { MemberProfile } from '../../backend';
import { MembershipStatus } from '../../backend';
import { formatINR } from '../../lib/currencyUtils';

interface MemberFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: MemberProfile | null;
}

// Safe default form state with all required fields initialized to non-null values
const getDefaultFormData = () => ({
  name: '',
  contactInfo: '',
  packageId: '',
  assignedDietId: '',
  assignedWorkoutId: '',
  membershipStart: new Date(),
  membershipEnd: new Date(new Date().setMonth(new Date().getMonth() + 1)), // Default 1 month from now
  status: MembershipStatus.active,
  discount: '',
});

function FormLoadingSkeleton() {
  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-3 text-sm text-muted-foreground">Loading member form...</span>
      </div>
    </div>
  );
}

function FormErrorFallback({ onClose, error }: { onClose: () => void; error?: string }) {
  return (
    <>
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error || 'Member form failed to load. Please refresh and try again.'}
        </AlertDescription>
      </Alert>
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button onClick={() => window.location.reload()}>
          Refresh Page
        </Button>
      </div>
    </>
  );
}

// Parse discount input (supports "10%" or "500")
function parseDiscount(discountStr: string): { type: 'percentage' | 'flat' | 'none'; value: number } {
  const trimmed = discountStr.trim();
  if (!trimmed) return { type: 'none', value: 0 };
  
  if (trimmed.endsWith('%')) {
    const percentValue = parseFloat(trimmed.slice(0, -1));
    if (isNaN(percentValue) || percentValue < 0 || percentValue > 100) {
      return { type: 'none', value: 0 };
    }
    return { type: 'percentage', value: percentValue };
  }
  
  const flatValue = parseFloat(trimmed);
  if (isNaN(flatValue) || flatValue < 0) {
    return { type: 'none', value: 0 };
  }
  return { type: 'flat', value: flatValue };
}

// Calculate discount amount and final price
function calculatePricing(packagePrice: number, discountStr: string): { discountAmount: number; finalPrice: number } {
  const discount = parseDiscount(discountStr);
  
  if (discount.type === 'none') {
    return { discountAmount: 0, finalPrice: packagePrice };
  }
  
  if (discount.type === 'percentage') {
    const discountAmount = Math.round((packagePrice * discount.value) / 100);
    return { discountAmount, finalPrice: Math.max(0, packagePrice - discountAmount) };
  }
  
  // Flat discount
  const discountAmount = Math.min(discount.value, packagePrice); // Can't discount more than package price
  return { discountAmount, finalPrice: Math.max(0, packagePrice - discountAmount) };
}

// Generate auto membership ID
function generateMembershipId(): string {
  return `RF${Date.now().toString().slice(-6)}`;
}

function MemberFormContent({ open, onOpenChange, member }: MemberFormDialogProps) {
  const createMember = useCreateMember();
  const updateMember = useUpdateMember();
  
  // Fetch backend data with safe defaults
  const { 
    data: packages, 
    isLoading: packagesLoading, 
    error: packagesError, 
    isFetched: packagesFetched 
  } = useGetAllMembershipPackages();
  
  const { 
    data: diets, 
    isLoading: dietsLoading, 
    isFetched: dietsFetched 
  } = useGetAllDietCharts();
  
  const { 
    data: workouts, 
    isLoading: workoutsLoading, 
    isFetched: workoutsFetched 
  } = useGetAllWorkoutCharts();

  // Initialize with safe default values - guaranteed non-null
  const [formData, setFormData] = useState(getDefaultFormData());
  const [autoGeneratedId, setAutoGeneratedId] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Log form initialization for debugging
  useEffect(() => {
    if (open) {
      console.log('[MemberFormDialog] Dialog opened', {
        mode: member ? 'edit' : 'create',
        memberId: member?.id,
        packagesLoaded: !!packages,
        packagesCount: packages?.length || 0,
        dietsLoaded: !!diets,
        workoutsLoaded: !!workouts,
      });
    }
  }, [open, member, packages, diets, workouts]);

  // Reset form when dialog opens/closes or member changes
  useEffect(() => {
    if (open) {
      try {
        setValidationErrors({});
        
        if (member) {
          // Edit mode: populate with member data, ensuring all fields are non-null
          console.log('[MemberFormDialog] Initializing edit mode with member:', member.id);
          
          // Reconstruct discount string from stored values
          let discountStr = '';
          if (member.discountAmount && Number(member.discountAmount) > 0) {
            // Try to determine if it was percentage or flat based on the values
            const pkg = packages?.find(p => p.id === member.packageId);
            if (pkg) {
              const packagePrice = Number(pkg.priceInRupees);
              const discountAmt = Number(member.discountAmount);
              const percentage = (discountAmt / packagePrice) * 100;
              
              // If it's a round percentage, show as percentage
              if (Math.abs(percentage - Math.round(percentage)) < 0.01) {
                discountStr = `${Math.round(percentage)}%`;
              } else {
                discountStr = discountAmt.toString();
              }
            } else {
              discountStr = Number(member.discountAmount).toString();
            }
          }
          
          setFormData({
            name: member.name || '',
            contactInfo: member.contactInfo || '',
            packageId: member.packageId || '',
            assignedDietId: member.assignedDietId || '',
            assignedWorkoutId: member.assignedWorkoutId || '',
            membershipStart: new Date(Number(member.membershipStart) / 1000000),
            membershipEnd: new Date(Number(member.membershipEnd) / 1000000),
            status: member.status || MembershipStatus.active,
            discount: discountStr,
          });
          setAutoGeneratedId(''); // No auto-generated ID for edit mode
        } else {
          // Create mode: reset to safe defaults and generate new ID
          console.log('[MemberFormDialog] Initializing create mode with defaults');
          setFormData(getDefaultFormData());
          setAutoGeneratedId(generateMembershipId());
        }
      } catch (error) {
        console.error('[MemberFormDialog] Error initializing form:', error);
        // Fallback to safe defaults on any error
        setFormData(getDefaultFormData());
        setAutoGeneratedId(generateMembershipId());
      }
    }
  }, [member, open, packages]);

  // Reset mutation states when dialog closes
  useEffect(() => {
    if (!open) {
      createMember.reset();
      updateMember.reset();
    }
  }, [open, createMember, updateMember]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      errors.name = 'Name is required';
    }
    if (!formData.contactInfo?.trim()) {
      errors.contactInfo = 'Contact information is required';
    }
    if (!formData.packageId || formData.packageId.trim() === '') {
      errors.packageId = 'Please select a membership package';
    }
    
    // Validate dates
    if (!formData.membershipStart) {
      errors.membershipStart = 'Membership start date is required';
    }
    if (!formData.membershipEnd) {
      errors.membershipEnd = 'Membership end date is required';
    }
    if (formData.membershipStart && formData.membershipEnd && formData.membershipEnd <= formData.membershipStart) {
      errors.membershipEnd = 'End date must be after start date';
    }
    
    // Validate discount format
    if (formData.discount.trim()) {
      const discount = parseDiscount(formData.discount);
      if (discount.type === 'none') {
        errors.discount = 'Invalid discount format. Use "10%" for percentage or "500" for flat amount';
      } else if (discount.type === 'percentage' && (discount.value < 0 || discount.value > 100)) {
        errors.discount = 'Percentage must be between 0 and 100';
      } else if (discount.type === 'flat') {
        const pkg = packages?.find(p => p.id === formData.packageId);
        if (pkg && discount.value > Number(pkg.priceInRupees)) {
          errors.discount = 'Discount cannot exceed package price';
        }
      }
    }

    setValidationErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      console.log('[MemberFormDialog] Validation errors:', errors);
    }
    
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('[MemberFormDialog] Form submitted', { formData });
    
    if (!validateForm()) {
      console.log('[MemberFormDialog] Validation failed', validationErrors);
      return;
    }
    
    try {
      const membershipStart = BigInt(formData.membershipStart.getTime() * 1000000);
      const membershipEnd = BigInt(formData.membershipEnd.getTime() * 1000000);

      // Calculate discount and final price
      const selectedPackage = packages?.find(p => p.id === formData.packageId);
      const packagePrice = selectedPackage ? Number(selectedPackage.priceInRupees) : 0;
      const { discountAmount, finalPrice } = calculatePricing(packagePrice, formData.discount);

      // Ensure optional fields are undefined (not empty strings) for backend compatibility
      const profileData: MemberProfile = {
        id: member?.id || autoGeneratedId,
        name: formData.name.trim(),
        contactInfo: formData.contactInfo.trim(),
        packageId: formData.packageId.trim(),
        assignedDietId: formData.assignedDietId && formData.assignedDietId.trim() !== '' 
          ? formData.assignedDietId.trim() 
          : undefined,
        assignedWorkoutId: formData.assignedWorkoutId && formData.assignedWorkoutId.trim() !== '' 
          ? formData.assignedWorkoutId.trim() 
          : undefined,
        membershipStart,
        membershipEnd,
        status: formData.status,
        discountAmount: BigInt(discountAmount),
        finalPayableAmount: BigInt(finalPrice),
      };

      console.log('[MemberFormDialog] Submitting profile data:', profileData);

      if (member) {
        await updateMember.mutateAsync(profileData);
        console.log('[MemberFormDialog] Member updated successfully');
        onOpenChange(false);
      } else {
        await createMember.mutateAsync(profileData);
        console.log('[MemberFormDialog] Member created successfully');
        onOpenChange(false);
      }
    } catch (error) {
      console.error('[MemberFormDialog] Error in handleSubmit:', error);
      // Error is already handled by mutation onError callback with toast
    }
  };

  const isPending = createMember.isPending || updateMember.isPending;
  const isDataLoading = packagesLoading || dietsLoading || workoutsLoading;
  const isDataFetched = packagesFetched && dietsFetched && workoutsFetched;

  // Calculate pricing for display
  const selectedPackage = packages?.find(p => p.id === formData.packageId);
  const packagePrice = selectedPackage ? Number(selectedPackage.priceInRupees) : 0;
  const { discountAmount, finalPrice } = calculatePricing(packagePrice, formData.discount);
  const hasDiscount = discountAmount > 0;

  // Show loading state while data is being fetched
  if (isDataLoading && !isDataFetched) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{member ? 'Edit Member' : 'Add New Member'}</DialogTitle>
            <DialogDescription>Loading form data...</DialogDescription>
          </DialogHeader>
          <FormLoadingSkeleton />
        </DialogContent>
      </Dialog>
    );
  }

  // Show error if packages failed to load (required data)
  if (packagesError) {
    console.error('[MemberFormDialog] Packages loading error:', packagesError);
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{member ? 'Edit Member' : 'Add New Member'}</DialogTitle>
            <DialogDescription>Unable to load form data</DialogDescription>
          </DialogHeader>
          <FormErrorFallback 
            onClose={() => onOpenChange(false)} 
            error="Failed to load membership packages. Please check your connection and try again."
          />
        </DialogContent>
      </Dialog>
    );
  }

  // Safe fallback for arrays - ensure they're always arrays
  const safePackages = Array.isArray(packages) ? packages : [];
  const safeDiets = Array.isArray(diets) ? diets : [];
  const safeWorkouts = Array.isArray(workouts) ? workouts : [];

  console.log('[MemberFormDialog] Rendering form with data:', {
    packagesCount: safePackages.length,
    dietsCount: safeDiets.length,
    workoutsCount: safeWorkouts.length,
  });

  // Show warning if no packages exist
  if (safePackages.length === 0 && !member) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Cannot Add Member</DialogTitle>
            <DialogDescription>Membership packages are required</DialogDescription>
          </DialogHeader>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              You need to create at least one membership package before adding members. 
              Please go to the Packages tab and create a package first.
            </AlertDescription>
          </Alert>
          <div className="flex justify-end pt-4">
            <Button onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{member ? 'Edit Member' : 'Add New Member'}</DialogTitle>
          <DialogDescription>
            {member ? 'Update member information and assignments' : 'Create a new member profile'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Auto-Generated Membership ID Display (Create Mode Only) */}
          {!member && autoGeneratedId && (
            <div className="rounded-lg border bg-primary/5 border-primary/20 p-4">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 rounded-full p-2">
                  <IdCard className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <Label className="text-sm font-semibold text-primary">Membership ID</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Auto-generated: <span className="font-mono font-semibold text-primary">{autoGeneratedId}</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Edit Mode: Show Current Membership ID */}
          {member && (
            <div className="rounded-lg border bg-muted/50 p-4">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 rounded-full p-2">
                  <IdCard className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <Label className="text-sm font-semibold">Membership ID</Label>
                  <p className="text-sm font-mono font-semibold text-primary mt-1">{member.id}</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (validationErrors.name) {
                  setValidationErrors({ ...validationErrors, name: '' });
                }
              }}
              placeholder="Enter member's full name"
              disabled={isPending}
              className={validationErrors.name ? 'border-destructive' : ''}
            />
            {validationErrors.name && (
              <p className="text-sm text-destructive">{validationErrors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact">Contact Info *</Label>
            <Input
              id="contact"
              placeholder="Email or phone number"
              value={formData.contactInfo}
              onChange={(e) => {
                setFormData({ ...formData, contactInfo: e.target.value });
                if (validationErrors.contactInfo) {
                  setValidationErrors({ ...validationErrors, contactInfo: '' });
                }
              }}
              disabled={isPending}
              className={validationErrors.contactInfo ? 'border-destructive' : ''}
            />
            {validationErrors.contactInfo && (
              <p className="text-sm text-destructive">{validationErrors.contactInfo}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="package">Membership Package *</Label>
            <Select 
              value={formData.packageId} 
              onValueChange={(value) => {
                setFormData({ ...formData, packageId: value });
                if (validationErrors.packageId) {
                  setValidationErrors({ ...validationErrors, packageId: '' });
                }
              }}
              disabled={isPending || safePackages.length === 0}
            >
              <SelectTrigger className={validationErrors.packageId ? 'border-destructive' : ''}>
                <SelectValue placeholder={safePackages.length === 0 ? 'No packages available' : 'Select a package'} />
              </SelectTrigger>
              <SelectContent>
                {safePackages.length > 0 ? (
                  safePackages.map((pkg) => (
                    <SelectItem key={pkg.id} value={pkg.id}>
                      {pkg.packageType} - {formatINR(pkg.priceInRupees)} ({Number(pkg.durationInMonths)} months)
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-packages" disabled>
                    No packages available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {validationErrors.packageId && (
              <p className="text-sm text-destructive">{validationErrors.packageId}</p>
            )}
          </div>

          {/* Custom Date Pickers */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Membership Start Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !formData.membershipStart && 'text-muted-foreground',
                      validationErrors.membershipStart && 'border-destructive'
                    )}
                    disabled={isPending}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.membershipStart ? format(formData.membershipStart, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.membershipStart}
                    onSelect={(date) => {
                      if (date) {
                        setFormData({ ...formData, membershipStart: date });
                        if (validationErrors.membershipStart) {
                          setValidationErrors({ ...validationErrors, membershipStart: '' });
                        }
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {validationErrors.membershipStart && (
                <p className="text-sm text-destructive">{validationErrors.membershipStart}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Membership End Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !formData.membershipEnd && 'text-muted-foreground',
                      validationErrors.membershipEnd && 'border-destructive'
                    )}
                    disabled={isPending}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.membershipEnd ? format(formData.membershipEnd, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.membershipEnd}
                    onSelect={(date) => {
                      if (date) {
                        setFormData({ ...formData, membershipEnd: date });
                        if (validationErrors.membershipEnd) {
                          setValidationErrors({ ...validationErrors, membershipEnd: '' });
                        }
                      }
                    }}
                    disabled={(date) => formData.membershipStart ? date <= formData.membershipStart : false}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {validationErrors.membershipEnd && (
                <p className="text-sm text-destructive">{validationErrors.membershipEnd}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="discount">Discount (Optional)</Label>
            <Input
              id="discount"
              placeholder='Enter discount (e.g., "10%" or "500")'
              value={formData.discount}
              onChange={(e) => {
                setFormData({ ...formData, discount: e.target.value });
                if (validationErrors.discount) {
                  setValidationErrors({ ...validationErrors, discount: '' });
                }
              }}
              disabled={isPending || !formData.packageId}
              className={validationErrors.discount ? 'border-destructive' : ''}
            />
            {validationErrors.discount && (
              <p className="text-sm text-destructive">{validationErrors.discount}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Enter percentage (e.g., "10%") or flat amount in INR (₹) (e.g., "500")
            </p>
          </div>

          {/* Price Summary */}
          {formData.packageId && selectedPackage && (
            <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
              <h4 className="font-semibold text-sm">Price Summary</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Original Price:</span>
                  <span className={hasDiscount ? 'line-through text-muted-foreground' : 'font-medium'}>
                    {formatINR(packagePrice)}
                  </span>
                </div>
                {hasDiscount && (
                  <>
                    <div className="flex justify-between text-green-600 dark:text-green-400">
                      <span>Discount Applied:</span>
                      <span>- {formatINR(discountAmount)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t font-semibold text-base">
                      <span>Final Payable Amount:</span>
                      <span className="text-primary">{formatINR(finalPrice)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="status">Membership Status *</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value) => setFormData({ ...formData, status: value as MembershipStatus })}
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={MembershipStatus.active}>Active</SelectItem>
                <SelectItem value={MembershipStatus.inactive}>Inactive</SelectItem>
                <SelectItem value={MembershipStatus.paused}>Paused</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="diet">Assigned Diet Chart (Optional)</Label>
            <Select 
              value={formData.assignedDietId || 'none'} 
              onValueChange={(value) => setFormData({ ...formData, assignedDietId: value === 'none' ? '' : value })}
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder={safeDiets.length === 0 ? 'No diet charts available' : 'Select a diet chart (optional)'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {safeDiets.length > 0 ? (
                  safeDiets.map((diet) => (
                    <SelectItem key={diet.id} value={diet.id}>
                      {diet.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-diets" disabled>
                    No diet charts available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {safeDiets.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Create diet charts in the Diets tab to assign them to members.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="workout">Assigned Workout Chart (Optional)</Label>
            <Select 
              value={formData.assignedWorkoutId || 'none'} 
              onValueChange={(value) => setFormData({ ...formData, assignedWorkoutId: value === 'none' ? '' : value })}
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder={safeWorkouts.length === 0 ? 'No workout charts available' : 'Select a workout chart (optional)'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {safeWorkouts.length > 0 ? (
                  safeWorkouts.map((workout) => (
                    <SelectItem key={workout.id} value={workout.id}>
                      {workout.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-workouts" disabled>
                    No workout charts available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {safeWorkouts.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Create workout charts in the Workouts tab to assign them to members.
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              className="flex-1"
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isPending || safePackages.length === 0} 
              className="flex-1"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {member ? 'Updating...' : 'Creating...'}
                </>
              ) : member ? (
                'Update Member'
              ) : (
                'Create Member'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Wrap form content in Suspense for async operations
function SuspendedFormContent(props: MemberFormDialogProps) {
  return (
    <Suspense
      fallback={
        <Dialog open={props.open} onOpenChange={props.onOpenChange}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{props.member ? 'Edit Member' : 'Add New Member'}</DialogTitle>
              <DialogDescription>Loading form...</DialogDescription>
            </DialogHeader>
            <FormLoadingSkeleton />
          </DialogContent>
        </Dialog>
      }
    >
      <MemberFormContent {...props} />
    </Suspense>
  );
}

// Main export with double error boundary protection
export default function MemberFormDialog(props: MemberFormDialogProps) {
  return (
    <ErrorBoundary
      onReset={() => {
        console.log('[MemberFormDialog] Error boundary reset triggered');
        props.onOpenChange(false);
      }}
      fallback={
        <Dialog open={props.open} onOpenChange={props.onOpenChange}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Error Loading Form</DialogTitle>
              <DialogDescription>An unexpected error occurred</DialogDescription>
            </DialogHeader>
            <FormErrorFallback 
              onClose={() => props.onOpenChange(false)}
              error="The member form failed to load properly. Please close this dialog and try again. If the problem persists, try refreshing the page."
            />
          </DialogContent>
        </Dialog>
      }
    >
      <ErrorBoundary
        onReset={() => {
          console.log('[MemberFormDialog] Inner error boundary reset triggered');
        }}
        fallback={
          <Dialog open={props.open} onOpenChange={props.onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Form Rendering Error</DialogTitle>
                <DialogDescription>Failed to render form components</DialogDescription>
              </DialogHeader>
              <FormErrorFallback 
                onClose={() => props.onOpenChange(false)}
                error="A rendering error occurred. This may be due to missing data or a browser compatibility issue. Please try again."
              />
            </DialogContent>
          </Dialog>
        }
      >
        <SuspendedFormContent {...props} />
      </ErrorBoundary>
    </ErrorBoundary>
  );
}
