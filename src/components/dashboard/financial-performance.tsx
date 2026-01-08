'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  IconCash,
  IconHome,
  IconPercentage,
  IconClock,
  IconTrendingUp,
  IconTrendingDown,
  IconChartBar,
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
import { differenceInDays, parseISO, isWithinInterval, startOfYear, subMonths, subYears } from 'date-fns';
import type { ProjectStatus } from '@/types';
import Link from 'next/link';

export interface FinancialProject {
  id: string;
  name: string;
  address?: string;
  city?: string;
  status: ProjectStatus;
  arv: number;
  purchase_price: number;
  rehab_budget: number;
  rehab_actual: number;
  roi: number;
  close_date?: string | null;
  sale_date?: string | null;
}

interface FinancialPerformanceProps {
  projects: FinancialProject[];
}

type TimePeriod = 'all' | 'ytd' | '12m' | '6m' | '3m';

const TIME_PERIOD_LABELS: Record<TimePeriod, string> = {
  all: 'All Time',
  ytd: 'Year to Date',
  '12m': 'Last 12 Months',
  '6m': 'Last 6 Months',
  '3m': 'Last 3 Months',
};

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

function getTimePeriodRange(period: TimePeriod): { start: Date; end: Date } | null {
  const now = new Date();
  const end = now;

  switch (period) {
    case 'ytd':
      return { start: startOfYear(now), end };
    case '12m':
      return { start: subYears(now, 1), end };
    case '6m':
      return { start: subMonths(now, 6), end };
    case '3m':
      return { start: subMonths(now, 3), end };
    case 'all':
    default:
      return null;
  }
}

function calculateHoldTime(closeDate: string | null | undefined, saleDate: string | null | undefined): number | null {
  if (!closeDate || !saleDate) return null;
  const days = differenceInDays(parseISO(saleDate), parseISO(closeDate));
  return Math.round(days / 30 * 10) / 10; // months with 1 decimal
}

// ROI Distribution buckets - Forest green palette
const ROI_BUCKETS = [
  { min: -Infinity, max: 0, label: '< 0%', color: '#ef4444' },   // Red for losses
  { min: 0, max: 10, label: '0-10%', color: '#f59e0b' },         // Amber
  { min: 10, max: 15, label: '10-15%', color: '#fbbf24' },       // Yellow
  { min: 15, max: 20, label: '15-20%', color: '#22c55e' },       // Green-500
  { min: 20, max: Infinity, label: '> 20%', color: '#008000' },  // Forest green
];

function MetricCard({
  label,
  value,
  subtext,
  icon: Icon,
  trend,
}: {
  label: string;
  value: string;
  subtext?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
}) {
  return (
    <div className="bg-muted/50 rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {subtext && (
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              {trend === 'up' && <IconTrendingUp className="h-3 w-3 text-green-500" />}
              {trend === 'down' && <IconTrendingDown className="h-3 w-3 text-red-500" />}
              {subtext}
            </p>
          )}
        </div>
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string }>; label?: string }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-popover border rounded-lg shadow-lg p-3">
      <p className="font-medium text-sm">{label}</p>
      {payload.map((entry, index) => (
        <p key={index} className="text-sm text-muted-foreground">
          {entry.name}: {typeof entry.value === 'number' ? formatCurrency(entry.value) : entry.value}
        </p>
      ))}
    </div>
  );
}

function ROITooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { label: string; count: number; projects: FinancialProject[] } }> }) {
  if (!active || !payload?.length) return null;

  const data = payload[0].payload;
  return (
    <div className="bg-popover border rounded-lg shadow-lg p-3 max-w-xs">
      <p className="font-medium text-sm">{data.label} ROI</p>
      <p className="text-sm text-muted-foreground">{data.count} project{data.count !== 1 ? 's' : ''}</p>
      {data.projects.length > 0 && (
        <div className="mt-2 pt-2 border-t">
          {data.projects.slice(0, 3).map((p) => (
            <p key={p.id} className="text-xs text-muted-foreground truncate">
              {p.name}: {p.roi.toFixed(1)}%
            </p>
          ))}
          {data.projects.length > 3 && (
            <p className="text-xs text-muted-foreground">+{data.projects.length - 3} more</p>
          )}
        </div>
      )}
    </div>
  );
}

export function FinancialPerformance({ projects }: FinancialPerformanceProps) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('all');

  // Filter projects by time period and status
  const filteredProjects = useMemo(() => {
    const soldProjects = projects.filter((p) => p.status === 'sold');
    const range = getTimePeriodRange(timePeriod);

    if (!range) return soldProjects;

    return soldProjects.filter((p) => {
      if (!p.sale_date) return false;
      const saleDate = parseISO(p.sale_date);
      return isWithinInterval(saleDate, range);
    });
  }, [projects, timePeriod]);

  // Calculate summary metrics
  const metrics = useMemo(() => {
    if (filteredProjects.length === 0) {
      return {
        grossProfit: 0,
        projectsSold: 0,
        avgROI: 0,
        avgHoldTime: 0,
        targetHitRate: 0,
      };
    }

    const grossProfit = filteredProjects.reduce((sum, p) => {
      const totalInvestment = p.purchase_price + p.rehab_actual;
      return sum + (p.arv - totalInvestment);
    }, 0);

    const avgROI = filteredProjects.reduce((sum, p) => sum + p.roi, 0) / filteredProjects.length;

    const holdTimes = filteredProjects
      .map((p) => calculateHoldTime(p.close_date, p.sale_date))
      .filter((t): t is number => t !== null);

    const avgHoldTime = holdTimes.length > 0
      ? holdTimes.reduce((sum, t) => sum + t, 0) / holdTimes.length
      : 0;

    const targetHitRate = (filteredProjects.filter((p) => p.roi >= 15).length / filteredProjects.length) * 100;

    return {
      grossProfit,
      projectsSold: filteredProjects.length,
      avgROI,
      avgHoldTime,
      targetHitRate,
    };
  }, [filteredProjects]);

  // ROI Distribution data
  const roiDistribution = useMemo(() => {
    return ROI_BUCKETS.map((bucket) => {
      const bucketProjects = filteredProjects.filter(
        (p) => p.roi >= bucket.min && p.roi < bucket.max
      );
      return {
        label: bucket.label,
        count: bucketProjects.length,
        color: bucket.color,
        projects: bucketProjects,
      };
    });
  }, [filteredProjects]);

  // Profit by project data (top 8)
  const profitByProject = useMemo(() => {
    return filteredProjects
      .map((p) => ({
        id: p.id,
        name: p.name.length > 15 ? p.name.slice(0, 15) + '...' : p.name,
        fullName: p.name,
        profit: p.arv - (p.purchase_price + p.rehab_actual),
        roi: p.roi,
      }))
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 8);
  }, [filteredProjects]);

  // Active projects metrics (for comparison)
  const activeProjects = projects.filter((p) => p.status !== 'sold' && p.status !== 'dead');
  const projectedProfit = activeProjects.reduce((sum, p) => {
    const totalInvestment = p.purchase_price + p.rehab_budget;
    return sum + (p.arv - totalInvestment);
  }, 0);

  if (projects.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <IconChartBar className="h-5 w-5" />
            Financial Performance
          </CardTitle>
          <Select value={timePeriod} onValueChange={(v) => setTimePeriod(v as TimePeriod)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TIME_PERIOD_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            label="Gross Profit"
            value={formatCurrency(metrics.grossProfit)}
            subtext={projectedProfit > 0 ? `${formatCurrency(projectedProfit, true)} projected` : undefined}
            icon={IconCash}
            trend={metrics.grossProfit > 0 ? 'up' : 'down'}
          />
          <MetricCard
            label="Projects Sold"
            value={metrics.projectsSold.toString()}
            subtext={`${activeProjects.length} active`}
            icon={IconHome}
          />
          <MetricCard
            label="Avg ROI"
            value={`${metrics.avgROI.toFixed(1)}%`}
            subtext={metrics.avgROI >= 15 ? '✓ Above 15% target' : 'Below 15% target'}
            icon={IconPercentage}
            trend={metrics.avgROI >= 15 ? 'up' : 'down'}
          />
          <MetricCard
            label="Avg Hold Time"
            value={`${metrics.avgHoldTime.toFixed(1)} mo`}
            subtext={metrics.targetHitRate > 0 ? `${metrics.targetHitRate.toFixed(0)}% hit target` : undefined}
            icon={IconClock}
          />
        </div>

        {filteredProjects.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <IconChartBar className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No sold projects in this time period</p>
            <p className="text-sm">Complete some deals to see your performance analytics</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ROI Distribution Chart */}
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                ROI Distribution
                <Badge variant="outline" className="text-xs">
                  Target: 15%+
                </Badge>
              </h4>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={roiDistribution} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis type="number" tickFormatter={(v) => v.toString()} />
                    <YAxis dataKey="label" type="category" width={60} tick={{ fontSize: 12 }} />
                    <Tooltip content={<ROITooltip />} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {roiDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-red-500" /> Below target
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-green-500" /> At/Above target
                </span>
              </div>
            </div>

            {/* Profit by Project Chart */}
            <div>
              <h4 className="text-sm font-medium mb-3">Profit by Project</h4>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={profitByProject} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis
                      type="number"
                      tickFormatter={(v) => formatCurrency(v, true)}
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={100}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const data = payload[0].payload as typeof profitByProject[0];
                        return (
                          <div className="bg-popover border rounded-lg shadow-lg p-3">
                            <p className="font-medium text-sm">{data.fullName}</p>
                            <p className="text-sm text-muted-foreground">
                              Profit: {formatCurrency(data.profit)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              ROI: {data.roi.toFixed(1)}%
                            </p>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="profit" radius={[0, 4, 4, 0]}>
                      {profitByProject.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.profit >= 0 ? '#008000' : '#ef4444'}
                          className="cursor-pointer hover:opacity-80"
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Performance Summary */}
        {filteredProjects.length > 0 && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-6">
                <div>
                  <span className="text-muted-foreground">Total Investment:</span>{' '}
                  <span className="font-medium">
                    {formatCurrency(
                      filteredProjects.reduce((sum, p) => sum + p.purchase_price + p.rehab_actual, 0)
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Returns:</span>{' '}
                  <span className="font-medium">
                    {formatCurrency(filteredProjects.reduce((sum, p) => sum + p.arv, 0))}
                  </span>
                </div>
              </div>
              <Badge
                variant={metrics.targetHitRate >= 50 ? 'default' : 'secondary'}
                className={metrics.targetHitRate >= 50 ? 'bg-green-500' : ''}
              >
                {metrics.targetHitRate.toFixed(0)}% hit 15% ROI target
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
