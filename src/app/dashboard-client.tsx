'use client';

import { PortfolioHealth, AttentionNeeded, FinancialPerformance, BudgetInsights, type ProjectCardData, type TimelineProject, type AlertProject, type FinancialProject, type BudgetProject, type CategorySpend } from '@/components/dashboard';
import { Card, CardContent } from '@/components/ui/card';
import { IconHome, IconPlus } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { ErrorBoundary, CompactErrorFallback } from '@/components/error-boundary';
import Link from 'next/link';

interface DashboardClientProps {
  projects: (ProjectCardData & TimelineProject & AlertProject & FinancialProject & BudgetProject)[];
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
  categorySpends: CategorySpend[];
}

export function DashboardClient({
  projects,
  totalARV,
  capitalDeployed,
  averageROI,
  projectCounts,
  categorySpends,
}: DashboardClientProps) {
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
      <ErrorBoundary
        fallback={<CompactErrorFallback message="Failed to load portfolio health metrics" />}
      >
        <PortfolioHealth
          totalARV={totalARV}
          capitalDeployed={capitalDeployed}
          averageROI={averageROI}
          projectCounts={projectCounts}
        />
      </ErrorBoundary>

      {/* Attention Needed / Risk Alerts */}
      <ErrorBoundary
        fallback={<CompactErrorFallback message="Failed to load alerts" />}
      >
        <AttentionNeeded projects={projects} />
      </ErrorBoundary>

      {/* Financial Performance Analytics */}
      <ErrorBoundary
        fallback={<CompactErrorFallback message="Failed to load financial performance" />}
      >
        <FinancialPerformance projects={projects} />
      </ErrorBoundary>

      {/* Budget Insights */}
      <ErrorBoundary
        fallback={<CompactErrorFallback message="Failed to load budget insights" />}
      >
        <BudgetInsights projects={projects} categorySpends={categorySpends} />
      </ErrorBoundary>
    </>
  );
}
