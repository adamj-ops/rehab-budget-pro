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
} from 'recharts';
import { cn, formatCurrency } from '@/lib/utils';
import { useCategoryTotals, usePortfolioSummary } from '@/hooks/use-dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BUDGET_CATEGORIES } from '@/types';
import {
  IconChartPie,
  IconTrendingUp,
  IconTrendingDown,
} from '@tabler/icons-react';

/**
 * Budget Insights Section
 * Shows category breakdown and budget health
 */
export function BudgetInsights() {
  const { data: categories, isLoading: categoriesLoading } = useCategoryTotals();
  const { data: portfolio, isLoading: portfolioLoading } = usePortfolioSummary();

  const isLoading = categoriesLoading || portfolioLoading;

  // Map categories to display data
  const categoryData = useMemo(() => {
    if (!categories) return [];

    return categories
      .filter((c) => c.total_budget > 0 || c.total_actual > 0)
      .map((c) => {
        const categoryConfig = BUDGET_CATEGORIES.find(
          (bc) => bc.value === c.category
        );
        const variancePercent =
          c.total_budget > 0 ? (c.variance / c.total_budget) * 100 : 0;

        return {
          category: c.category,
          label: categoryConfig?.label || c.category,
          budget: Number(c.total_budget),
          actual: Number(c.total_actual),
          variance: Number(c.variance),
          variancePercent,
        };
      })
      .slice(0, 8); // Top 8 categories
  }, [categories]);

  // Budget health percentage
  const budgetHealth = useMemo(() => {
    if (!portfolio) return 100;
    const budget = Number(portfolio.total_budget);
    const actual = Number(portfolio.total_actual);
    if (budget === 0) return 100;
    return Math.min(100, (actual / budget) * 100);
  }, [portfolio]);

  const totalVariance = useMemo(() => {
    if (!portfolio) return 0;
    return Number(portfolio.total_actual) - Number(portfolio.total_budget);
  }, [portfolio]);

  const isUnderBudget = totalVariance <= 0;

  if (isLoading) {
    return <BudgetInsightsSkeleton />;
  }

  if (!categories || categories.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <IconChartPie className="h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-muted-foreground">
            No budget data yet. Add budget items to see insights.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <section aria-labelledby="budget-title">
      <h2
        id="budget-title"
        className="section-title mb-4"
      >
        Budget Insights
      </h2>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Budget Health Card */}
        <Card>
          <CardHeader>
            <CardTitle className="card-title">Budget Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="label-text">Total Budget</p>
                  <p className="metric-value-sm">
                    {formatCurrency(Number(portfolio?.total_budget) || 0)}
                  </p>
                </div>
                <div>
                  <p className="label-text">Total Actual</p>
                  <p className="metric-value-sm">
                    {formatCurrency(Number(portfolio?.total_actual) || 0)}
                  </p>
                </div>
                <div>
                  <p className="label-text">Variance</p>
                  <p
                    className={cn(
                      'flex items-center justify-center gap-1 metric-value-sm',
                      isUnderBudget
                        ? 'text-green-500'
                        : 'text-red-500'
                    )}
                  >
                    {isUnderBudget ? (
                      <IconTrendingDown size={18} />
                    ) : (
                      <IconTrendingUp size={18} />
                    )}
                    {formatCurrency(Math.abs(totalVariance))}
                  </p>
                </div>
              </div>

              <div>
                <div className="mb-2 flex justify-between text-xs">
                  <span className="text-muted-foreground">Budget Usage</span>
                  <span className="font-medium">{budgetHealth.toFixed(1)}%</span>
                </div>
                <Progress
                  value={budgetHealth}
                  className="h-2.5"
                  indicatorClassName={
                    budgetHealth > 100
                      ? 'bg-red-500'
                      : budgetHealth > 90
                      ? 'bg-amber-500'
                      : 'bg-green-600'
                  }
                />
                <p className="mt-2 text-center meta-text">
                  {isUnderBudget ? 'On track' : 'Over budget'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="card-title">Top Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis
                    type="number"
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  />
                  <YAxis
                    dataKey="label"
                    type="category"
                    width={100}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    formatter={(value, name) => [
                      formatCurrency(Number(value)),
                      name === 'budget' ? 'Budget' : 'Actual',
                    ]}
                  />
                  <Bar dataKey="budget" fill="#6b7280" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="actual" radius={[0, 4, 4, 0]}>
                    {categoryData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={entry.variance > 0 ? '#ef4444' : '#008000'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="card-title">Category Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium">Category</th>
                    <th className="pb-2 text-right font-medium">Budget</th>
                    <th className="pb-2 text-right font-medium">Actual</th>
                    <th className="pb-2 text-right font-medium">Variance</th>
                    <th className="pb-2 text-right font-medium">%</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryData.map((cat) => (
                    <tr key={cat.category} className="border-b last:border-0">
                      <td className="py-2 font-medium">{cat.label}</td>
                      <td className="py-2 text-right tabular-nums text-muted-foreground">
                        {formatCurrency(cat.budget)}
                      </td>
                      <td className="py-2 text-right tabular-nums">
                        {formatCurrency(cat.actual)}
                      </td>
                      <td
                        className={cn(
                          'py-2 text-right tabular-nums font-medium',
                          cat.variance > 0
                            ? 'text-red-500'
                            : 'text-green-500'
                        )}
                      >
                        {cat.variance > 0 ? '+' : ''}
                        {formatCurrency(cat.variance)}
                      </td>
                      <td
                        className={cn(
                          'py-2 text-right tabular-nums',
                          Math.abs(cat.variancePercent) > 10
                            ? 'text-red-600 dark:text-red-400'
                            : Math.abs(cat.variancePercent) > 5
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-muted-foreground'
                        )}
                      >
                        {cat.variancePercent > 0 ? '+' : ''}
                        {cat.variancePercent.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

/**
 * Skeleton loader
 */
function BudgetInsightsSkeleton() {
  return (
    <section>
      <div className="mb-4 h-6 w-32 animate-pulse rounded bg-muted" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <div className="h-40 animate-pulse rounded bg-muted" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="h-40 animate-pulse rounded bg-muted" />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
