'use client';

import { usePortfolioSummary } from '@/hooks/use-dashboard';
import { StatCard, StatCardSkeleton } from './stat-card';
import {
  IconBuildingBank,
  IconCash,
  IconPercentage,
  IconHome,
} from '@tabler/icons-react';

/**
 * Portfolio Health Section
 * Displays the 4 hero metrics at the top of the dashboard
 */
export function PortfolioHealth() {
  const { data: portfolio, isLoading, error } = usePortfolioSummary();

  if (isLoading) {
    return <PortfolioHealthSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
        Failed to load portfolio data. Please try again.
      </div>
    );
  }

  // Handle empty state
  if (!portfolio || portfolio.total_projects === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <IconHome className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-semibold">No projects yet</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Add your first deal to start tracking your portfolio.
        </p>
      </div>
    );
  }

  // Build subtitle for active projects
  const activeBreakdown = [
    portfolio.analyzing_count > 0 && `${portfolio.analyzing_count} analyzing`,
    portfolio.under_contract_count > 0 && `${portfolio.under_contract_count} contracted`,
    portfolio.in_rehab_count > 0 && `${portfolio.in_rehab_count} in rehab`,
    portfolio.listed_count > 0 && `${portfolio.listed_count} listed`,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <section aria-labelledby="portfolio-health-title">
      <h2
        id="portfolio-health-title"
        className="mb-4 text-lg font-semibold text-muted-foreground"
      >
        Portfolio Health
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total ARV */}
        <StatCard
          title="Total ARV"
          value={Number(portfolio.total_arv) || 0}
          format="currency"
          subtitle={`across ${portfolio.active_projects} active`}
          icon={<IconBuildingBank size={24} />}
        />

        {/* Capital Deployed */}
        <StatCard
          title="Capital Deployed"
          value={Number(portfolio.capital_deployed) || 0}
          format="currency"
          subtitle="total invested"
          icon={<IconCash size={24} />}
        />

        {/* Average ROI */}
        <StatCard
          title="Avg ROI"
          value={Number(portfolio.avg_roi) || 0}
          format="percent"
          subtitle={`${portfolio.sold_count} sold`}
          trend={
            portfolio.sold_count > 0
              ? {
                  value: Number(portfolio.avg_roi) - 15,
                  label: 'vs target',
                  isPositiveGood: true,
                }
              : undefined
          }
          icon={<IconPercentage size={24} />}
        />

        {/* Active Projects */}
        <StatCard
          title="Active Projects"
          value={portfolio.active_projects}
          format="number"
          subtitle={activeBreakdown || 'None active'}
          icon={<IconHome size={24} />}
        />
      </div>
    </section>
  );
}

/**
 * Skeleton loader for Portfolio Health section
 */
export function PortfolioHealthSkeleton() {
  return (
    <section>
      <div className="mb-4 h-6 w-32 animate-pulse rounded bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
    </section>
  );
}
