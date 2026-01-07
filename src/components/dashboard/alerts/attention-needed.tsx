'use client';

import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, formatCurrency } from '@/lib/utils';
import { useRiskyProjects } from '@/hooks/use-dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ProjectWithRisks } from '@/types/dashboard';
import {
  IconAlertTriangle,
  IconClock,
  IconTrendingDown,
  IconFlame,
  IconCheck,
  IconChevronRight,
} from '@tabler/icons-react';

/**
 * Attention Needed Section
 * Displays risk alerts for projects that need attention
 */
export function AttentionNeeded() {
  const { data: riskyProjects, isLoading, error } = useRiskyProjects();

  if (isLoading) {
    return <AttentionNeededSkeleton />;
  }

  if (error) {
    return null; // Silently fail - alerts are secondary
  }

  // Group projects by risk type
  const overBudget = riskyProjects?.filter((p) => p.is_over_budget) || [];
  const behindSchedule = riskyProjects?.filter((p) => p.is_behind_schedule) || [];
  const lowRoi = riskyProjects?.filter((p) => p.is_low_roi && !p.is_over_budget) || [];
  const highContingency = riskyProjects?.filter(
    (p) => p.contingency_used_percent > 50 && !p.is_over_budget
  ) || [];

  const hasAlerts =
    overBudget.length > 0 ||
    behindSchedule.length > 0 ||
    lowRoi.length > 0 ||
    highContingency.length > 0;

  return (
    <section aria-labelledby="alerts-title">
      <h2
        id="alerts-title"
        className="mb-4 text-lg font-semibold text-muted-foreground"
      >
        Attention Needed
      </h2>

      <AnimatePresence mode="wait">
        {!hasAlerts ? (
          <motion.div
            key="all-clear"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950">
              <CardContent className="flex items-center gap-3 py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900">
                  <IconCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="font-medium text-emerald-800 dark:text-emerald-200">
                    All clear!
                  </p>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400">
                    No projects need immediate attention.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="alerts"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid gap-4 sm:grid-cols-2"
          >
            {/* Over Budget */}
            {overBudget.length > 0 && (
              <AlertCategory
                icon={<IconAlertTriangle className="h-5 w-5" />}
                title="Over Budget"
                color="red"
                projects={overBudget}
                renderDetail={(p) => (
                  <span className="font-medium text-red-600 dark:text-red-400">
                    +{formatCurrency(p.budget_variance)}
                  </span>
                )}
              />
            )}

            {/* Behind Schedule */}
            {behindSchedule.length > 0 && (
              <AlertCategory
                icon={<IconClock className="h-5 w-5" />}
                title="Behind Schedule"
                color="amber"
                projects={behindSchedule}
                renderDetail={(p) => (
                  <span className="font-medium text-amber-600 dark:text-amber-400">
                    {p.days_overdue} days overdue
                  </span>
                )}
              />
            )}

            {/* Low ROI */}
            {lowRoi.length > 0 && (
              <AlertCategory
                icon={<IconTrendingDown className="h-5 w-5" />}
                title="Low ROI"
                color="amber"
                projects={lowRoi}
                renderDetail={(p) => {
                  const roi =
                    p.total_investment > 0
                      ? (p.gross_profit / p.total_investment) * 100
                      : 0;
                  return (
                    <span className="font-medium text-amber-600 dark:text-amber-400">
                      {roi.toFixed(1)}% ROI
                    </span>
                  );
                }}
              />
            )}

            {/* High Contingency Usage */}
            {highContingency.length > 0 && (
              <AlertCategory
                icon={<IconFlame className="h-5 w-5" />}
                title="Contingency Burned"
                color="amber"
                projects={highContingency}
                renderDetail={(p) => (
                  <span className="font-medium text-amber-600 dark:text-amber-400">
                    {p.contingency_used_percent.toFixed(0)}% used
                  </span>
                )}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

/**
 * Alert category card component
 */
function AlertCategory({
  icon,
  title,
  color,
  projects,
  renderDetail,
}: {
  icon: React.ReactNode;
  title: string;
  color: 'red' | 'amber';
  projects: ProjectWithRisks[];
  renderDetail: (project: ProjectWithRisks) => React.ReactNode;
}) {
  const colorClasses = {
    red: {
      bg: 'bg-red-50 dark:bg-red-950',
      border: 'border-red-200 dark:border-red-900',
      icon: 'text-red-600 dark:text-red-400',
      iconBg: 'bg-red-100 dark:bg-red-900',
    },
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-950',
      border: 'border-amber-200 dark:border-amber-900',
      icon: 'text-amber-600 dark:text-amber-400',
      iconBg: 'bg-amber-100 dark:bg-amber-900',
    },
  };

  const colors = colorClasses[color];

  return (
    <Card className={cn(colors.bg, colors.border)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <div
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full',
              colors.iconBg
            )}
          >
            <span className={colors.icon}>{icon}</span>
          </div>
          {title}
          <Badge variant="secondary" className="ml-auto">
            {projects.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="space-y-2">
          {projects.slice(0, 3).map((project) => (
            <li key={project.id}>
              <Link
                href={`/projects/${project.id}`}
                className="group flex items-center justify-between rounded-md p-2 hover:bg-white/50 dark:hover:bg-black/20"
              >
                <span className="truncate text-sm font-medium">
                  {project.name}
                </span>
                <span className="flex items-center gap-1 text-sm">
                  {renderDetail(project)}
                  <IconChevronRight
                    size={14}
                    className="opacity-0 transition-opacity group-hover:opacity-100"
                  />
                </span>
              </Link>
            </li>
          ))}
          {projects.length > 3 && (
            <li className="pt-1 text-center text-sm text-muted-foreground">
              +{projects.length - 3} more
            </li>
          )}
        </ul>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton loader for Attention Needed section
 */
export function AttentionNeededSkeleton() {
  return (
    <section>
      <div className="mb-4 h-6 w-36 animate-pulse rounded bg-muted" />
      <div className="h-24 animate-pulse rounded-lg bg-muted" />
    </section>
  );
}
