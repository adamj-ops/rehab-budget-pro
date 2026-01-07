'use client';

import { PortfolioHealth, KanbanPipeline, type ProjectCardData } from '@/components/dashboard';
import { Card, CardContent } from '@/components/ui/card';
import { IconHome, IconPlus } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface DashboardClientProps {
  projects: ProjectCardData[];
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

export function DashboardClient({
  projects,
  totalARV,
  capitalDeployed,
  averageROI,
  projectCounts,
}: DashboardClientProps) {
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

      {/* Kanban Pipeline */}
      <KanbanPipeline projects={pipelineProjects} />
    </>
  );
}
