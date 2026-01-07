'use client';

import { useState } from 'react';
import type { Draw, DrawStatus, Vendor } from '@/types';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import {
  IconPlus,
  IconCheck,
  IconClock,
  IconAlertCircle,
  IconEdit,
  IconTrash,
  IconChevronRight,
  IconCreditCard,
  IconBuildingBank,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DrawFormSheet } from '@/components/project/draw-form-sheet';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useDrawMutations } from '@/hooks/use-draw-mutations';

interface DrawsTabProps {
  projectId: string;
  draws: Draw[];
  vendors: Vendor[];
  totalBudget: number;
}

const MILESTONE_LABELS: Record<string, string> = {
  project_start: 'Project Start',
  demo_complete: 'Demo Complete',
  rough_in: 'Rough-In',
  drywall: 'Drywall',
  finishes: 'Finishes',
  final: 'Final',
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  check: 'Check',
  zelle: 'Zelle',
  venmo: 'Venmo',
  wire: 'Wire',
  cash: 'Cash',
  credit_card: 'Credit Card',
  other: 'Other',
};

export function DrawsTab({ projectId, draws, vendors, totalBudget }: DrawsTabProps) {
  const { createDraw, updateDraw, updateStatus, deleteDraw } = useDrawMutations(projectId);

  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [editingDraw, setEditingDraw] = useState<Draw | null>(null);

  // Delete state
  const [deleteDrawId, setDeleteDrawId] = useState<string | null>(null);
  const [deleteDrawNumber, setDeleteDrawNumber] = useState<number | null>(null);

  // Calculate totals
  const totalPaid = draws
    .filter((d) => d.status === 'paid')
    .reduce((sum, d) => sum + d.amount, 0);
  const totalPending = draws
    .filter((d) => d.status === 'pending' || d.status === 'approved')
    .reduce((sum, d) => sum + d.amount, 0);
  const remaining = totalBudget - totalPaid - totalPending;

  // Get vendor name helper
  const getVendorName = (vendorId: string | null) => {
    if (!vendorId) return '-';
    const vendor = vendors.find((v) => v.id === vendorId);
    return vendor?.name || 'Unknown';
  };

  // Handlers
  const handleOpenCreate = () => {
    setEditingDraw(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (draw: Draw) => {
    setEditingDraw(draw);
    setFormOpen(true);
  };

  const handleSubmit = (drawData: Partial<Draw>) => {
    if (editingDraw) {
      updateDraw.mutate({ id: editingDraw.id, data: drawData });
    } else {
      createDraw.mutate({ projectId, draw: drawData });
    }
  };

  const handleStatusChange = (draw: Draw, newStatus: DrawStatus) => {
    updateStatus.mutate({ id: draw.id, status: newStatus });
  };

  const handleOpenDelete = (draw: Draw) => {
    setDeleteDrawId(draw.id);
    setDeleteDrawNumber(draw.draw_number);
  };

  const handleConfirmDelete = () => {
    if (deleteDrawId) {
      deleteDraw.mutate(deleteDrawId, {
        onSuccess: () => {
          setDeleteDrawId(null);
          setDeleteDrawNumber(null);
        },
      });
    }
  };

  // Sort draws by draw_number
  const sortedDraws = [...draws].sort((a, b) => a.draw_number - b.draw_number);

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
              style={{ width: totalBudget > 0 ? `${(totalPaid / totalBudget) * 100}%` : '0%' }}
            />
            <div
              className="bg-yellow-500 transition-all"
              style={{ width: totalBudget > 0 ? `${(totalPending / totalBudget) * 100}%` : '0%' }}
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
            Pending/Approved
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-muted" />
            Remaining
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Draw Schedule</h3>
        <Button onClick={handleOpenCreate}>
          <IconPlus className="h-4 w-4 mr-2" />
          Add Draw
        </Button>
      </div>

      {/* Draws Table */}
      {sortedDraws.length > 0 ? (
        <div className="rounded-lg border overflow-hidden">
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
                <th className="text-center p-3 w-32">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedDraws.map((draw) => (
                <tr key={draw.id} className="border-t hover:bg-muted/50">
                  <td className="p-3 font-medium">{draw.draw_number}</td>
                  <td className="p-3">
                    <div>
                      {draw.milestone ? MILESTONE_LABELS[draw.milestone] : '-'}
                      {draw.description && (
                        <p className="text-xs text-muted-foreground">{draw.description}</p>
                      )}
                    </div>
                  </td>
                  <td className="p-3">{getVendorName(draw.vendor_id)}</td>
                  <td className="p-3 text-right">
                    {draw.percent_complete ? `${draw.percent_complete}%` : '-'}
                  </td>
                  <td className="p-3 text-right font-medium">
                    {formatCurrency(draw.amount)}
                  </td>
                  <td className="p-3 text-center text-muted-foreground">
                    {formatDate(draw.date_requested)}
                  </td>
                  <td className="p-3 text-center text-muted-foreground">
                    {formatDate(draw.date_paid)}
                  </td>
                  <td className="p-3 text-center">
                    <StatusBadgeWithMenu
                      draw={draw}
                      onStatusChange={handleStatusChange}
                      isPending={updateStatus.isPending}
                    />
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(draw)}
                        className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                        title="Edit draw"
                      >
                        <IconEdit className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenDelete(draw)}
                        className="p-1.5 rounded hover:bg-red-100 text-muted-foreground hover:text-red-600 transition-colors"
                        title="Delete draw"
                      >
                        <IconTrash className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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
      ) : (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <IconBuildingBank className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground mb-2">No draws scheduled yet</p>
          <p className="text-sm text-muted-foreground mb-4">
            Create draws to track payments to your vendors.
          </p>
          <Button onClick={handleOpenCreate}>
            <IconPlus className="h-4 w-4 mr-2" />
            Create First Draw
          </Button>
        </div>
      )}

      {/* Draw Form Sheet */}
      <DrawFormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        vendors={vendors}
        draw={editingDraw}
        onSubmit={handleSubmit}
        isPending={createDraw.isPending || updateDraw.isPending}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteDrawId}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteDrawId(null);
            setDeleteDrawNumber(null);
          }
        }}
        title="Delete Draw"
        description={`Are you sure you want to delete Draw #${deleteDrawNumber}? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
        onConfirm={handleConfirmDelete}
        isPending={deleteDraw.isPending}
      />
    </div>
  );
}

// Status Badge with Dropdown Menu for Quick Status Changes
interface StatusBadgeWithMenuProps {
  draw: Draw;
  onStatusChange: (draw: Draw, status: DrawStatus) => void;
  isPending: boolean;
}

function StatusBadgeWithMenu({ draw, onStatusChange, isPending }: StatusBadgeWithMenuProps) {
  const statusConfig = {
    pending: {
      className: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200',
      icon: IconClock,
      label: 'Pending',
    },
    approved: {
      className: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
      icon: IconAlertCircle,
      label: 'Approved',
    },
    paid: {
      className: 'bg-green-100 text-green-700 hover:bg-green-200',
      icon: IconCheck,
      label: 'Paid',
    },
  };

  const config = statusConfig[draw.status];
  const Icon = config.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={isPending}>
        <button
          className={cn(
            'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors',
            config.className
          )}
        >
          <Icon className="h-3 w-3" />
          {config.label}
          <IconChevronRight className="h-3 w-3 ml-0.5 opacity-50" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center">
        <DropdownMenuItem
          onClick={() => onStatusChange(draw, 'pending')}
          disabled={draw.status === 'pending'}
        >
          <IconClock className="h-4 w-4 mr-2 text-yellow-600" />
          Mark as Pending
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onStatusChange(draw, 'approved')}
          disabled={draw.status === 'approved'}
        >
          <IconAlertCircle className="h-4 w-4 mr-2 text-blue-600" />
          Mark as Approved
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onStatusChange(draw, 'paid')}
          disabled={draw.status === 'paid'}
        >
          <IconCheck className="h-4 w-4 mr-2 text-green-600" />
          Mark as Paid
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
