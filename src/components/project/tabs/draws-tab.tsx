'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Draw, Vendor, DrawMilestone, DrawStatus, PaymentMethod } from '@/types';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { getSupabaseClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
  IconPlus,
  IconCheck,
  IconClock,
  IconAlertCircle,
  IconEdit,
  IconTrash,
  IconX,
  IconCurrencyDollar,
  IconExternalLink,
} from '@tabler/icons-react';
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

interface DrawsTabProps {
  projectId: string;
  draws: Draw[];
  vendors: Vendor[];
  totalBudget: number;
}

interface DrawFormData {
  vendor_id: string;
  milestone: DrawMilestone | '';
  description: string;
  percent_complete: number | '';
  amount: number | '';
}

const MILESTONE_LABELS: Record<DrawMilestone, string> = {
  project_start: 'Project Start',
  demo_complete: 'Demo Complete',
  rough_in: 'Rough-In',
  drywall: 'Drywall',
  finishes: 'Finishes',
  final: 'Final',
};

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  check: 'Check',
  zelle: 'Zelle',
  venmo: 'Venmo',
  wire: 'Wire',
  cash: 'Cash',
  credit_card: 'Credit Card',
  other: 'Other',
};

const defaultFormData: DrawFormData = {
  vendor_id: '',
  milestone: '',
  description: '',
  percent_complete: '',
  amount: '',
};

export function DrawsTab({ projectId, draws, vendors, totalBudget }: DrawsTabProps) {
  const queryClient = useQueryClient();

  // Form state
  const [isAddingDraw, setIsAddingDraw] = useState(false);
  const [formData, setFormData] = useState<DrawFormData>(defaultFormData);

  // Edit state
  const [editingDrawId, setEditingDrawId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<DrawFormData>(defaultFormData);

  // Delete state
  const [drawToDelete, setDrawToDelete] = useState<Draw | null>(null);

  // Payment modal state
  const [payingDraw, setPayingDraw] = useState<Draw | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('check');
  const [referenceNumber, setReferenceNumber] = useState('');

  // Calculate totals
  const totalPaid = draws
    .filter((d) => d.status === 'paid')
    .reduce((sum, d) => sum + d.amount, 0);
  const totalPending = draws
    .filter((d) => d.status === 'pending' || d.status === 'approved')
    .reduce((sum, d) => sum + d.amount, 0);
  const remaining = totalBudget - totalPaid - totalPending;

  // Get next draw number
  const nextDrawNumber = draws.length > 0 ? Math.max(...draws.map((d) => d.draw_number)) + 1 : 1;

  // Get vendor name helper
  const getVendorName = (vendorId: string | null) => {
    if (!vendorId) return '-';
    const vendor = vendors.find((v) => v.id === vendorId);
    return vendor?.name || 'Unknown';
  };

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: DrawFormData) => {
      const supabase = getSupabaseClient();
      const { data: draw, error } = await supabase
        .from('draws')
        .insert({
          project_id: projectId,
          vendor_id: data.vendor_id || null,
          draw_number: nextDrawNumber,
          milestone: data.milestone || null,
          description: data.description || null,
          percent_complete: data.percent_complete || null,
          amount: Number(data.amount),
          date_requested: new Date().toISOString().split('T')[0],
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return draw;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      toast.success('Draw created');
      setIsAddingDraw(false);
      setFormData(defaultFormData);
    },
    onError: (error) => {
      console.error('Error creating draw:', error);
      toast.error('Failed to create draw');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Draw> }) => {
      const supabase = getSupabaseClient();
      const { data: draw, error } = await supabase
        .from('draws')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return draw;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      toast.success('Draw updated');
      setEditingDrawId(null);
      setEditFormData(defaultFormData);
      setPayingDraw(null);
    },
    onError: (error) => {
      console.error('Error updating draw:', error);
      toast.error('Failed to update draw');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from('draws').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      toast.success('Draw deleted');
      setDrawToDelete(null);
    },
    onError: (error) => {
      console.error('Error deleting draw:', error);
      toast.error('Failed to delete draw');
    },
  });

  // Handlers
  const handleSubmitNew = () => {
    if (!formData.amount) {
      toast.error('Amount is required');
      return;
    }
    createMutation.mutate(formData);
  };

  const handleStartEdit = (draw: Draw) => {
    setEditingDrawId(draw.id);
    setEditFormData({
      vendor_id: draw.vendor_id || '',
      milestone: draw.milestone || '',
      description: draw.description || '',
      percent_complete: draw.percent_complete || '',
      amount: draw.amount,
    });
  };

  const handleSaveEdit = (drawId: string) => {
    updateMutation.mutate({
      id: drawId,
      data: {
        vendor_id: editFormData.vendor_id || null,
        milestone: editFormData.milestone || null,
        description: editFormData.description || null,
        percent_complete: editFormData.percent_complete ? Number(editFormData.percent_complete) : null,
        amount: Number(editFormData.amount),
      },
    });
  };

  const handleStatusChange = (draw: Draw, newStatus: DrawStatus) => {
    if (newStatus === 'paid') {
      // Show payment details modal
      setPayingDraw(draw);
      setPaymentMethod('check');
      setReferenceNumber('');
    } else {
      updateMutation.mutate({
        id: draw.id,
        data: { status: newStatus },
      });
    }
  };

  const handleConfirmPayment = () => {
    if (!payingDraw) return;
    updateMutation.mutate({
      id: payingDraw.id,
      data: {
        status: 'paid',
        date_paid: new Date().toISOString().split('T')[0],
        payment_method: paymentMethod,
        reference_number: referenceNumber || null,
      },
    });
  };

  const handleConfirmDelete = () => {
    if (drawToDelete) {
      deleteMutation.mutate(drawToDelete.id);
    }
  };

  // Generate vendor request link
  const vendorRequestLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/draw-request/${projectId}`;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <p className="stat-label">Total Budget</p>
          <p className="stat-value">{formatCurrency(totalBudget)}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Total Paid</p>
          <p className="stat-value text-green-600">{formatCurrency(totalPaid)}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Pending</p>
          <p className="stat-value text-yellow-600">{formatCurrency(totalPending)}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Remaining</p>
          <p className={cn('stat-value', remaining >= 0 ? 'text-primary' : 'text-red-600')}>
            {formatCurrency(remaining)}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Payment Progress</span>
          <span className="text-sm text-muted-foreground">
            {totalBudget > 0 ? ((totalPaid / totalBudget) * 100).toFixed(1) : 0}% paid
          </span>
        </div>
        <div className="h-4 bg-muted rounded-full overflow-hidden">
          <div className="h-full flex">
            <div
              className="bg-green-500 transition-all"
              style={{ width: `${totalBudget > 0 ? (totalPaid / totalBudget) * 100 : 0}%` }}
            />
            <div
              className="bg-yellow-500 transition-all"
              style={{ width: `${totalBudget > 0 ? (totalPending / totalBudget) * 100 : 0}%` }}
            />
          </div>
        </div>
        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            Paid
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-yellow-500" />
            Pending
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-muted" />
            Remaining
          </div>
        </div>
      </div>

      {/* Header with Actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="font-medium">Draw Schedule</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              navigator.clipboard.writeText(vendorRequestLink);
              toast.success('Vendor request link copied!');
            }}
            className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
            title="Copy link for vendors to submit draw requests"
          >
            <IconExternalLink className="h-4 w-4" />
            Vendor Request Link
          </button>
          <button
            onClick={() => setIsAddingDraw(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <IconPlus className="h-4 w-4" />
            Add Draw
          </button>
        </div>
      </div>

      {/* Add Draw Form */}
      {isAddingDraw && (
        <div className="rounded-lg border bg-card p-4 space-y-4">
          <h4 className="font-medium">New Draw Request</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-muted-foreground">Vendor</label>
              <select
                value={formData.vendor_id}
                onChange={(e) => setFormData({ ...formData, vendor_id: e.target.value })}
                className="w-full mt-1 p-2 rounded border text-sm"
              >
                <option value="">Select vendor...</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Milestone</label>
              <select
                value={formData.milestone}
                onChange={(e) => setFormData({ ...formData, milestone: e.target.value as DrawMilestone | '' })}
                className="w-full mt-1 p-2 rounded border text-sm"
              >
                <option value="">Select milestone...</option>
                {Object.entries(MILESTONE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Amount *</label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value ? Number(e.target.value) : '' })}
                placeholder="0.00"
                className="w-full mt-1 p-2 rounded border text-sm"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">% Complete</label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.percent_complete}
                onChange={(e) => setFormData({ ...formData, percent_complete: e.target.value ? Number(e.target.value) : '' })}
                placeholder="0"
                className="w-full mt-1 p-2 rounded border text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm text-muted-foreground">Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Work completed..."
                className="w-full mt-1 p-2 rounded border text-sm"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={handleSubmitNew}
              disabled={createMutation.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <IconCheck className="h-4 w-4" />
              {createMutation.isPending ? 'Creating...' : 'Create Draw'}
            </button>
            <button
              onClick={() => {
                setIsAddingDraw(false);
                setFormData(defaultFormData);
              }}
              className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
            >
              <IconX className="h-4 w-4" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Draws Table */}
      {draws.length > 0 ? (
        <div className="rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  <th className="text-left p-3 w-16">Draw #</th>
                  <th className="text-left p-3">Milestone</th>
                  <th className="text-left p-3">Vendor</th>
                  <th className="text-right p-3 w-20">% Complete</th>
                  <th className="text-right p-3 w-28">Amount</th>
                  <th className="text-center p-3 w-28">Requested</th>
                  <th className="text-center p-3 w-28">Paid</th>
                  <th className="text-center p-3 w-28">Status</th>
                  <th className="text-center p-3 w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {draws.map((draw) => {
                  const isEditing = editingDrawId === draw.id;

                  return (
                    <tr key={draw.id} className="border-t hover:bg-muted/50">
                      <td className="p-3 font-medium">{draw.draw_number}</td>
                      <td className="p-3">
                        {isEditing ? (
                          <select
                            value={editFormData.milestone}
                            onChange={(e) => setEditFormData({ ...editFormData, milestone: e.target.value as DrawMilestone | '' })}
                            className="w-full p-1 rounded border text-sm"
                          >
                            <option value="">-</option>
                            {Object.entries(MILESTONE_LABELS).map(([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <>
                            {draw.milestone ? MILESTONE_LABELS[draw.milestone] : '-'}
                            {draw.description && (
                              <p className="text-xs text-muted-foreground">{draw.description}</p>
                            )}
                          </>
                        )}
                      </td>
                      <td className="p-3">
                        {isEditing ? (
                          <select
                            value={editFormData.vendor_id}
                            onChange={(e) => setEditFormData({ ...editFormData, vendor_id: e.target.value })}
                            className="w-full p-1 rounded border text-sm"
                          >
                            <option value="">-</option>
                            {vendors.map((v) => (
                              <option key={v.id} value={v.id}>
                                {v.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          getVendorName(draw.vendor_id)
                        )}
                      </td>
                      <td className="p-3 text-right">
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={editFormData.percent_complete}
                            onChange={(e) => setEditFormData({ ...editFormData, percent_complete: e.target.value ? Number(e.target.value) : '' })}
                            className="w-16 p-1 rounded border text-sm text-right"
                          />
                        ) : (
                          draw.percent_complete ? `${draw.percent_complete}%` : '-'
                        )}
                      </td>
                      <td className="p-3 text-right font-medium">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editFormData.amount}
                            onChange={(e) => setEditFormData({ ...editFormData, amount: e.target.value ? Number(e.target.value) : '' })}
                            className="w-24 p-1 rounded border text-sm text-right"
                          />
                        ) : (
                          formatCurrency(draw.amount)
                        )}
                      </td>
                      <td className="p-3 text-center text-muted-foreground">
                        {formatDate(draw.date_requested)}
                      </td>
                      <td className="p-3 text-center text-muted-foreground">
                        {formatDate(draw.date_paid)}
                      </td>
                      <td className="p-3 text-center">
                        <select
                          value={draw.status}
                          onChange={(e) => handleStatusChange(draw, e.target.value as DrawStatus)}
                          className={cn(
                            'text-xs px-2 py-1 rounded-full font-medium border-0 cursor-pointer',
                            draw.status === 'paid' && 'bg-green-100 text-green-700',
                            draw.status === 'approved' && 'bg-blue-100 text-blue-700',
                            draw.status === 'pending' && 'bg-yellow-100 text-yellow-700'
                          )}
                        >
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="paid">Paid</option>
                        </select>
                      </td>
                      <td className="p-3 text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleSaveEdit(draw.id)}
                              className="p-1 rounded hover:bg-green-100 text-green-600 transition-colors"
                              disabled={updateMutation.isPending}
                            >
                              <IconCheck className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingDrawId(null);
                                setEditFormData(defaultFormData);
                              }}
                              className="p-1 rounded hover:bg-red-100 text-red-600 transition-colors"
                            >
                              <IconX className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleStartEdit(draw)}
                              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                              title="Edit draw"
                            >
                              <IconEdit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDrawToDelete(draw)}
                              className="p-1 rounded hover:bg-red-100 text-muted-foreground hover:text-red-600 transition-colors"
                              title="Delete draw"
                            >
                              <IconTrash className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 bg-muted/50 font-medium">
                  <td className="p-3" colSpan={4}>Total</td>
                  <td className="p-3 text-right">
                    {formatCurrency(draws.reduce((sum, d) => sum + d.amount, 0))}
                  </td>
                  <td colSpan={4}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <IconClock className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground mb-2">No draws scheduled yet</p>
          <p className="text-sm text-muted-foreground mb-4">
            Create draws to track payments to your vendors.
          </p>
          <button
            onClick={() => setIsAddingDraw(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <IconPlus className="h-4 w-4" />
            Create First Draw
          </button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!drawToDelete} onOpenChange={(open) => !open && setDrawToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Draw</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete Draw #{drawToDelete?.draw_number}
              {drawToDelete?.amount ? ` (${formatCurrency(drawToDelete.amount)})` : ''}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
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

      {/* Payment Details Dialog */}
      <AlertDialog open={!!payingDraw} onOpenChange={(open) => !open && setPayingDraw(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <IconCurrencyDollar className="h-5 w-5" />
              Mark as Paid
            </AlertDialogTitle>
            <AlertDialogDescription>
              Enter payment details for Draw #{payingDraw?.draw_number} ({formatCurrency(payingDraw?.amount || 0)})
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full mt-1 p-2 rounded border text-sm"
              >
                {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Reference Number (optional)</label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="Check #, transaction ID, etc."
                className="w-full mt-1 p-2 rounded border text-sm"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updateMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmPayment}
              disabled={updateMutation.isPending}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              {updateMutation.isPending ? 'Processing...' : 'Confirm Payment'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
