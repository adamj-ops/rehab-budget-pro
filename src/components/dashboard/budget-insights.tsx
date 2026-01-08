'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  IconChartPie,
  IconTrendingUp,
  IconTrendingDown,
  IconMinus,
  IconCheck,
  IconAlertTriangle,
  IconInfoCircle,
  IconChevronRight,
  IconBuildingStore,
} from '@tabler/icons-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
  PieChart,
  Pie,
} from 'recharts';
import type { BudgetCategory, ProjectStatus } from '@/types';
import { BUDGET_CATEGORIES } from '@/types';
import Link from 'next/link';

export interface BudgetProject {
  id: string;
  name: string;
  status: ProjectStatus;
  sqft?: number | null;
  rehab_budget: number;
  rehab_actual: number;
}

export interface CategorySpend {
  category: BudgetCategory;
  budget: number;
  actual: number;
  projectCount: number;
}

interface BudgetInsightsProps {
  projects: BudgetProject[];
  categorySpends: CategorySpend[];
  marketAvgPerSqft?: number; // Minneapolis average
}

function formatCurrency(value: number, compact = false): string {
  if (compact && Math.abs(value) >= 1000) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function getCategoryLabel(category: BudgetCategory): string {
  return BUDGET_CATEGORIES.find((c) => c.value === category)?.label || category;
}

// Category colors for charts - Emerald-based palette
const CATEGORY_COLORS: Record<string, string> = {
  kitchen: '#f97316',           // Orange
  bathrooms: '#0ea5e9',         // Sky
  flooring: '#008000',          // Forest green
  hvac: '#8b5cf6',              // Violet
  electrical: '#f59e0b',        // Amber
  plumbing: '#06b6d4',          // Cyan
  exterior: '#ec4899',          // Pink
  structural: '#64748b',        // Slate
  interior_paint: '#14b8a6',    // Teal
  demo: '#ef4444',              // Red
  insulation_drywall: '#a855f7', // Purple
  tile: '#0284c7',              // Sky-600
  doors_windows: '#d97706',     // Amber-600
  interior_trim: '#84cc16',     // Lime
  landscaping: '#059669',       // Emerald-600
  soft_costs: '#6366f1',        // Indigo
  finishing: '#d946ef',         // Fuchsia
  contingency: '#78716c',       // Stone
};

function VarianceIndicator({ variance, budget }: { variance: number; budget: number }) {
  const percent = budget > 0 ? Math.abs(variance / budget) * 100 : 0;
  const isOver = variance > 0;
  const isUnder = variance < 0;

  if (Math.abs(variance) < 100) {
    return (
      <span className="flex items-center gap-1 text-muted-foreground text-sm">
        <IconMinus className="h-3 w-3" />
        On target
      </span>
    );
  }

  return (
    <span
      className={`flex items-center gap-1 text-sm font-medium ${
        isOver ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
      }`}
    >
      {isOver ? (
        <IconTrendingUp className="h-3 w-3" />
      ) : (
        <IconTrendingDown className="h-3 w-3" />
      )}
      {isOver ? '+' : '-'}
      {formatCurrency(Math.abs(variance), true)} ({percent.toFixed(0)}%)
    </span>
  );
}

function CategoryRow({
  category,
  budget,
  actual,
  maxBudget,
}: {
  category: BudgetCategory;
  budget: number;
  actual: number;
  maxBudget: number;
}) {
  const variance = actual - budget;
  const percentOfMax = maxBudget > 0 ? (actual / maxBudget) * 100 : 0;
  const isOver = actual > budget;
  const budgetUsage = budget > 0 ? (actual / budget) * 100 : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded"
            style={{ backgroundColor: CATEGORY_COLORS[category] || '#6b7280' }}
          />
          <span className="text-sm font-medium">{getCategoryLabel(category)}</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground w-20 text-right">
            {formatCurrency(budget, true)}
          </span>
          <span className="font-medium w-20 text-right">{formatCurrency(actual, true)}</span>
          <div className="w-32">
            <VarianceIndicator variance={variance} budget={budget} />
          </div>
        </div>
      </div>
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
          style={{
            width: `${Math.min(percentOfMax, 100)}%`,
            backgroundColor: isOver
              ? '#ef4444'
              : budgetUsage > 90
                ? '#eab308'
                : CATEGORY_COLORS[category] || '#6b7280',
          }}
        />
        {/* Budget marker */}
        {budget > 0 && (
          <div
            className="absolute top-0 h-full w-0.5 bg-foreground/50"
            style={{ left: `${Math.min((budget / maxBudget) * 100, 100)}%` }}
          />
        )}
      </div>
    </div>
  );
}

function BudgetHealthCard({
  totalBudget,
  totalActual,
}: {
  totalBudget: number;
  totalActual: number;
}) {
  const variance = totalActual - totalBudget;
  const usagePercent = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0;
  const isOver = totalActual > totalBudget;
  const remaining = totalBudget - totalActual;

  let status: 'healthy' | 'warning' | 'critical';
  if (usagePercent > 100) status = 'critical';
  else if (usagePercent > 90) status = 'warning';
  else status = 'healthy';

  return (
    <div className="bg-muted/50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium">Budget Health</h4>
        <Badge
          variant={status === 'critical' ? 'destructive' : status === 'warning' ? 'secondary' : 'default'}
          className={status === 'healthy' ? 'bg-green-500' : ''}
        >
          {status === 'critical' ? 'Over Budget' : status === 'warning' ? 'Near Limit' : 'On Track'}
        </Badge>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Total Budget</span>
            <span className="font-medium">{formatCurrency(totalBudget)}</span>
          </div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Total Actual</span>
            <span className="font-medium">{formatCurrency(totalActual)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {isOver ? 'Over by' : 'Remaining'}
            </span>
            <span className={`font-medium ${isOver ? 'text-red-600' : 'text-green-600'}`}>
              {isOver ? '+' : ''}
              {formatCurrency(isOver ? variance : remaining)}
            </span>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Usage</span>
            <span>{usagePercent.toFixed(1)}%</span>
          </div>
          <Progress
            value={Math.min(usagePercent, 100)}
            className={`h-2 ${status === 'critical' ? '[&>div]:bg-red-500' : status === 'warning' ? '[&>div]:bg-yellow-500' : ''}`}
          />
        </div>
      </div>
    </div>
  );
}

function CostBenchmarkCard({
  yourAvg,
  marketAvg,
  projectCount,
}: {
  yourAvg: number;
  marketAvg: number;
  projectCount: number;
}) {
  const difference = yourAvg - marketAvg;
  const percentDiff = marketAvg > 0 ? (difference / marketAvg) * 100 : 0;
  const isBelow = difference < 0;

  return (
    <div className="bg-muted/50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <IconBuildingStore className="h-4 w-4" />
          Cost Benchmarking
        </h4>
        <Badge variant="outline" className="text-xs">
          Minneapolis Metro
        </Badge>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Your Avg $/sqft</p>
            <p className="text-xl font-bold">${yourAvg.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Market Avg</p>
            <p className="text-xl font-bold text-muted-foreground">${marketAvg.toFixed(2)}</p>
          </div>
        </div>

        <div className="pt-3 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm">
              {isBelow ? 'Savings vs Market' : 'Above Market'}
            </span>
            <span
              className={`text-lg font-bold ${
                isBelow ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}
            >
              {isBelow ? '-' : '+'}
              {Math.abs(percentDiff).toFixed(1)}%
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Based on {projectCount} project{projectCount !== 1 ? 's' : ''} with sqft data
          </p>
        </div>
      </div>
    </div>
  );
}

// Custom tooltip for pie chart
function PieTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { name: string; value: number; percent: number } }> }) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-popover border rounded-lg shadow-lg p-3">
      <p className="font-medium text-sm">{data.name}</p>
      <p className="text-sm text-muted-foreground">
        {formatCurrency(data.value)} ({(data.percent * 100).toFixed(1)}%)
      </p>
    </div>
  );
}

export function BudgetInsights({
  projects,
  categorySpends,
  marketAvgPerSqft = 32.0, // Default Minneapolis metro average
}: BudgetInsightsProps) {
  // Filter active projects
  const activeProjects = useMemo(
    () => projects.filter((p) => p.status !== 'sold' && p.status !== 'dead'),
    [projects]
  );

  // Calculate totals
  const totals = useMemo(() => {
    const totalBudget = activeProjects.reduce((sum, p) => sum + p.rehab_budget, 0);
    const totalActual = activeProjects.reduce((sum, p) => sum + p.rehab_actual, 0);
    return { totalBudget, totalActual };
  }, [activeProjects]);

  // Sort categories by actual spend
  const sortedCategories = useMemo(() => {
    return [...categorySpends]
      .filter((c) => c.actual > 0 || c.budget > 0)
      .sort((a, b) => b.actual - a.actual);
  }, [categorySpends]);

  const topCategories = sortedCategories.slice(0, 6);
  const maxCategorySpend = Math.max(...sortedCategories.map((c) => Math.max(c.actual, c.budget)), 1);

  // Pie chart data for category distribution
  const pieData = useMemo(() => {
    return topCategories.map((c) => ({
      name: getCategoryLabel(c.category),
      value: c.actual,
      percent: totals.totalActual > 0 ? c.actual / totals.totalActual : 0,
      color: CATEGORY_COLORS[c.category] || '#6b7280',
    }));
  }, [topCategories, totals.totalActual]);

  // Calculate cost per sqft
  const costPerSqft = useMemo(() => {
    const projectsWithSqft = activeProjects.filter((p) => p.sqft && p.sqft > 0);
    if (projectsWithSqft.length === 0) return { avg: 0, count: 0 };

    const totalSqft = projectsWithSqft.reduce((sum, p) => sum + (p.sqft || 0), 0);
    const totalActual = projectsWithSqft.reduce((sum, p) => sum + p.rehab_actual, 0);
    return {
      avg: totalSqft > 0 ? totalActual / totalSqft : 0,
      count: projectsWithSqft.length,
    };
  }, [activeProjects]);

  // Calculate variance metrics
  const varianceMetrics = useMemo(() => {
    const overBudget = sortedCategories.filter((c) => c.actual > c.budget);
    const underBudget = sortedCategories.filter((c) => c.actual < c.budget && c.budget > 0);
    const totalOverage = overBudget.reduce((sum, c) => sum + (c.actual - c.budget), 0);
    const totalSavings = underBudget.reduce((sum, c) => sum + (c.budget - c.actual), 0);
    return { overBudget, underBudget, totalOverage, totalSavings };
  }, [sortedCategories]);

  if (activeProjects.length === 0 || sortedCategories.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <IconChartPie className="h-5 w-5" />
            Budget Insights
          </CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{activeProjects.length} active project{activeProjects.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Top Row: Health + Benchmarking */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BudgetHealthCard
            totalBudget={totals.totalBudget}
            totalActual={totals.totalActual}
          />
          <CostBenchmarkCard
            yourAvg={costPerSqft.avg}
            marketAvg={marketAvgPerSqft}
            projectCount={costPerSqft.count}
          />
        </div>

        {/* Category Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Category List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Top Categories by Spend</h4>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Budget</span>
                <span>Actual</span>
                <span className="w-32">Variance</span>
              </div>
            </div>

            <div className="space-y-4">
              {topCategories.map((cat) => (
                <CategoryRow
                  key={cat.category}
                  category={cat.category}
                  budget={cat.budget}
                  actual={cat.actual}
                  maxBudget={maxCategorySpend}
                />
              ))}
            </div>

            {sortedCategories.length > 6 && (
              <button className="text-sm text-primary hover:underline flex items-center gap-1">
                View all {sortedCategories.length} categories
                <IconChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Pie Chart */}
          <div>
            <h4 className="text-sm font-medium mb-3">Spend Distribution</h4>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div className="grid grid-cols-2 gap-1 mt-2">
              {pieData.slice(0, 6).map((item) => (
                <div key={item.name} className="flex items-center gap-1.5 text-xs">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="truncate text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Variance Summary */}
        <div className="pt-4 border-t">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-red-100 dark:bg-red-950/50 flex items-center justify-center">
                <IconTrendingUp className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Over Budget</p>
                <p className="font-medium">{varianceMetrics.overBudget.length} categories</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-red-100 dark:bg-red-950/50 flex items-center justify-center">
                <IconAlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Total Overage</p>
                <p className="font-medium text-red-600">{formatCurrency(varianceMetrics.totalOverage, true)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-green-100 dark:bg-green-950/50 flex items-center justify-center">
                <IconTrendingDown className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Under Budget</p>
                <p className="font-medium">{varianceMetrics.underBudget.length} categories</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-green-100 dark:bg-green-950/50 flex items-center justify-center">
                <IconCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Total Savings</p>
                <p className="font-medium text-green-600">{formatCurrency(varianceMetrics.totalSavings, true)}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
