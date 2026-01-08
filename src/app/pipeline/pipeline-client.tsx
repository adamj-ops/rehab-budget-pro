'use client';

import { KanbanPipeline, type ProjectCardData, type TimelineProject, type AlertProject, type FinancialProject, type BudgetProject } from '@/components/dashboard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { IconLayoutKanban, IconPlus } from '@tabler/icons-react';
import Link from 'next/link';
import { ErrorBoundary, CompactErrorFallback } from '@/components/error-boundary';

interface PipelineClientProps {
  projects: (ProjectCardData & TimelineProject & AlertProject & FinancialProject & BudgetProject)[];
}

export function PipelineClient({ projects }: PipelineClientProps) {
  const pipelineProjects = projects.filter(
    (p) => p.status !== 'sold' && p.status !== 'dead'
  );

  if (pipelineProjects.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-12 text-center">
          <IconLayoutKanban className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No active leads</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Create a project or add a lead to see it here.
          </p>
          <Button asChild>
            <Link href="/projects/new">
              <IconPlus className="h-4 w-4" />
              New Project
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <ErrorBoundary
      fallback={<CompactErrorFallback message="Failed to load pipeline view" />}
    >
      <KanbanPipeline projects={pipelineProjects} />
    </ErrorBoundary>
  );
}
