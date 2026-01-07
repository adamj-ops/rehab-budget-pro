'use client';

import type { Project } from '@/types';
import { formatCurrency, formatPercent, formatDate, cn } from '@/lib/utils';
import { PROJECT_STATUS_LABELS } from '@/types';

interface DealSummaryTabProps {
  project: Project;
  underwritingTotal: number;
  forecastTotal: number;
  actualTotal: number;
  contingencyPercent: number;
}

export function DealSummaryTab({
  project,
  underwritingTotal,
  forecastTotal,
  actualTotal,
  contingencyPercent,
}: DealSummaryTabProps) {
  // Base values
  const arv = project.arv || 0;
  const purchasePrice = project.purchase_price || 0;
  const closingCosts = project.closing_costs || 0;
  const holdingCostsMonthly = project.holding_costs_monthly || 0;
  const holdMonths = project.hold_months || 4;
  const sellingCostPercent = project.selling_cost_percent || 8;

  // Contingency calculations for each phase
  const underwritingContingency = underwritingTotal * (contingencyPercent / 100);
  const forecastContingency = forecastTotal * (contingencyPercent / 100);
  const underwritingWithContingency = underwritingTotal + underwritingContingency;
  const forecastWithContingency = forecastTotal + forecastContingency;

  // Use primary budget (forecast if available, otherwise underwriting)
  const primaryBudget = forecastTotal > 0 ? forecastWithContingency : underwritingWithContingency;

  // Variances
  const forecastVsUnderwriting = forecastTotal - underwritingTotal;
  const forecastVsUnderwritingPercent = underwritingTotal > 0
    ? (forecastVsUnderwriting / underwritingTotal) * 100
    : 0;
  const actualVsForecast = actualTotal - (forecastTotal > 0 ? forecastTotal : underwritingTotal);
  const actualVsForecastPercent = (forecastTotal > 0 ? forecastTotal : underwritingTotal) > 0
    ? (actualVsForecast / (forecastTotal > 0 ? forecastTotal : underwritingTotal)) * 100
    : 0;
  const actualVsUnderwriting = actualTotal - underwritingTotal;
  const actualVsUnderwritingPercent = underwritingTotal > 0
    ? (actualVsUnderwriting / underwritingTotal) * 100
    : 0;

  // Common costs
  const holdingCostsTotal = holdingCostsMonthly * holdMonths;
  const sellingCosts = arv * (sellingCostPercent / 100);

  // Calculate scenarios for each budget phase
  const calculateScenario = (rehabBudget: number) => {
    const totalInvestment = purchasePrice + rehabBudget + closingCosts + holdingCostsTotal + sellingCosts;
    const grossProfit = arv - totalInvestment;
    const roi = totalInvestment > 0 ? (grossProfit / totalInvestment) * 100 : 0;
    return { totalInvestment, grossProfit, roi };
  };

  const underwritingScenario = calculateScenario(underwritingWithContingency);
  const forecastScenario = calculateScenario(forecastWithContingency);
  const actualScenario = calculateScenario(actualTotal);

  // MAO uses underwriting budget (pre-deal estimate)
  const mao = arv * 0.7 - underwritingWithContingency;
  const spread = mao - purchasePrice;

  // Determine which scenario to highlight based on project status
  const getActiveScenario = () => {
    if (actualTotal > 0) return 'actual';
    if (forecastTotal > 0) return 'forecast';
    return 'underwriting';
  };
  const activeScenario = getActiveScenario();

  return (
    <div className="space-y-6">
      {/* Property Info + Timeline */}
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

        <div className="rounded-lg border bg-card p-5">
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

      {/* Rehab Budget Comparison - Three Columns */}
      <div className="rounded-lg border bg-card p-5">
        <h3 className="font-medium mb-4">Rehab Budget Comparison</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Underwriting Column */}
          <div className={cn(
            "rounded-lg p-4 border-2",
            activeScenario === 'underwriting' ? 'border-blue-500 bg-blue-50/50' : 'border-transparent bg-muted/30'
          )}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Underwriting
              </h4>
              {activeScenario === 'underwriting' && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Active</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-2">Pre-deal estimate</p>
            <p className="text-2xl font-bold tabular-nums">{formatCurrency(underwritingTotal)}</p>
            <div className="mt-3 pt-3 border-t text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">+ Contingency ({contingencyPercent}%)</span>
                <span className="tabular-nums">{formatCurrency(underwritingContingency)}</span>
              </div>
              <div className="flex justify-between font-medium mt-1">
                <span>Total</span>
                <span className="tabular-nums">{formatCurrency(underwritingWithContingency)}</span>
              </div>
            </div>
          </div>

          {/* Forecast Column */}
          <div className={cn(
            "rounded-lg p-4 border-2",
            activeScenario === 'forecast' ? 'border-green-500 bg-green-50/50' : 'border-transparent bg-muted/30'
          )}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Forecast
              </h4>
              {activeScenario === 'forecast' && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Active</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-2">Post-walkthrough/bid</p>
            <p className="text-2xl font-bold tabular-nums text-blue-600">{formatCurrency(forecastTotal)}</p>
            {forecastTotal > 0 && (
              <p className={cn(
                'text-xs mt-1 tabular-nums',
                forecastVsUnderwriting > 0 ? 'text-red-600' : 'text-green-600'
              )}>
                {forecastVsUnderwriting >= 0 ? '+' : ''}{formatCurrency(forecastVsUnderwriting)} vs UW
                ({forecastVsUnderwritingPercent >= 0 ? '+' : ''}{forecastVsUnderwritingPercent.toFixed(1)}%)
              </p>
            )}
            <div className="mt-3 pt-3 border-t text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">+ Contingency ({contingencyPercent}%)</span>
                <span className="tabular-nums">{formatCurrency(forecastContingency)}</span>
              </div>
              <div className="flex justify-between font-medium mt-1">
                <span>Total</span>
                <span className="tabular-nums">{formatCurrency(forecastWithContingency)}</span>
              </div>
            </div>
          </div>

          {/* Actual Column */}
          <div className={cn(
            "rounded-lg p-4 border-2",
            activeScenario === 'actual' ? 'border-purple-500 bg-purple-50/50' : 'border-transparent bg-muted/30'
          )}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Actual
              </h4>
              {activeScenario === 'actual' && (
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Active</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-2">Real spend</p>
            <p className="text-2xl font-bold tabular-nums text-purple-600">{formatCurrency(actualTotal)}</p>
            {actualTotal > 0 && (
              <>
                <p className={cn(
                  'text-xs mt-1 tabular-nums',
                  actualVsForecast > 0 ? 'text-red-600' : 'text-green-600'
                )}>
                  {actualVsForecast >= 0 ? '+' : ''}{formatCurrency(actualVsForecast)} vs {forecastTotal > 0 ? 'Forecast' : 'UW'}
                </p>
                <p className={cn(
                  'text-xs tabular-nums',
                  actualVsUnderwriting > 0 ? 'text-red-600' : 'text-green-600'
                )}>
                  {actualVsUnderwriting >= 0 ? '+' : ''}{formatCurrency(actualVsUnderwriting)} vs UW
                  ({actualVsUnderwritingPercent >= 0 ? '+' : ''}{actualVsUnderwritingPercent.toFixed(1)}%)
                </p>
              </>
            )}
            <div className="mt-3 pt-3 border-t text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>No contingency on actual</span>
              </div>
              <div className="flex justify-between font-medium mt-1">
                <span>Total</span>
                <span className="tabular-nums">{formatCurrency(actualTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Deal Analysis - Acquisition & Costs */}
      <div className="rounded-lg border bg-card p-5">
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

          {/* Column 2: Carrying Costs */}
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
          </div>

          {/* Column 3: Returns by Scenario */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Profit by Scenario
            </h4>
            <div>
              <p className="text-sm text-muted-foreground">Underwriting</p>
              <p className={cn(
                'text-lg font-medium tabular-nums',
                underwritingScenario.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'
              )}>
                {formatCurrency(underwritingScenario.grossProfit)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Forecast</p>
              <p className={cn(
                'text-lg font-medium tabular-nums',
                forecastScenario.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'
              )}>
                {formatCurrency(forecastScenario.grossProfit)}
              </p>
            </div>
            {actualTotal > 0 && (
              <div>
                <p className="text-sm text-muted-foreground">Actual</p>
                <p className={cn(
                  'text-lg font-medium tabular-nums',
                  actualScenario.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'
                )}>
                  {formatCurrency(actualScenario.grossProfit)}
                </p>
              </div>
            )}
          </div>

          {/* Column 4: ROI by Scenario */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              ROI by Scenario
            </h4>
            <div>
              <p className="text-sm text-muted-foreground">Underwriting</p>
              <p className={cn(
                'text-lg font-medium tabular-nums',
                underwritingScenario.roi >= 15 ? 'text-green-600' : underwritingScenario.roi >= 10 ? 'text-yellow-600' : 'text-red-600'
              )}>
                {underwritingScenario.roi.toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Forecast</p>
              <p className={cn(
                'text-lg font-medium tabular-nums',
                forecastScenario.roi >= 15 ? 'text-green-600' : forecastScenario.roi >= 10 ? 'text-yellow-600' : 'text-red-600'
              )}>
                {forecastScenario.roi.toFixed(1)}%
              </p>
            </div>
            {actualTotal > 0 && (
              <div>
                <p className="text-sm text-muted-foreground">Actual</p>
                <p className={cn(
                  'text-lg font-medium tabular-nums',
                  actualScenario.roi >= 15 ? 'text-green-600' : actualScenario.roi >= 10 ? 'text-yellow-600' : 'text-red-600'
                )}>
                  {actualScenario.roi.toFixed(1)}%
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MAO Section */}
      <div className="rounded-lg border bg-card p-5">
        <h3 className="font-medium mb-4">Maximum Allowable Offer (70% Rule)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Calculation</p>
            <p className="text-sm tabular-nums">
              {formatCurrency(arv)} × 70% − {formatCurrency(underwritingWithContingency)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Uses underwriting budget + contingency
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">MAO</p>
            <p className="text-2xl font-bold tabular-nums">{formatCurrency(mao)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Spread vs Purchase</p>
            <p className={cn(
              'text-2xl font-bold tabular-nums',
              spread >= 0 ? 'text-green-600' : 'text-red-600'
            )}>
              {spread >= 0 ? '+' : ''}{formatCurrency(spread)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {spread >= 0 ? 'Under MAO (good)' : 'Over MAO (risk)'}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg border bg-card p-4 text-center">
          <p className={cn(
            'text-3xl font-bold tabular-nums',
            activeScenario === 'actual'
              ? (actualScenario.grossProfit >= 0 ? 'text-green-600' : 'text-red-600')
              : activeScenario === 'forecast'
                ? (forecastScenario.grossProfit >= 0 ? 'text-green-600' : 'text-red-600')
                : (underwritingScenario.grossProfit >= 0 ? 'text-green-600' : 'text-red-600')
          )}>
            {formatCurrency(
              activeScenario === 'actual'
                ? actualScenario.grossProfit
                : activeScenario === 'forecast'
                  ? forecastScenario.grossProfit
                  : underwritingScenario.grossProfit
            )}
          </p>
          <p className="text-sm text-muted-foreground">
            Gross Profit ({activeScenario === 'actual' ? 'Actual' : activeScenario === 'forecast' ? 'Forecast' : 'UW'})
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4 text-center">
          <p className="text-3xl font-bold tabular-nums">
            {(activeScenario === 'actual'
              ? actualScenario.roi
              : activeScenario === 'forecast'
                ? forecastScenario.roi
                : underwritingScenario.roi
            ).toFixed(1)}%
          </p>
          <p className="text-sm text-muted-foreground">
            ROI ({activeScenario === 'actual' ? 'Actual' : activeScenario === 'forecast' ? 'Forecast' : 'UW'})
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4 text-center">
          <p className={cn(
            'text-3xl font-bold tabular-nums',
            actualVsUnderwriting > 0 ? 'text-red-600' : actualVsUnderwriting < 0 ? 'text-green-600' : ''
          )}>
            {actualTotal > 0
              ? `${actualVsUnderwritingPercent >= 0 ? '+' : ''}${actualVsUnderwritingPercent.toFixed(1)}%`
              : forecastTotal > 0
                ? `${forecastVsUnderwritingPercent >= 0 ? '+' : ''}${forecastVsUnderwritingPercent.toFixed(1)}%`
                : '0%'
            }
          </p>
          <p className="text-sm text-muted-foreground">
            {actualTotal > 0 ? 'Actual' : forecastTotal > 0 ? 'Forecast' : 'Budget'} vs UW
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4 text-center">
          <p className="text-3xl font-bold tabular-nums">{formatCurrency(mao)}</p>
          <p className="text-sm text-muted-foreground">MAO (70% Rule)</p>
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
