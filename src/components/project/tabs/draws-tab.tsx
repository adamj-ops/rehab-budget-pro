'use client';

import type { Draw, Vendor } from '@/types';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { IconPlus, IconCheck, IconClock, IconAlertCircle } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';

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

export function DrawsTab({ projectId, draws, vendors, totalBudget }: DrawsTabProps) {
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
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium">Payment Progress</span>
          <span className="text-sm text-muted-foreground tabular-nums">
            {((totalPaid / totalBudget) * 100).toFixed(1)}% paid
          </span>
        </div>
        <div className="h-4 bg-muted rounded-full overflow-hidden">
          <div className="h-full flex">
            <div
              className="bg-green-500 transition-all"
              style={{ width: `${(totalPaid / totalBudget) * 100}%` }}
            />
            <div
              className="bg-yellow-500 transition-all"
              style={{ width: `${(totalPending / totalBudget) * 100}%` }}
            />
          </div>
        </div>
        <div className="flex items-center gap-6 mt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
            Paid
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
            Pending
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
            Remaining
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="section-header mb-0">Draw Schedule</h3>
        <Button>
          <IconPlus className="icon-sm" />
          Add Draw
        </Button>
      </div>

      {/* Draws Table */}
      {draws.length > 0 ? (
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
              </tr>
            </thead>
            <tbody>
              {draws.map((draw) => (
                <tr key={draw.id} className="border-t hover:bg-muted/50">
                  <td className="p-3 font-medium">{draw.draw_number}</td>
                  <td className="p-3">
                    {draw.milestone ? MILESTONE_LABELS[draw.milestone] : '-'}
                    {draw.description && (
                      <p className="text-xs text-muted-foreground">{draw.description}</p>
                    )}
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
                    <span
                      className={cn(
                        'status-badge',
                        draw.status === 'paid' && 'status-paid',
                        draw.status === 'approved' && 'status-approved',
                        draw.status === 'pending' && 'status-pending'
                      )}
                    >
                      {draw.status === 'paid' && <IconCheck className="h-3 w-3" />}
                      {draw.status === 'approved' && <IconAlertCircle className="h-3 w-3" />}
                      {draw.status === 'pending' && <IconClock className="h-3 w-3" />}
                      {draw.status.charAt(0).toUpperCase() + draw.status.slice(1)}
                    </span>
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
                <td colSpan={3}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <IconClock className="empty-state-icon" />
          <p className="empty-state-title">No draws scheduled yet</p>
          <p className="empty-state-description">
            Create draws to track payments to your vendors.
          </p>
          <Button>
            <IconPlus className="h-4 w-4" />
            Create First Draw
          </Button>
        </div>
      )}
    </div>
  );
}
