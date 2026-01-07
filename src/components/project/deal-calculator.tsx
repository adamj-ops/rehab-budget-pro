'use client';

import * as React from 'react';
import {
  IconTrendingUp,
  IconTrendingDown,
  IconTarget,
  IconCash,
  IconPercentage,
  IconAlertCircle,
  IconCircleCheck,
  IconChartBar,
  IconInfoCircle,
} from '@tabler/icons-react';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface DealCalculatorProps {
  arv: number | null;
  purchasePrice: number | null;
  rehabBudget?: number;
  closingCosts: number;
  holdingCostsMonthly: number;
  holdMonths: number;
  sellingCostPercent: number;
  contingencyPercent: number;
  className?: string;
}

export function DealCalculator({
  arv,
  purchasePrice,
  rehabBudget = 0,
  closingCosts,
  holdingCostsMonthly,
  holdMonths,
  sellingCostPercent,
  contingencyPercent,
  className,
}: DealCalculatorProps) {
  // Calculate all the deal metrics
  const calculations = React.useMemo(() => {
    const arvValue = arv ?? 0;
    const purchaseValue = purchasePrice ?? 0;
    const rehabWithContingency = rehabBudget * (1 + contingencyPercent / 100);
    const holdingCostsTotal = holdingCostsMonthly * holdMonths;
    const sellingCosts = arvValue * (sellingCostPercent / 100);

    const totalInvestment =
      purchaseValue + rehabWithContingency + closingCosts + holdingCostsTotal;

    const totalCosts = totalInvestment + sellingCosts;
    const grossProfit = arvValue - totalCosts;
    const roi = totalInvestment > 0 ? (grossProfit / totalInvestment) * 100 : 0;

    // MAO = ARV × 70% - Rehab - Closing Costs - Holding Costs
    const mao70 =
      arvValue * 0.7 - rehabWithContingency - closingCosts - holdingCostsTotal;

    // Spread (difference between purchase and MAO)
    const spread = purchaseValue > 0 ? mao70 - purchaseValue : null;

    // Deal quality indicators
    const isGoodDeal = purchaseValue > 0 && purchaseValue <= mao70;

    // Sensitivity Analysis calculations
    const sensitivity = {
      // What if ARV drops?
      arvDown5: {
        newArv: arvValue * 0.95,
        profit: arvValue * 0.95 - (totalCosts - sellingCosts + arvValue * 0.95 * (sellingCostPercent / 100)),
      },
      arvDown10: {
        newArv: arvValue * 0.90,
        profit: arvValue * 0.90 - (totalCosts - sellingCosts + arvValue * 0.90 * (sellingCostPercent / 100)),
      },
      // What if rehab goes over?
      rehabOver10: {
        newRehab: rehabWithContingency * 1.10,
        profit: grossProfit - (rehabWithContingency * 0.10),
      },
      rehabOver20: {
        newRehab: rehabWithContingency * 1.20,
        profit: grossProfit - (rehabWithContingency * 0.20),
      },
      // Break-even ARV (what ARV do you need to break even?)
      breakEvenArv: totalInvestment / (1 - sellingCostPercent / 100),
      // Max purchase (what's the most you can pay and hit 20% ROI?)
      maxPurchaseFor20ROI: arvValue > 0
        ? (arvValue * (1 - sellingCostPercent / 100) - rehabWithContingency - closingCosts - holdingCostsTotal) / 1.20
        : 0,
    };

    return {
      totalInvestment,
      holdingCostsTotal,
      sellingCosts,
      grossProfit,
      roi,
      mao70,
      spread,
      isGoodDeal,
      rehabWithContingency,
      sensitivity,
    };
  }, [
    arv,
    purchasePrice,
    rehabBudget,
    closingCosts,
    holdingCostsMonthly,
    holdMonths,
    sellingCostPercent,
    contingencyPercent,
  ]);

  const hasEnoughData = (arv ?? 0) > 0 || (purchasePrice ?? 0) > 0;

  if (!hasEnoughData) {
    return (
      <div
        className={cn(
          'rounded-lg border border-dashed p-6 text-center text-muted-foreground',
          className
        )}
      >
        <IconTarget className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm font-medium">Deal Analysis</p>
        <p className="text-xs mt-1">
          Enter ARV and Purchase Price to see projected profit, ROI, and risk scenarios.
        </p>
      </div>
    );
  }

  const {
    grossProfit,
    roi,
    mao70,
    spread,
    isGoodDeal,
    totalInvestment,
    holdingCostsTotal,
    sellingCosts,
    sensitivity,
  } = calculations;

  const isProfitable = grossProfit > 0;

  return (
    <div className={cn('rounded-lg border bg-card', className)}>
      {/* Header with Deal Status */}
      <div
        className={cn(
          'px-4 py-3 border-b flex items-center justify-between',
          isProfitable && isGoodDeal
            ? 'bg-green-50 dark:bg-green-950/20'
            : isProfitable
              ? 'bg-yellow-50 dark:bg-yellow-950/20'
              : 'bg-red-50 dark:bg-red-950/20'
        )}
      >
        <div className="flex items-center gap-2">
          {isProfitable && isGoodDeal ? (
            <IconCircleCheck className="h-5 w-5 text-green-600" />
          ) : isProfitable ? (
            <IconAlertCircle className="h-5 w-5 text-yellow-600" />
          ) : (
            <IconAlertCircle className="h-5 w-5 text-red-600" />
          )}
          <span className="font-medium text-sm">
            {isProfitable && isGoodDeal
              ? 'Good Deal'
              : isProfitable
                ? 'Marginal Deal'
                : 'Bad Deal'}
          </span>
        </div>
        {spread !== null && (
          <span
            className={cn(
              'text-xs font-medium px-2 py-1 rounded',
              spread >= 0
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            )}
          >
            {spread >= 0 ? '+' : ''}
            {formatCurrency(spread)} vs MAO
          </span>
        )}
      </div>

      {/* Main Metrics */}
      <div className="p-4 grid grid-cols-2 gap-4">
        {/* Gross Profit */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <IconCash className="h-3.5 w-3.5" />
            Est. Profit
          </div>
          <div
            className={cn(
              'text-2xl font-bold tabular-nums',
              isProfitable ? 'text-green-600' : 'text-red-600'
            )}
          >
            {formatCurrency(grossProfit)}
          </div>
        </div>

        {/* ROI */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <IconPercentage className="h-3.5 w-3.5" />
            ROI
          </div>
          <div
            className={cn(
              'text-2xl font-bold tabular-nums flex items-center gap-1',
              roi >= 20
                ? 'text-green-600'
                : roi >= 10
                  ? 'text-yellow-600'
                  : 'text-red-600'
            )}
          >
            {roi >= 0 ? (
              <IconTrendingUp className="h-5 w-5" />
            ) : (
              <IconTrendingDown className="h-5 w-5" />
            )}
            {roi.toFixed(1)}%
          </div>
        </div>

        {/* MAO */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <IconTarget className="h-3.5 w-3.5" />
            MAO (70% Rule)
          </div>
          <div className="text-lg font-semibold tabular-nums">
            {formatCurrency(mao70)}
          </div>
        </div>

        {/* Total Investment */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            Total Investment
          </div>
          <div className="text-lg font-semibold tabular-nums">
            {formatCurrency(totalInvestment)}
          </div>
        </div>
      </div>

      {/* Explanation */}
      <div className="px-4 pb-3">
        <p className="text-xs text-muted-foreground flex items-start gap-1.5">
          <IconInfoCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>
            <strong>ROI</strong> shows your return on the cash invested.
            <strong> MAO</strong> is the maximum you should pay using the 70% rule
            (ARV × 70% minus all costs).
          </span>
        </p>
      </div>

      {/* Sensitivity Analysis */}
      {(arv ?? 0) > 0 && (purchasePrice ?? 0) > 0 && (
        <div className="border-t">
          <details className="group">
            <summary className="px-4 py-3 text-sm font-medium cursor-pointer hover:bg-muted/50 flex items-center gap-2">
              <IconChartBar className="h-4 w-4" />
              Sensitivity Analysis
              <span className="text-xs text-muted-foreground font-normal ml-auto group-open:hidden">
                Click to expand
              </span>
            </summary>
            <div className="px-4 pb-4 space-y-4">
              <p className="text-xs text-muted-foreground">
                See how your profit changes if the deal doesn&apos;t go as planned.
                Use this to stress-test your assumptions before making an offer.
              </p>

              {/* ARV Scenarios */}
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  If ARV is Lower
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded bg-muted/50">
                    <div className="text-xs text-muted-foreground">ARV -5%</div>
                    <div className={cn(
                      'text-sm font-semibold tabular-nums',
                      sensitivity.arvDown5.profit >= 0 ? 'text-green-600' : 'text-red-600'
                    )}>
                      {formatCurrency(sensitivity.arvDown5.profit)}
                    </div>
                  </div>
                  <div className="p-2 rounded bg-muted/50">
                    <div className="text-xs text-muted-foreground">ARV -10%</div>
                    <div className={cn(
                      'text-sm font-semibold tabular-nums',
                      sensitivity.arvDown10.profit >= 0 ? 'text-green-600' : 'text-red-600'
                    )}>
                      {formatCurrency(sensitivity.arvDown10.profit)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Rehab Scenarios */}
              {rehabBudget > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    If Rehab Goes Over
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded bg-muted/50">
                      <div className="text-xs text-muted-foreground">+10% over</div>
                      <div className={cn(
                        'text-sm font-semibold tabular-nums',
                        sensitivity.rehabOver10.profit >= 0 ? 'text-green-600' : 'text-red-600'
                      )}>
                        {formatCurrency(sensitivity.rehabOver10.profit)}
                      </div>
                    </div>
                    <div className="p-2 rounded bg-muted/50">
                      <div className="text-xs text-muted-foreground">+20% over</div>
                      <div className={cn(
                        'text-sm font-semibold tabular-nums',
                        sensitivity.rehabOver20.profit >= 0 ? 'text-green-600' : 'text-red-600'
                      )}>
                        {formatCurrency(sensitivity.rehabOver20.profit)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Key Thresholds */}
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Key Numbers
                </h4>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center p-2 rounded bg-muted/50">
                    <span className="text-muted-foreground">Break-even ARV</span>
                    <span className="font-semibold tabular-nums">
                      {formatCurrency(sensitivity.breakEvenArv)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded bg-muted/50">
                    <span className="text-muted-foreground">Max purchase for 20% ROI</span>
                    <span className="font-semibold tabular-nums">
                      {formatCurrency(sensitivity.maxPurchaseFor20ROI)}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  <strong>Break-even ARV</strong> is the minimum sale price to avoid a loss.
                  <strong> Max purchase</strong> shows the highest offer that still yields 20% ROI.
                </p>
              </div>
            </div>
          </details>
        </div>
      )}

      {/* Cost Breakdown */}
      <div className="px-4 pb-4 border-t pt-3">
        <details className="group">
          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground flex items-center gap-1">
            <span className="group-open:rotate-90 transition-transform">▶</span>
            View cost breakdown
          </summary>
          <div className="mt-2 text-xs space-y-1.5 pl-4 border-l-2 border-muted">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Purchase Price</span>
              <span className="tabular-nums">
                {formatCurrency(purchasePrice)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Rehab + {contingencyPercent}% contingency
              </span>
              <span className="tabular-nums">
                {formatCurrency(calculations.rehabWithContingency)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Closing Costs</span>
              <span className="tabular-nums">{formatCurrency(closingCosts)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Holding ({holdMonths} mo)
              </span>
              <span className="tabular-nums">
                {formatCurrency(holdingCostsTotal)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Selling ({sellingCostPercent}%)
              </span>
              <span className="tabular-nums">{formatCurrency(sellingCosts)}</span>
            </div>
            <div className="flex justify-between pt-1.5 border-t font-medium">
              <span>ARV</span>
              <span className="tabular-nums">{formatCurrency(arv)}</span>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}
