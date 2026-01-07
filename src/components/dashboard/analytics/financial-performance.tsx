'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import { cn, formatCurrency } from '@/lib/utils';
import { useSoldProjects, usePortfolioSummary } from '@/hooks/use-dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '../stat-card';
import {
  IconCash,
  IconHome,
  IconPercentage,
  IconClock,
  IconChartBar,
} from '@tabler/icons-react';

/**
 * Financial Performance Section
 * Shows sold project analytics with ROI distribution and profit charts
 */
export function FinancialPerformance() {
  const { data: soldProjects, isLoading: soldLoading } = useSoldProjects();
  const { data: portfolio, isLoading: portfolioLoading } = usePortfolioSummary();

  const isLoading = soldLoading || portfolioLoading;

  // Calculate ROI distribution
  const roiDistribution = useMemo(() => {
    if (!soldProjects) return [];

    const ranges = [
      { range: '< 10%', min: -Infinity, max: 10, count: 0, color: '#ef4444' },
      { range: '10-15%', min: 10, max: 15, count: 0, color: '#f59e0b' },
      { range: '15-20%', min: 15, max: 20, count: 0, color: '#22c55e' },
      { range: '> 20%', min: 20, max: Infinity, count: 0, color: '#10b981' },
    ];

    soldProjects.forEach((p) => {
      const roi =
        p.total_investment > 0
          ? (p.gross_profit / p.total_investment) * 100
          : 0;

      for (const range of ranges) {
        if (roi >= range.min && roi < range.max) {
          range.count++;
          break;
        }
      }
    });

    return ranges;
  }, [soldProjects]);

  // Calculate profit by project (top 5)
  const profitByProject = useMemo(() => {
    if (!soldProjects) return [];

    return [...soldProjects]
      .sort((a, b) => (b.gross_profit || 0) - (a.gross_profit || 0))
      .slice(0, 5)
      .map((p) => ({
        name: p.name.length > 15 ? p.name.slice(0, 15) + '...' : p.name,
        profit: p.gross_profit || 0,
        roi:
          p.total_investment > 0
            ? (p.gross_profit / p.total_investment) * 100
            : 0,
      }));
  }, [soldProjects]);

  // Calculate average hold time
  const avgHoldTime = useMemo(() => {
    if (!soldProjects || soldProjects.length === 0) return 0;

    const holdTimes = soldProjects
      .filter((p) => p.close_date && p.sale_date)
      .map((p) => {
        const close = new Date(p.close_date!);
        const sale = new Date(p.sale_date!);
        return (sale.getTime() - close.getTime()) / (1000 * 60 * 60 * 24 * 30); // months
      });

    if (holdTimes.length === 0) return 0;
    return holdTimes.reduce((a, b) => a + b, 0) / holdTimes.length;
  }, [soldProjects]);

  // Calculate projects hitting target
  const projectsHittingTarget = useMemo(() => {
    if (!soldProjects || soldProjects.length === 0) return 0;

    const hittingTarget = soldProjects.filter((p) => {
      const roi =
        p.total_investment > 0
          ? (p.gross_profit / p.total_investment) * 100
          : 0;
      return roi >= 15;
    }).length;

    return Math.round((hittingTarget / soldProjects.length) * 100);
  }, [soldProjects]);

  if (isLoading) {
    return <FinancialPerformanceSkeleton />;
  }

  const hasSoldProjects = soldProjects && soldProjects.length > 0;

  return (
    <section aria-labelledby="financial-title">
      <h2
        id="financial-title"
        className="mb-4 text-lg font-semibold text-muted-foreground"
      >
        Financial Performance
      </h2>

      {!hasSoldProjects ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <IconChartBar className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">
              No sold projects yet. Complete your first deal to see analytics.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Summary stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">This Year Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Gross Profit</p>
                  <p className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(Number(portfolio?.total_profit) || 0)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Projects Sold</p>
                  <p className="text-2xl font-bold tabular-nums">
                    {portfolio?.sold_count || 0}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Avg ROI</p>
                  <p className="text-2xl font-bold tabular-nums">
                    {(Number(portfolio?.avg_roi) || 0).toFixed(1)}%
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Avg Hold Time</p>
                  <p className="text-2xl font-bold tabular-nums">
                    {avgHoldTime.toFixed(1)} mo
                  </p>
                </div>
              </div>

              <div className="mt-4 border-t pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Projects hitting 15%+ target
                  </span>
                  <span className="font-semibold">
                    {projectsHittingTarget}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ROI Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">ROI Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={roiDistribution} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" />
                    <YAxis
                      dataKey="range"
                      type="category"
                      width={60}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      formatter={(value) => [`${value} projects`, 'Count']}
                    />
                    <ReferenceLine x={15} stroke="#22c55e" strokeDasharray="3 3" />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {roiDistribution.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Target: 15%+ ROI (green line)
              </p>
            </CardContent>
          </Card>

          {/* Profit by Project */}
          {profitByProject.length > 0 && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Top Performers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={profitByProject} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis
                        type="number"
                        tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                      />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={120}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip
                        formatter={(value) => [
                          formatCurrency(Number(value)),
                          'Profit',
                        ]}
                      />
                      <Bar dataKey="profit" fill="#22c55e" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </section>
  );
}

/**
 * Skeleton loader
 */
function FinancialPerformanceSkeleton() {
  return (
    <section>
      <div className="mb-4 h-6 w-40 animate-pulse rounded bg-muted" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <div className="h-48 animate-pulse rounded bg-muted" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="h-48 animate-pulse rounded bg-muted" />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
