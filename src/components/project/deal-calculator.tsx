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
} from '@tabler/icons-react';
import { formatCurrency, formatPercent } from '@/lib/utils';
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

    // MAO = ARV × 70% - Rehab - Selling Costs - Closing Costs - Holding Costs
    const mao70 =
      arvValue * 0.7 - rehabWithContingency - closingCosts - holdingCostsTotal;

    // Spread (difference between purchase and MAO)
    const spread = purchaseValue > 0 ? mao70 - purchaseValue : null;

    // Deal quality indicators
    const isGoodDeal = purchaseValue > 0 && purchaseValue <= mao70;
    const profitMargin = arvValue > 0 ? (grossProfit / arvValue) * 100 : 0;

    return {
      totalInvestment,
      holdingCostsTotal,
      sellingCosts,
      grossProfit,
      roi,
      mao70,
      spread,
      isGoodDeal,
      profitMargin,
      rehabWithContingency,
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
        <p className="text-sm">
          Enter ARV and Purchase Price to see deal analysis
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

      {/* Cost Breakdown */}
      <div className="px-4 pb-4">
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
