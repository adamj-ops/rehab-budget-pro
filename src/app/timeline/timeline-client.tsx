'use client';

import { ProjectTimeline, type ProjectCardData, type TimelineProject, type AlertProject, type FinancialProject, type BudgetProject } from '@/components/dashboard';
import { Card, CardContent } from '@/components/ui/card';
import { IconCalendarEvent, IconPlus } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ErrorBoundary, CompactErrorFallback } from '@/components/error-boundary';

interface TimelineClientProps {
  projects: (ProjectCardData & TimelineProject & AlertProject & FinancialProject & BudgetProject)[];
}

export function TimelineClient({ projects }: TimelineClientProps) {
  if (projects.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-12 text-center">
          <IconCalendarEvent className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No projects yet</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Add a project to see milestones on the timeline.
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
      fallback={<CompactErrorFallback message="Failed to load timeline view" />}
    >
      <ProjectTimeline projects={projects} />
    </ErrorBoundary>
  );
}
