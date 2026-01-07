'use client';

import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import {
  IconTrendingUp,
  IconTrendingDown,
  IconMinus,
  IconBuildingSkyscraper,
  IconCash,
  IconPercentage,
  IconHome,
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';

interface PortfolioHealthProps {
  totalARV: number;
  capitalDeployed: number;
  averageROI: number;
  targetROI?: number;
  projectCounts: {
    total: number;
    analyzing: number;
    underContract: number;
    inRehab: number;
    listed: number;
    sold: number;
  };
}

interface MetricCardProps {
  label: string;
  value: string;
  subtext?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon: React.ReactNode;
  highlight?: boolean;
}

function MetricCard({ label, value, subtext, trend, trendValue, icon, highlight }: MetricCardProps) {
  return (
    <Card className={cn('relative overflow-hidden', highlight && 'border-primary/50 bg-primary/5')}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              {label}
            </p>
            <p className="text-3xl font-bold mt-2 tabular-nums">{value}</p>
            {subtext && (
              <p className="text-sm text-muted-foreground mt-1">{subtext}</p>
            )}
            {trend && trendValue && (
              <div
                className={cn(
                  'flex items-center gap-1 mt-2 text-sm font-medium',
                  trend === 'up' && 'text-green-600',
                  trend === 'down' && 'text-red-600',
                  trend === 'neutral' && 'text-muted-foreground'
                )}
              >
                {trend === 'up' && <IconTrendingUp className="h-4 w-4" />}
                {trend === 'down' && <IconTrendingDown className="h-4 w-4" />}
                {trend === 'neutral' && <IconMinus className="h-4 w-4" />}
                {trendValue}
              </div>
            )}
          </div>
          <div className="p-3 rounded-lg bg-muted">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function PortfolioHealth({
  totalARV,
  capitalDeployed,
  averageROI,
  targetROI = 15,
  projectCounts,
}: PortfolioHealthProps) {
  const activeProjects = projectCounts.total - projectCounts.sold;
  const roiTrend = averageROI >= targetROI ? 'up' : averageROI >= targetROI * 0.8 ? 'neutral' : 'down';
  const roiTrendText = averageROI >= targetROI
    ? `Exceeding ${targetROI}% target`
    : `Target: ${targetROI}%`;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Portfolio Health</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total ARV"
          value={formatCurrency(totalARV)}
          subtext={`across ${projectCounts.total} projects`}
          icon={<IconBuildingSkyscraper className="h-6 w-6 text-muted-foreground" />}
        />

        <MetricCard
          label="Capital Deployed"
          value={formatCurrency(capitalDeployed)}
          subtext="total invested"
          icon={<IconCash className="h-6 w-6 text-muted-foreground" />}
        />

        <MetricCard
          label="Portfolio ROI"
          value={`${averageROI.toFixed(1)}%`}
          trend={roiTrend}
          trendValue={roiTrendText}
          icon={<IconPercentage className="h-6 w-6 text-muted-foreground" />}
          highlight={averageROI >= targetROI}
        />

        <MetricCard
          label="Active Projects"
          value={activeProjects.toString()}
          subtext={
            <span className="text-xs">
              {projectCounts.analyzing > 0 && `${projectCounts.analyzing} analyzing`}
              {projectCounts.analyzing > 0 && projectCounts.underContract > 0 && ' • '}
              {projectCounts.underContract > 0 && `${projectCounts.underContract} contracted`}
              {(projectCounts.analyzing > 0 || projectCounts.underContract > 0) && projectCounts.inRehab > 0 && ' • '}
              {projectCounts.inRehab > 0 && `${projectCounts.inRehab} in rehab`}
            </span>
          }
          icon={<IconHome className="h-6 w-6 text-muted-foreground" />}
        />
      </div>
    </section>
  );
}
