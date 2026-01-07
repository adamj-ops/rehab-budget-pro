'use client';

import { useState, useMemo, useRef } from 'react';
import { format, differenceInDays, addDays, startOfMonth, endOfMonth, eachMonthOfInterval, isWithinInterval, isBefore, isAfter } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn, formatCurrency } from '@/lib/utils';
import type { ProjectStatus } from '@/types';
import { PROJECT_STATUS_LABELS } from '@/types';
import {
  IconZoomIn,
  IconZoomOut,
  IconCalendarEvent,
  IconHome,
  IconArrowRight,
  IconCheck,
  IconClock,
} from '@tabler/icons-react';
import Link from 'next/link';

export interface TimelineProject {
  id: string;
  name: string;
  address?: string;
  city?: string;
  status: ProjectStatus;
  arv: number;
  close_date?: string | null;
  rehab_start_date?: string | null;
  target_complete_date?: string | null;
  list_date?: string | null;
  sale_date?: string | null;
  rehab_progress?: number;
}

interface ProjectTimelineProps {
  projects: TimelineProject[];
}

type ZoomLevel = 0.5 | 1 | 2;

const ZOOM_LABELS: Record<ZoomLevel, string> = {
  0.5: '6 months',
  1: '3 months',
  2: '6 weeks',
};

function getStatusColor(status: ProjectStatus): string {
  switch (status) {
    case 'analyzing':
    case 'lead':
      return 'bg-zinc-400';
    case 'under_contract':
      return 'bg-yellow-500';
    case 'in_rehab':
      return 'bg-blue-500';
    case 'listed':
      return 'bg-purple-500';
    case 'sold':
      return 'bg-green-500';
    case 'dead':
      return 'bg-red-500';
    default:
      return 'bg-zinc-400';
  }
}

function getProjectDates(project: TimelineProject) {
  const today = new Date();

  // Determine start date (close date or today for analyzing projects)
  let startDate: Date;
  if (project.close_date) {
    startDate = new Date(project.close_date);
  } else if (project.status === 'analyzing' || project.status === 'lead' || project.status === 'under_contract') {
    // For projects without close date, use today or a projected date
    startDate = today;
  } else {
    startDate = today;
  }

  // Determine end date based on status
  let endDate: Date;
  if (project.sale_date) {
    endDate = new Date(project.sale_date);
  } else if (project.list_date && (project.status === 'listed' || project.status === 'sold')) {
    // Add 30 days from list date as estimated sale
    endDate = addDays(new Date(project.list_date), 30);
  } else if (project.target_complete_date) {
    endDate = new Date(project.target_complete_date);
  } else {
    // Default to 90 days from start
    endDate = addDays(startDate, 90);
  }

  // Rehab period
  const rehabStart = project.rehab_start_date ? new Date(project.rehab_start_date) : project.close_date ? new Date(project.close_date) : null;
  const rehabEnd = project.target_complete_date ? new Date(project.target_complete_date) : null;

  return { startDate, endDate, rehabStart, rehabEnd };
}

export function ProjectTimeline({ projects }: ProjectTimelineProps) {
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>(1);
  const [filter, setFilter] = useState<'all' | 'active'>('active');
  const containerRef = useRef<HTMLDivElement>(null);

  const today = new Date();

  // Filter projects
  const filteredProjects = useMemo(() => {
    let filtered = projects;
    if (filter === 'active') {
      filtered = projects.filter((p) => p.status !== 'sold' && p.status !== 'dead');
    }
    // Sort by close date or created date
    return filtered.sort((a, b) => {
      const dateA = a.close_date ? new Date(a.close_date) : today;
      const dateB = b.close_date ? new Date(b.close_date) : today;
      return dateA.getTime() - dateB.getTime();
    });
  }, [projects, filter]);

  // Calculate timeline range based on zoom level
  const timelineRange = useMemo(() => {
    let monthsToShow: number;
    switch (zoomLevel) {
      case 0.5:
        monthsToShow = 6;
        break;
      case 1:
        monthsToShow = 3;
        break;
      case 2:
        monthsToShow = 2;
        break;
      default:
        monthsToShow = 3;
    }

    const start = startOfMonth(addDays(today, -30)); // Start 1 month ago
    const end = endOfMonth(addDays(today, monthsToShow * 30));

    return { start, end, monthsToShow };
  }, [zoomLevel]);

  // Generate month markers
  const months = useMemo(() => {
    return eachMonthOfInterval({
      start: timelineRange.start,
      end: timelineRange.end,
    });
  }, [timelineRange]);

  // Calculate total days in timeline
  const totalDays = differenceInDays(timelineRange.end, timelineRange.start);

  // Calculate position percentage for a date
  const getPositionPercent = (date: Date): number => {
    const days = differenceInDays(date, timelineRange.start);
    return Math.max(0, Math.min(100, (days / totalDays) * 100));
  };

  // Calculate width percentage for a duration
  const getWidthPercent = (start: Date, end: Date): number => {
    const startPos = getPositionPercent(start);
    const endPos = getPositionPercent(end);
    return Math.max(0, endPos - startPos);
  };

  const handleZoomIn = () => {
    if (zoomLevel < 2) {
      setZoomLevel((prev) => (prev === 0.5 ? 1 : 2) as ZoomLevel);
    }
  };

  const handleZoomOut = () => {
    if (zoomLevel > 0.5) {
      setZoomLevel((prev) => (prev === 2 ? 1 : 0.5) as ZoomLevel);
    }
  };

  if (filteredProjects.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconCalendarEvent className="h-5 w-5" />
            Project Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <IconClock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No projects with timeline data</p>
            <p className="text-sm">Add close dates and target completion dates to see the timeline</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <CardTitle className="flex items-center gap-2">
            <IconCalendarEvent className="h-5 w-5" />
            Project Timeline
          </CardTitle>

          <div className="flex items-center gap-2">
            {/* Filter */}
            <div className="flex items-center rounded-lg border">
              <button
                onClick={() => setFilter('active')}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium transition-colors rounded-l-lg',
                  filter === 'active' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                )}
              >
                Active
              </button>
              <button
                onClick={() => setFilter('all')}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium transition-colors rounded-r-lg',
                  filter === 'all' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                )}
              >
                All
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 border rounded-lg">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 0.5}
                className="h-8 w-8 p-0"
              >
                <IconZoomOut className="h-4 w-4" />
              </Button>
              <span className="px-2 text-sm text-muted-foreground min-w-[70px] text-center">
                {ZOOM_LABELS[zoomLevel]}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 2}
                className="h-8 w-8 p-0"
              >
                <IconZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto" ref={containerRef}>
          <div className="min-w-[800px]">
            {/* Month Headers */}
            <div className="flex border-b pb-2 mb-4">
              <div className="w-48 flex-shrink-0" /> {/* Project name column */}
              <div className="flex-1 relative">
                {months.map((month, index) => {
                  const left = getPositionPercent(month);
                  const nextMonth = months[index + 1];
                  const width = nextMonth
                    ? getPositionPercent(nextMonth) - left
                    : 100 - left;

                  return (
                    <div
                      key={month.toISOString()}
                      className="absolute text-sm font-medium text-muted-foreground"
                      style={{ left: `${left}%`, width: `${width}%` }}
                    >
                      {format(month, 'MMM yyyy')}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Project Rows */}
            <div className="space-y-3">
              {filteredProjects.map((project) => {
                const { startDate, endDate, rehabStart, rehabEnd } = getProjectDates(project);
                const barLeft = getPositionPercent(startDate);
                const barWidth = getWidthPercent(startDate, endDate);

                // Calculate rehab segment
                let rehabLeft = 0;
                let rehabWidth = 0;
                if (rehabStart && rehabEnd) {
                  rehabLeft = getPositionPercent(rehabStart);
                  rehabWidth = getWidthPercent(rehabStart, rehabEnd);
                }

                // Progress indicator for in-rehab projects
                const progressWidth = project.status === 'in_rehab' && project.rehab_progress
                  ? (project.rehab_progress / 100) * rehabWidth
                  : 0;

                return (
                  <div key={project.id} className="flex items-center group">
                    {/* Project Info */}
                    <div className="w-48 flex-shrink-0 pr-4">
                      <Link
                        href={`/projects/${project.id}`}
                        className="block hover:text-primary transition-colors"
                      >
                        <p className="font-medium text-sm truncate">{project.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {project.city || project.address || PROJECT_STATUS_LABELS[project.status]}
                        </p>
                      </Link>
                    </div>

                    {/* Timeline Bar */}
                    <div className="flex-1 relative h-8">
                      {/* Grid lines for months */}
                      {months.map((month) => (
                        <div
                          key={month.toISOString()}
                          className="absolute top-0 bottom-0 border-l border-dashed border-muted"
                          style={{ left: `${getPositionPercent(month)}%` }}
                        />
                      ))}

                      {/* Today marker */}
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20"
                        style={{ left: `${getPositionPercent(today)}%` }}
                      >
                        <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] text-red-500 font-medium whitespace-nowrap">
                          Today
                        </div>
                      </div>

                      {/* Project bar */}
                      {barWidth > 0 && (
                        <div
                          className={cn(
                            'absolute top-1 h-6 rounded-full transition-all',
                            getStatusColor(project.status),
                            'opacity-30 group-hover:opacity-50'
                          )}
                          style={{
                            left: `${barLeft}%`,
                            width: `${Math.max(barWidth, 2)}%`,
                          }}
                        />
                      )}

                      {/* Rehab segment (more prominent) */}
                      {rehabWidth > 0 && (
                        <div
                          className={cn(
                            'absolute top-1 h-6 rounded-full',
                            getStatusColor(project.status),
                            'group-hover:ring-2 group-hover:ring-offset-1 group-hover:ring-primary/30'
                          )}
                          style={{
                            left: `${rehabLeft}%`,
                            width: `${Math.max(rehabWidth, 2)}%`,
                          }}
                        >
                          {/* Progress fill for in-rehab projects */}
                          {progressWidth > 0 && (
                            <div
                              className="absolute inset-y-0 left-0 rounded-l-full bg-green-500/50"
                              style={{ width: `${(project.rehab_progress || 0)}%` }}
                            />
                          )}

                          {/* Label inside bar if wide enough */}
                          {rehabWidth > 8 && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-[10px] font-medium text-white truncate px-2">
                                {project.status === 'in_rehab' && project.rehab_progress
                                  ? `${project.rehab_progress}%`
                                  : PROJECT_STATUS_LABELS[project.status]}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Milestones */}
                      {project.close_date && (
                        <div
                          className="absolute top-1 w-3 h-6 flex items-center justify-center z-10"
                          style={{ left: `${getPositionPercent(new Date(project.close_date))}%` }}
                          title={`Close: ${format(new Date(project.close_date), 'MMM d, yyyy')}`}
                        >
                          <div className="w-2 h-2 rounded-full bg-yellow-500 ring-2 ring-background" />
                        </div>
                      )}

                      {project.target_complete_date && (
                        <div
                          className="absolute top-1 w-3 h-6 flex items-center justify-center z-10"
                          style={{ left: `${getPositionPercent(new Date(project.target_complete_date))}%` }}
                          title={`Target Complete: ${format(new Date(project.target_complete_date), 'MMM d, yyyy')}`}
                        >
                          <div className="w-2 h-2 rounded-full bg-blue-500 ring-2 ring-background" />
                        </div>
                      )}

                      {project.list_date && (
                        <div
                          className="absolute top-1 w-3 h-6 flex items-center justify-center z-10"
                          style={{ left: `${getPositionPercent(new Date(project.list_date))}%` }}
                          title={`Listed: ${format(new Date(project.list_date), 'MMM d, yyyy')}`}
                        >
                          <div className="w-2 h-2 rounded-full bg-purple-500 ring-2 ring-background" />
                        </div>
                      )}

                      {project.sale_date && (
                        <div
                          className="absolute top-1 w-3 h-6 flex items-center justify-center z-10"
                          style={{ left: `${getPositionPercent(new Date(project.sale_date))}%` }}
                          title={`Sold: ${format(new Date(project.sale_date), 'MMM d, yyyy')}`}
                        >
                          <IconCheck className="w-3 h-3 text-green-500" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-6 pt-4 border-t flex items-center gap-6 flex-wrap text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-0.5 h-4 bg-red-500" />
                <span>Today</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                <span>Close Date</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span>Target Complete</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                <span>List Date</span>
              </div>
              <div className="flex items-center gap-2">
                <IconCheck className="w-3 h-3 text-green-500" />
                <span>Sold</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
