'use client';

import { useKanbanColumns } from '@/hooks/use-dashboard';
import { KanbanColumn } from './kanban-column';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { PIPELINE_STAGES } from '@/types/dashboard';
import type { ProjectStatus } from '@/types';

/**
 * Kanban Board Component
 * Displays projects organized by status in a horizontal scrollable board
 */
export function KanbanBoard() {
  const { columns, isLoading, error } = useKanbanColumns();

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
        Failed to load projects. Please try again.
      </div>
    );
  }

  return (
    <section aria-labelledby="pipeline-title">
      <h2
        id="pipeline-title"
        className="mb-4 text-lg font-semibold text-muted-foreground"
      >
        Active Pipeline
      </h2>

      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4">
          {PIPELINE_STAGES.map((stage) => (
            <KanbanColumn
              key={stage.id}
              status={stage.id as ProjectStatus}
              projects={columns[stage.id as keyof typeof columns] || []}
              isLoading={isLoading}
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  );
}

/**
 * Skeleton loader for Kanban board
 */
export function KanbanBoardSkeleton() {
  return (
    <section>
      <div className="mb-4 h-6 w-32 animate-pulse rounded bg-muted" />
      <div className="flex gap-4 overflow-hidden">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-96 w-72 shrink-0 animate-pulse rounded-lg bg-muted/30"
          />
        ))}
      </div>
    </section>
  );
}
