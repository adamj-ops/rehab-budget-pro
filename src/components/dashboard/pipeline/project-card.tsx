'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn, formatCurrency } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { ProjectSummary, ProjectStatus } from '@/types';
import {
  IconMapPin,
  IconCalendar,
  IconPercentage,
  IconClock,
  IconAlertTriangle,
} from '@tabler/icons-react';

interface ProjectCardProps {
  project: ProjectSummary;
  isDragging?: boolean;
  className?: string;
}

/**
 * Project card for Kanban pipeline
 * Content varies based on project status
 */
export function ProjectCard({ project, isDragging, className }: ProjectCardProps) {
  // Calculate ROI for display
  const roi = useMemo(() => {
    if (!project.total_investment || project.total_investment === 0) return 0;
    return (project.gross_profit / project.total_investment) * 100;
  }, [project.gross_profit, project.total_investment]);

  // Calculate progress for in_rehab projects
  const progress = useMemo(() => {
    if (project.total_items === 0) return 0;
    return Math.round((project.completed_items / project.total_items) * 100);
  }, [project.completed_items, project.total_items]);

  // Determine if project has issues
  const hasIssues =
    (project.rehab_actual > project.rehab_budget && project.status === 'in_rehab') ||
    (project.target_complete_date &&
      new Date(project.target_complete_date) < new Date() &&
      project.status === 'in_rehab');

  // ROI color coding
  const roiColor =
    roi >= 20
      ? 'text-green-500'
      : roi >= 15
      ? 'text-green-500'
      : roi >= 10
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-red-600 dark:text-red-400';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Link href={`/projects/${project.id}`}>
        <Card
          className={cn(
            'cursor-pointer transition-shadow hover:shadow-md',
            isDragging && 'shadow-lg ring-2 ring-primary',
            hasIssues && 'border-amber-500/50',
            className
          )}
        >
          <CardContent className="p-4">
            {/* Header: Name and Location */}
            <div className="mb-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold leading-tight line-clamp-1">
                  {project.name}
                </h3>
                {hasIssues && (
                  <IconAlertTriangle
                    size={16}
                    className="shrink-0 text-amber-500"
                  />
                )}
              </div>
              {project.city && (
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <IconMapPin size={12} />
                  {project.city}
                  {project.state && `, ${project.state}`}
                </p>
              )}
            </div>

            {/* Status-specific content */}
            <ProjectCardContent
              project={project}
              roi={roi}
              roiColor={roiColor}
              progress={progress}
            />
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

/**
 * Status-specific card content
 */
function ProjectCardContent({
  project,
  roi,
  roiColor,
  progress,
}: {
  project: ProjectSummary;
  roi: number;
  roiColor: string;
  progress: number;
}) {
  switch (project.status) {
    case 'lead':
    case 'analyzing':
      return <AnalyzingContent project={project} roi={roi} roiColor={roiColor} />;
    case 'under_contract':
      return <ContractContent project={project} roi={roi} roiColor={roiColor} />;
    case 'in_rehab':
      return <RehabContent project={project} progress={progress} roi={roi} roiColor={roiColor} />;
    case 'listed':
      return <ListedContent project={project} roi={roi} roiColor={roiColor} />;
    case 'sold':
      return <SoldContent project={project} roi={roi} roiColor={roiColor} />;
    default:
      return null;
  }
}

// Content for Lead/Analyzing status
function AnalyzingContent({
  project,
  roi,
  roiColor,
}: {
  project: ProjectSummary;
  roi: number;
  roiColor: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">ARV</span>
        <span className="font-medium tabular-nums">
          {formatCurrency(project.arv || 0)}
        </span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">MAO</span>
        <span className="font-medium tabular-nums">
          {formatCurrency(project.mao || 0)}
        </span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Est. ROI</span>
        <span className={cn('font-semibold tabular-nums', roiColor)}>
          {roi.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

// Content for Under Contract status
function ContractContent({
  project,
  roi,
  roiColor,
}: {
  project: ProjectSummary;
  roi: number;
  roiColor: string;
}) {
  const closeDate = project.close_date
    ? new Date(project.close_date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : 'TBD';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1 text-muted-foreground">
          <IconCalendar size={14} />
          Close Date
        </span>
        <span className="font-medium">{closeDate}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">ARV</span>
        <span className="font-medium tabular-nums">
          {formatCurrency(project.arv || 0)}
        </span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Est. ROI</span>
        <span className={cn('font-semibold tabular-nums', roiColor)}>
          {roi.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

// Content for In Rehab status
function RehabContent({
  project,
  progress,
  roi,
  roiColor,
}: {
  project: ProjectSummary;
  progress: number;
  roi: number;
  roiColor: string;
}) {
  const isOverBudget = project.rehab_actual > project.rehab_budget;
  const targetDate = project.target_complete_date
    ? new Date(project.target_complete_date)
    : null;
  const isOverdue = targetDate && targetDate < new Date();

  return (
    <div className="space-y-3">
      {/* Progress bar */}
      <div>
        <div className="mb-1 flex justify-between text-xs">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium">{progress}%</span>
        </div>
        <Progress
          value={progress}
          className="h-2"
          indicatorClassName={
            progress === 100
              ? 'bg-green-600'
              : isOverdue
              ? 'bg-amber-500'
              : undefined
          }
        />
      </div>

      {/* Status badges */}
      <div className="flex flex-wrap gap-1">
        {progress === 100 && (
          <Badge variant="secondary" className="text-xs bg-green-700/20 text-green-500">
            Ready to list
          </Badge>
        )}
        {isOverdue && progress < 100 && (
          <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
            <IconClock size={12} className="mr-1" />
            Overdue
          </Badge>
        )}
        {isOverBudget && (
          <Badge variant="secondary" className="text-xs bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
            Over budget
          </Badge>
        )}
      </div>

      {/* ROI */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Est. ROI</span>
        <span className={cn('font-semibold tabular-nums', roiColor)}>
          {roi.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

// Content for Listed status
function ListedContent({
  project,
  roi,
  roiColor,
}: {
  project: ProjectSummary;
  roi: number;
  roiColor: string;
}) {
  const listDate = project.list_date ? new Date(project.list_date) : null;
  const daysOnMarket = listDate
    ? Math.floor((Date.now() - listDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">List Price</span>
        <span className="font-medium tabular-nums">
          {formatCurrency(project.arv || 0)}
        </span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Days on Market</span>
        <span className="font-medium">{daysOnMarket}</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Est. ROI</span>
        <span className={cn('font-semibold tabular-nums', roiColor)}>
          {roi.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

// Content for Sold status
function SoldContent({
  project,
  roi,
  roiColor,
}: {
  project: ProjectSummary;
  roi: number;
  roiColor: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Profit</span>
        <span className="font-medium tabular-nums text-green-500">
          {formatCurrency(project.gross_profit || 0)}
        </span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">ROI</span>
        <span className={cn('font-semibold tabular-nums', roiColor)}>
          {roi.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

/**
 * Skeleton loader for project card
 */
export function ProjectCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-3">
          <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
          <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-muted" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-full animate-pulse rounded bg-muted" />
          <div className="h-4 w-full animate-pulse rounded bg-muted" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
        </div>
      </CardContent>
    </Card>
  );
}
