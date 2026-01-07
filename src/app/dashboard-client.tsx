'use client';

import { useState } from 'react';
import { PortfolioHealth, KanbanPipeline, ProjectTimeline, type ProjectCardData, type TimelineProject } from '@/components/dashboard';
import { Card, CardContent } from '@/components/ui/card';
import { IconHome, IconPlus, IconLayoutKanban, IconCalendarEvent } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface DashboardClientProps {
  projects: (ProjectCardData & TimelineProject)[];
  totalARV: number;
  capitalDeployed: number;
  averageROI: number;
  projectCounts: {
    total: number;
    analyzing: number;
    underContract: number;
    inRehab: number;
    listed: number;
    sold: number;
  };
}

type ViewMode = 'kanban' | 'timeline';

export function DashboardClient({
  projects,
  totalARV,
  capitalDeployed,
  averageROI,
  projectCounts,
}: DashboardClientProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');

  // Filter out sold/dead projects for the pipeline
  const pipelineProjects = projects.filter(
    (p) => p.status !== 'sold' && p.status !== 'dead'
  );

  if (projects.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-12 text-center">
          <IconHome className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No projects yet</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Create your first project to start tracking your rehab portfolio.
          </p>
          <Button asChild>
            <Link href="/projects/new">
              <IconPlus className="h-4 w-4" />
              Create Project
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Portfolio Health Metrics */}
      <PortfolioHealth
        totalARV={totalARV}
        capitalDeployed={capitalDeployed}
        averageROI={averageROI}
        projectCounts={projectCounts}
      />

      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
          <button
            onClick={() => setViewMode('kanban')}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              viewMode === 'kanban'
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <IconLayoutKanban className="h-4 w-4" />
            Pipeline
          </button>
          <button
            onClick={() => setViewMode('timeline')}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              viewMode === 'timeline'
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <IconCalendarEvent className="h-4 w-4" />
            Timeline
          </button>
        </div>
      </div>

      {/* View Content */}
      {viewMode === 'kanban' ? (
        <KanbanPipeline projects={pipelineProjects} />
      ) : (
        <ProjectTimeline projects={projects} />
      )}
    </>
  );
}
