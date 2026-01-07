'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  IconAlertTriangle,
  IconClock,
  IconTrendingDown,
  IconCoin,
  IconChevronRight,
  IconCheck,
} from '@tabler/icons-react';
import Link from 'next/link';
import type { ProjectStatus } from '@/types';
import { formatDistanceToNow, isPast, parseISO } from 'date-fns';

export interface AlertProject {
  id: string;
  name: string;
  address?: string;
  city?: string;
  status: ProjectStatus;
  arv: number;
  roi: number;
  rehab_budget: number;
  rehab_actual: number;
  target_complete_date?: string | null;
  contingency_percent?: number;
}

interface AttentionNeededProps {
  projects: AlertProject[];
}

interface Alert {
  id: string;
  projectId: string;
  projectName: string;
  type: 'over_budget' | 'behind_schedule' | 'low_roi' | 'contingency_burned';
  severity: 'warning' | 'critical';
  message: string;
  detail: string;
  value?: string;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function getAlerts(projects: AlertProject[]): Alert[] {
  const alerts: Alert[] = [];

  for (const project of projects) {
    // Skip sold/dead projects
    if (project.status === 'sold' || project.status === 'dead') continue;

    // Over Budget: actual > budget
    if (project.rehab_budget > 0 && project.rehab_actual > project.rehab_budget) {
      const overage = project.rehab_actual - project.rehab_budget;
      const overagePercent = Math.round((overage / project.rehab_budget) * 100);
      alerts.push({
        id: `${project.id}-over-budget`,
        projectId: project.id,
        projectName: project.name,
        type: 'over_budget',
        severity: overagePercent > 15 ? 'critical' : 'warning',
        message: `${formatCurrency(overage)} over budget`,
        detail: `${overagePercent}% above forecast`,
        value: formatCurrency(overage),
      });
    }

    // Behind Schedule: target_complete_date < now AND in_rehab status
    if (
      project.status === 'in_rehab' &&
      project.target_complete_date &&
      isPast(parseISO(project.target_complete_date))
    ) {
      const daysOverdue = formatDistanceToNow(parseISO(project.target_complete_date), {
        addSuffix: false,
      });
      alerts.push({
        id: `${project.id}-behind-schedule`,
        projectId: project.id,
        projectName: project.name,
        type: 'behind_schedule',
        severity: 'warning',
        message: `${daysOverdue} overdue`,
        detail: `Target was ${parseISO(project.target_complete_date).toLocaleDateString()}`,
      });
    }

    // Low ROI: < 10%
    if (project.roi < 10 && project.roi > 0) {
      alerts.push({
        id: `${project.id}-low-roi`,
        projectId: project.id,
        projectName: project.name,
        type: 'low_roi',
        severity: project.roi < 5 ? 'critical' : 'warning',
        message: `${project.roi.toFixed(1)}% ROI`,
        detail: 'Below 10% target',
        value: `${project.roi.toFixed(1)}%`,
      });
    }

    // Contingency Burned: actual approaching budget (> 90%)
    if (project.rehab_budget > 0) {
      const usagePercent = (project.rehab_actual / project.rehab_budget) * 100;
      if (usagePercent >= 90 && usagePercent <= 100) {
        alerts.push({
          id: `${project.id}-contingency`,
          projectId: project.id,
          projectName: project.name,
          type: 'contingency_burned',
          severity: usagePercent >= 95 ? 'critical' : 'warning',
          message: `${Math.round(usagePercent)}% of budget used`,
          detail: `${formatCurrency(project.rehab_budget - project.rehab_actual)} remaining`,
        });
      }
    }
  }

  // Sort by severity (critical first), then by type
  return alerts.sort((a, b) => {
    if (a.severity !== b.severity) {
      return a.severity === 'critical' ? -1 : 1;
    }
    return a.type.localeCompare(b.type);
  });
}

const alertTypeConfig = {
  over_budget: {
    icon: IconAlertTriangle,
    label: 'Over Budget',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    borderColor: 'border-red-200 dark:border-red-900',
  },
  behind_schedule: {
    icon: IconClock,
    label: 'Behind Schedule',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    borderColor: 'border-amber-200 dark:border-amber-900',
  },
  low_roi: {
    icon: IconTrendingDown,
    label: 'Low ROI',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
    borderColor: 'border-orange-200 dark:border-orange-900',
  },
  contingency_burned: {
    icon: IconCoin,
    label: 'Budget Limit',
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/30',
    borderColor: 'border-yellow-200 dark:border-yellow-900',
  },
};

function AlertCard({ alert }: { alert: Alert }) {
  const config = alertTypeConfig[alert.type];
  const Icon = config.icon;

  return (
    <Link href={`/projects/${alert.projectId}`}>
      <div
        className={`flex items-start gap-3 p-3 rounded-lg border ${config.bgColor} ${config.borderColor} hover:shadow-sm transition-shadow cursor-pointer`}
      >
        <div className={`mt-0.5 ${config.color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{alert.projectName}</span>
            {alert.severity === 'critical' && (
              <Badge variant="destructive" className="text-xs px-1.5 py-0">
                Critical
              </Badge>
            )}
          </div>
          <p className={`text-sm font-semibold ${config.color}`}>{alert.message}</p>
          <p className="text-xs text-muted-foreground">{alert.detail}</p>
        </div>
        <IconChevronRight className="h-4 w-4 text-muted-foreground mt-1" />
      </div>
    </Link>
  );
}

export function AttentionNeeded({ projects }: AttentionNeededProps) {
  const alerts = getAlerts(projects);

  // Group alerts by type
  const alertsByType = alerts.reduce(
    (acc, alert) => {
      if (!acc[alert.type]) acc[alert.type] = [];
      acc[alert.type].push(alert);
      return acc;
    },
    {} as Record<string, Alert[]>
  );

  const alertTypes = Object.keys(alertsByType) as Array<keyof typeof alertTypeConfig>;

  // If no alerts, show success state
  if (alerts.length === 0) {
    return (
      <Card className="border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
              <IconCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="font-medium text-green-700 dark:text-green-300">All Clear</h3>
              <p className="text-sm text-green-600/80 dark:text-green-400/80">
                No projects need immediate attention
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <IconAlertTriangle className="h-5 w-5 text-amber-500" />
            Attention Needed
            <Badge variant="secondary" className="ml-1">
              {alerts.length}
            </Badge>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {alertTypes.map((type) => {
            const typeAlerts = alertsByType[type];
            const config = alertTypeConfig[type];
            const Icon = config.icon;

            return (
              <div key={type} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${config.color}`} />
                  <span className="text-sm font-medium">{config.label}</span>
                  <Badge variant="outline" className="text-xs">
                    {typeAlerts.length}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {typeAlerts.slice(0, 3).map((alert) => (
                    <AlertCard key={alert.id} alert={alert} />
                  ))}
                  {typeAlerts.length > 3 && (
                    <Button variant="ghost" size="sm" className="w-full text-xs" asChild>
                      <Link href="/projects">View {typeAlerts.length - 3} more</Link>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
