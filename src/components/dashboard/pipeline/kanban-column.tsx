'use client';

import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ProjectCard, ProjectCardSkeleton } from './project-card';
import type { ProjectSummary, ProjectStatus } from '@/types';
import { PIPELINE_STAGES } from '@/types/dashboard';

interface KanbanColumnProps {
  status: ProjectStatus;
  projects: ProjectSummary[];
  isLoading?: boolean;
  onDrop?: (projectId: string, newStatus: ProjectStatus) => void;
}

/**
 * Kanban column component
 * Displays projects in a specific status
 */
export function KanbanColumn({
  status,
  projects,
  isLoading,
}: KanbanColumnProps) {
  const stage = PIPELINE_STAGES.find((s) => s.id === status);
  const title = stage?.title || status;
  const color = stage?.color || 'bg-gray-500';

  return (
    <div className="flex h-full w-72 shrink-0 flex-col rounded-lg bg-muted/30">
      {/* Column header */}
      <div className="flex items-center gap-2 border-b p-3">
        <div className={cn('h-3 w-3 rounded-full', color)} />
        <h3 className="font-semibold">{title}</h3>
        <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
          {projects.length}
        </span>
      </div>

      {/* Cards container */}
      <ScrollArea className="flex-1 p-2">
        <div className="space-y-2 pb-2">
          {isLoading ? (
            // Loading skeletons
            <>
              <ProjectCardSkeleton />
              <ProjectCardSkeleton />
            </>
          ) : projects.length === 0 ? (
            // Empty state
            <div className="flex h-24 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
              No projects
            </div>
          ) : (
            // Project cards
            projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
