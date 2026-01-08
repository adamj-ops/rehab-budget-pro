'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn, formatCurrency } from '@/lib/utils';
import { useProjectsTimeline } from '@/hooks/use-dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  projectToTimelineEvents,
  getTimelineRange,
  getMonthLabels,
  calculateBarPosition,
  getEventColor,
} from '@/lib/timeline-utils';
import type { TimelineEvent } from '@/types/dashboard';
import {
  IconZoomIn,
  IconZoomOut,
  IconCalendar,
} from '@tabler/icons-react';

const ZOOM_LEVELS = [0.5, 0.75, 1, 1.5, 2];
const BASE_WIDTH = 1200;
const ROW_HEIGHT = 80;

/**
 * Project Timeline (Gantt Chart) Component
 */
export function ProjectTimeline() {
  const { data: projects, isLoading, error } = useProjectsTimeline();
  const [zoomIndex, setZoomIndex] = useState(2); // Default to 1x
  const containerRef = useRef<HTMLDivElement>(null);

  // Transform projects to timeline events
  const events = useMemo(() => {
    if (!projects) return [];
    return projects.flatMap(projectToTimelineEvents);
  }, [projects]);

  // Group events by project
  const projectGroups = useMemo(() => {
    const groups = new Map<string, TimelineEvent[]>();
    events.forEach((event) => {
      const existing = groups.get(event.projectId) || [];
      groups.set(event.projectId, [...existing, event]);
    });
    return Array.from(groups.entries());
  }, [events]);

  // Calculate timeline range
  const { minDate, maxDate } = useMemo(
    () => getTimelineRange(events),
    [events]
  );

  // Generate month labels
  const monthLabels = useMemo(
    () => getMonthLabels(minDate, maxDate),
    [minDate, maxDate]
  );

  // Calculate total width based on zoom
  const totalWidth = BASE_WIDTH * ZOOM_LEVELS[zoomIndex];

  // Handle zoom
  const handleZoomIn = () => {
    if (zoomIndex < ZOOM_LEVELS.length - 1) {
      setZoomIndex(zoomIndex + 1);
    }
  };

  const handleZoomOut = () => {
    if (zoomIndex > 0) {
      setZoomIndex(zoomIndex - 1);
    }
  };

  if (isLoading) {
    return <TimelineSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
        Failed to load timeline data.
      </div>
    );
  }

  if (projectGroups.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <IconCalendar className="h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-muted-foreground">
            No projects with timeline data yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate today marker position
  const today = new Date();
  const todayPosition = calculateBarPosition(
    today,
    today,
    minDate,
    maxDate,
    totalWidth
  );

  return (
    <section aria-labelledby="timeline-title">
      <div className="mb-4 flex items-center justify-between">
        <h2
          id="timeline-title"
          className="text-lg font-semibold text-muted-foreground"
        >
          Project Timeline
        </h2>

        {/* Zoom controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleZoomOut}
            disabled={zoomIndex === 0}
          >
            <IconZoomOut size={18} />
          </Button>
          <span className="min-w-[3rem] text-center text-sm">
            {ZOOM_LEVELS[zoomIndex]}x
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={handleZoomIn}
            disabled={zoomIndex === ZOOM_LEVELS.length - 1}
          >
            <IconZoomIn size={18} />
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0" ref={containerRef}>
          <ScrollArea className="w-full">
            <div style={{ width: totalWidth + 200 }}>
              {/* Header with month labels */}
              <div className="sticky top-0 z-10 flex border-b bg-card">
                {/* Project name column */}
                <div className="w-[200px] shrink-0 border-r p-3 font-medium">
                  Project
                </div>
                {/* Timeline header */}
                <div className="relative flex-1">
                  <div className="flex" style={{ width: totalWidth }}>
                    {monthLabels.map((month, i) => (
                      <div
                        key={i}
                        className="border-r px-2 py-3 text-xs text-muted-foreground"
                        style={{
                          width: totalWidth / monthLabels.length,
                        }}
                      >
                        {month.label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Timeline rows */}
              <div className="relative">
                {/* Today marker */}
                <div
                  className="absolute top-0 bottom-0 z-10 w-0.5 bg-red-500"
                  style={{ left: 200 + todayPosition.left }}
                >
                  <div className="absolute -top-1 -left-3 rounded bg-red-500 px-1 text-[10px] text-white">
                    Today
                  </div>
                </div>

                {projectGroups.map(([projectId, projectEvents], rowIndex) => {
                  const firstEvent = projectEvents[0];
                  return (
                    <div
                      key={projectId}
                      className={cn(
                        'flex border-b',
                        rowIndex % 2 === 0 ? 'bg-muted/20' : ''
                      )}
                      style={{ height: ROW_HEIGHT }}
                    >
                      {/* Project name */}
                      <Link
                        href={`/projects/${projectId}`}
                        className="flex w-[200px] shrink-0 items-center border-r p-3 hover:bg-muted/50"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {firstEvent.title}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {firstEvent.address || 'No address'}
                          </p>
                        </div>
                      </Link>

                      {/* Timeline bars */}
                      <div
                        className="relative flex-1"
                        style={{ width: totalWidth }}
                      >
                        {projectEvents.map((event) => {
                          const pos = calculateBarPosition(
                            event.startDate,
                            event.endDate,
                            minDate,
                            maxDate,
                            totalWidth
                          );

                          if (pos.width === 0) return null;

                          return (
                            <TimelineBar
                              key={event.id}
                              event={event}
                              left={pos.left}
                              width={pos.width}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex gap-6 border-t p-3">
                <div className="flex items-center gap-2 text-xs">
                  <div className="h-3 w-3 rounded bg-blue-500" />
                  <span>Acquisition</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="h-3 w-3 rounded bg-amber-500" />
                  <span>Rehab</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="h-3 w-3 rounded bg-purple-500" />
                  <span>Sale</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="h-3 w-3 rounded bg-green-600" />
                  <span>Completed</span>
                </div>
              </div>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardContent>
      </Card>
    </section>
  );
}

/**
 * Timeline bar component
 */
function TimelineBar({
  event,
  left,
  width,
}: {
  event: TimelineEvent;
  left: number;
  width: number;
}) {
  const color = getEventColor(event.type, event.isCompleted);

  return (
    <motion.div
      initial={{ opacity: 0, scaleX: 0 }}
      animate={{ opacity: 1, scaleX: 1 }}
      className={cn(
        'absolute top-1/2 -translate-y-1/2 h-6 rounded',
        color,
        'cursor-pointer hover:brightness-110 transition-all'
      )}
      style={{
        left,
        width,
        originX: 0,
      }}
      title={`${event.title} - ${event.type}`}
    >
      {/* Progress overlay for rehab */}
      {event.type === 'rehab' && !event.isCompleted && event.progress > 0 && (
        <div
          className="absolute inset-y-0 left-0 rounded-l bg-green-600"
          style={{ width: `${event.progress}%` }}
        />
      )}

      {/* Label (only if bar is wide enough) */}
      {width > 80 && (
        <span className="absolute inset-0 flex items-center px-2 text-xs font-medium text-white truncate">
          {event.type === 'rehab' && !event.isCompleted
            ? `${event.progress}%`
            : event.type.charAt(0).toUpperCase() + event.type.slice(1)}
        </span>
      )}
    </motion.div>
  );
}

/**
 * Skeleton loader for timeline
 */
function TimelineSkeleton() {
  return (
    <section>
      <div className="mb-4 h-6 w-36 animate-pulse rounded bg-muted" />
      <Card>
        <CardContent className="p-4">
          <div className="h-64 animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    </section>
  );
}
