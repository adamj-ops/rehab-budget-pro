'use client';

import { toast } from 'sonner';
import type { Vendor } from '@/types';
import { useCreateVendor, useUpdateVendor } from '@/hooks/use-vendors';
import { transformFormToDatabase, transformDatabaseToForm, type VendorFormValues } from '@/lib/validations/vendor';
import { VendorForm } from './vendor-form';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface VendorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendor?: Vendor | null;
  onSuccess?: () => void;
}

export function VendorDialog({
  open,
  onOpenChange,
  vendor,
  onSuccess,
}: VendorDialogProps) {
  const isEditing = !!vendor;
  const createMutation = useCreateVendor();
  const updateMutation = useUpdateVendor();

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async (values: VendorFormValues) => {
    const dbValues = transformFormToDatabase(values);

    try {
      if (isEditing && vendor) {
        await updateMutation.mutateAsync({
          id: vendor.id,
          ...dbValues,
        });
        toast.success('Vendor updated successfully');
      } else {
        await createMutation.mutateAsync(dbValues);
        toast.success('Vendor created successfully');
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error saving vendor:', error);
      toast.error(isEditing ? 'Failed to update vendor' : 'Failed to create vendor');
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>
            {isEditing ? 'Edit Vendor' : 'Add New Vendor'}
          </SheetTitle>
          <SheetDescription>
            {isEditing
              ? 'Update vendor information and qualifications.'
              : 'Add a new vendor to your directory.'}
          </SheetDescription>
        </SheetHeader>

        <VendorForm
          defaultValues={vendor ? transformDatabaseToForm(vendor) : undefined}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
          submitLabel={isEditing ? 'Save Changes' : 'Add Vendor'}
        />
      </SheetContent>
    </Sheet>
  );
}
