'use client';

import Link from 'next/link';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatCurrency, cn } from '@/lib/utils';
import type { ProjectStatus } from '@/types';
import { PROJECT_STATUS_LABELS } from '@/types';
import {
  IconGripVertical,
  IconMapPin,
  IconCalendar,
  IconEye,
  IconArrowRight,
} from '@tabler/icons-react';

export interface ProjectCardData {
  id: string;
  name: string;
  address?: string;
  city?: string;
  status: ProjectStatus;
  arv: number;
  purchase_price: number;
  mao?: number;
  roi?: number;
  rehab_budget?: number;
  rehab_actual?: number;
  close_date?: string;
  target_complete_date?: string;
  list_date?: string;
  rehab_progress?: number; // 0-100
  days_on_market?: number;
  showings?: number;
}

interface ProjectCardProps {
  project: ProjectCardData;
  isDragging?: boolean;
  showDragHandle?: boolean;
}

function getStatusBadgeVariant(status: ProjectStatus) {
  switch (status) {
    case 'in_rehab':
      return 'active';
    case 'under_contract':
      return 'pending';
    case 'sold':
      return 'success';
    case 'listed':
      return 'complete';
    case 'analyzing':
      return 'secondary';
    case 'lead':
      return 'outline';
    default:
      return 'secondary';
  }
}

function getROIColor(roi: number) {
  if (roi >= 20) return 'text-green-600';
  if (roi >= 15) return 'text-green-500';
  if (roi >= 10) return 'text-yellow-600';
  return 'text-red-600';
}

export function ProjectCard({ project, isDragging, showDragHandle = true }: ProjectCardProps) {
  const isAnalyzing = project.status === 'analyzing' || project.status === 'lead';
  const isContracted = project.status === 'under_contract';
  const isInRehab = project.status === 'in_rehab';
  const isListed = project.status === 'listed';

  return (
    <Card
      className={cn(
        'group relative transition-all hover:shadow-md',
        isDragging && 'shadow-lg ring-2 ring-primary/50 opacity-90'
      )}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start gap-2">
          {showDragHandle && (
            <div className="mt-1 cursor-grab text-muted-foreground hover:text-foreground">
              <IconGripVertical className="h-4 w-4" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium truncate">{project.name}</h3>
            {(project.address || project.city) && (
              <p className="text-sm text-muted-foreground flex items-center gap-1 truncate">
                <IconMapPin className="h-3 w-3 flex-shrink-0" />
                {project.city || project.address}
              </p>
            )}
          </div>
          <Badge variant={getStatusBadgeVariant(project.status)} className="flex-shrink-0">
            {PROJECT_STATUS_LABELS[project.status]}
          </Badge>
        </div>

        {/* Content varies by status */}
        <div className="mt-4 space-y-3">
          {/* Analyzing / Lead - Show decision metrics */}
          {isAnalyzing && (
            <>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">ARV</p>
                  <p className="font-semibold tabular-nums">{formatCurrency(project.arv)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">MAO</p>
                  <p className="font-semibold tabular-nums">
                    {project.mao ? formatCurrency(project.mao) : '—'}
                  </p>
                </div>
              </div>
              {project.roi !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Projected ROI</span>
                  <span className={cn('font-semibold', getROIColor(project.roi))}>
                    {project.roi.toFixed(1)}%
                  </span>
                </div>
              )}
            </>
          )}

          {/* Under Contract - Show close date */}
          {isContracted && (
            <>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">ARV</p>
                  <p className="font-semibold tabular-nums">{formatCurrency(project.arv)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Purchase</p>
                  <p className="font-semibold tabular-nums">{formatCurrency(project.purchase_price)}</p>
                </div>
              </div>
              {project.close_date && (
                <div className="flex items-center gap-2 text-sm">
                  <IconCalendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Close:</span>
                  <span className="font-medium">
                    {new Date(project.close_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              )}
              {project.roi !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">ROI</span>
                  <span className={cn('font-semibold', getROIColor(project.roi))}>
                    {project.roi.toFixed(1)}%
                  </span>
                </div>
              )}
            </>
          )}

          {/* In Rehab - Show progress */}
          {isInRehab && (
            <>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Progress</span>
                  <span className="text-sm font-medium">{project.rehab_progress || 0}%</span>
                </div>
                <Progress value={project.rehab_progress || 0} className="h-2" />
              </div>
              {project.rehab_budget !== undefined && project.rehab_actual !== undefined && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Budget</span>
                  <span
                    className={cn(
                      'font-medium',
                      project.rehab_actual > project.rehab_budget ? 'text-red-600' : 'text-green-600'
                    )}
                  >
                    {formatCurrency(project.rehab_actual)} / {formatCurrency(project.rehab_budget)}
                  </span>
                </div>
              )}
              {project.roi !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">ROI</span>
                  <span className={cn('font-semibold', getROIColor(project.roi))}>
                    {project.roi.toFixed(1)}%
                  </span>
                </div>
              )}
            </>
          )}

          {/* Listed - Show DOM and showings */}
          {isListed && (
            <>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">List Price</p>
                  <p className="font-semibold tabular-nums">{formatCurrency(project.arv)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">DOM</p>
                  <p className="font-semibold tabular-nums">{project.days_on_market || 0} days</p>
                </div>
              </div>
              {project.showings !== undefined && (
                <div className="flex items-center gap-2 text-sm">
                  <IconEye className="h-4 w-4 text-muted-foreground" />
                  <span>{project.showings} showings</span>
                </div>
              )}
              {project.roi !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Expected ROI</span>
                  <span className={cn('font-semibold', getROIColor(project.roi))}>
                    {project.roi.toFixed(1)}%
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer - View Link */}
        <div className="mt-4 pt-3 border-t flex items-center justify-end">
          <Link
            href={`/projects/${project.id}`}
            className="text-sm text-primary hover:underline flex items-center gap-1 group-hover:gap-2 transition-all"
          >
            View Details
            <IconArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

// Sortable version for Kanban
export function SortableProjectCard({ project }: { project: ProjectCardData }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1000 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ProjectCard project={project} isDragging={isDragging} />
    </div>
  );
}
