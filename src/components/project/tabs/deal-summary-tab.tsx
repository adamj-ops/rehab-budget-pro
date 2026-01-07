'use client';

import type { Project } from '@/types';
import { formatCurrency, formatPercent, formatDate } from '@/lib/utils';
import { PROJECT_STATUS_LABELS } from '@/types';

interface DealSummaryTabProps {
  project: Project;
  totalBudget: number;
  totalActual: number;
}

export function DealSummaryTab({ project, totalBudget, totalActual }: DealSummaryTabProps) {
  // Calculations
  const arv = project.arv || 0;
  const purchasePrice = project.purchase_price || 0;
  const closingCosts = project.closing_costs || 0;
  const holdingCostsMonthly = project.holding_costs_monthly || 0;
  const holdMonths = project.hold_months || 4;
  const sellingCostPercent = project.selling_cost_percent || 8;
  
  const holdingCostsTotal = holdingCostsMonthly * holdMonths;
  const sellingCosts = arv * (sellingCostPercent / 100);
  const totalInvestment = purchasePrice + totalBudget + closingCosts + holdingCostsTotal + sellingCosts;
  const grossProfit = arv - totalInvestment;
  const roi = totalInvestment > 0 ? (grossProfit / totalInvestment) * 100 : 0;
  const mao = arv * 0.7 - totalBudget;

  return (
    <div className="space-y-6">
      {/* Property Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-medium mb-4">Property Information</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Address</p>
              <p className="font-medium">{project.address || '-'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">City, State</p>
              <p className="font-medium">
                {project.city || '-'}, {project.state || '-'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Beds / Baths</p>
              <p className="font-medium tabular-nums">
                {project.beds || '-'} / {project.baths || '-'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Sq Ft</p>
              <p className="font-medium tabular-nums">{project.sqft?.toLocaleString() || '-'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Year Built</p>
              <p className="font-medium tabular-nums">{project.year_built || '-'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Status</p>
              <p className="font-medium">{PROJECT_STATUS_LABELS[project.status]}</p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-medium mb-4">Timeline</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Contract Date</p>
              <p className="font-medium">{formatDate(project.contract_date)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Close Date</p>
              <p className="font-medium">{formatDate(project.close_date)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Rehab Start</p>
              <p className="font-medium">{formatDate(project.rehab_start_date)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Target Complete</p>
              <p className="font-medium">{formatDate(project.target_complete_date)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">List Date</p>
              <p className="font-medium">{formatDate(project.list_date)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Sale Date</p>
              <p className="font-medium">{formatDate(project.sale_date)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="font-medium mb-4">Deal Analysis</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {/* Column 1: Acquisition */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Acquisition
            </h4>
            <div>
              <p className="text-sm text-muted-foreground">ARV</p>
              <p className="text-xl font-semibold text-primary tabular-nums">{formatCurrency(arv)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Purchase Price</p>
              <p className="text-lg font-medium tabular-nums">{formatCurrency(purchasePrice)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Closing Costs</p>
              <p className="text-lg font-medium tabular-nums">{formatCurrency(closingCosts)}</p>
            </div>
          </div>

          {/* Column 2: Rehab */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Rehab
            </h4>
            <div>
              <p className="text-sm text-muted-foreground">Rehab Budget</p>
              <p className="text-xl font-semibold tabular-nums">{formatCurrency(totalBudget)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Actual Spent</p>
              <p className="text-lg font-medium tabular-nums">{formatCurrency(totalActual)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Remaining</p>
              <p className={`text-lg font-medium tabular-nums ${totalBudget - totalActual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(totalBudget - totalActual)}
              </p>
            </div>
          </div>

          {/* Column 3: Holding/Selling */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Carrying Costs
            </h4>
            <div>
              <p className="text-sm text-muted-foreground tabular-nums">
                Holding ({holdMonths} mo × {formatCurrency(holdingCostsMonthly)})
              </p>
              <p className="text-lg font-medium tabular-nums">{formatCurrency(holdingCostsTotal)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground tabular-nums">
                Selling Costs ({sellingCostPercent}%)
              </p>
              <p className="text-lg font-medium tabular-nums">{formatCurrency(sellingCosts)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Investment</p>
              <p className="text-lg font-medium tabular-nums">{formatCurrency(totalInvestment)}</p>
            </div>
          </div>

          {/* Column 4: Returns */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Returns
            </h4>
            <div>
              <p className="text-sm text-muted-foreground">Gross Profit</p>
              <p className={`text-xl font-semibold tabular-nums ${grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(grossProfit)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">ROI</p>
              <p className={`text-xl font-semibold tabular-nums ${roi >= 15 ? 'text-green-600' : roi >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                {roi.toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">MAO (70% Rule)</p>
              <p className="text-lg font-medium tabular-nums">{formatCurrency(mao)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg border bg-card p-4 text-center">
          <p className="text-3xl font-bold text-primary tabular-nums">{formatCurrency(grossProfit)}</p>
          <p className="text-sm text-muted-foreground">Gross Profit</p>
        </div>
        <div className="rounded-lg border bg-card p-4 text-center">
          <p className="text-3xl font-bold tabular-nums">{roi.toFixed(1)}%</p>
          <p className="text-sm text-muted-foreground">ROI</p>
        </div>
        <div className="rounded-lg border bg-card p-4 text-center">
          <p className="text-3xl font-bold tabular-nums">{formatCurrency(totalBudget)}</p>
          <p className="text-sm text-muted-foreground">Rehab Budget</p>
        </div>
        <div className="rounded-lg border bg-card p-4 text-center">
          <p className="text-3xl font-bold tabular-nums">{formatCurrency(mao)}</p>
          <p className="text-sm text-muted-foreground">MAO</p>
        </div>
      </div>

      {/* Notes */}
      {project.notes && (
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-medium mb-4">Notes</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{project.notes}</p>
        </div>
      )}
    </div>
  );
}
