'use client';

import { toast } from 'sonner';
import type { Vendor } from '@/types';
import { useDeleteVendor } from '@/hooks/use-vendors';
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

interface DeleteVendorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendor: Vendor | null;
  onSuccess?: () => void;
}

export function DeleteVendorDialog({
  open,
  onOpenChange,
  vendor,
  onSuccess,
}: DeleteVendorDialogProps) {
  const deleteMutation = useDeleteVendor();

  const handleDelete = async () => {
    if (!vendor) return;

    try {
      await deleteMutation.mutateAsync(vendor.id);
      toast.success('Vendor deleted successfully');
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error deleting vendor:', error);
      toast.error('Failed to delete vendor');
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Vendor</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{vendor?.name}</strong>? This action cannot be undone.
            {vendor && (
              <span className="block mt-2 text-amber-600">
                Note: Any budget items linked to this vendor will have their vendor assignment removed.
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
