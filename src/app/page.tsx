import { IconChartBar } from '@tabler/icons-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { DashboardClient } from './dashboard-client';
import { getDashboardData } from '@/lib/dashboard-data';

export default async function HomePage() {
  const {
    projects,
    totalARV,
    capitalDeployed,
    averageROI,
    projectCounts,
    categorySpends,
  } = await getDashboardData();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="page-shell flex items-center justify-between py-6">
          <div className="page-header-title">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <IconChartBar className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-bold tracking-tight">Rehab Budget Pro</h1>
              <p className="text-xs text-muted-foreground">Fix &amp; Flip Portfolio Dashboard</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="page-shell py-8">
        <div className="page-stack">
          <DashboardClient
            projects={projects}
            totalARV={totalARV}
            capitalDeployed={capitalDeployed}
            averageROI={averageROI}
            projectCounts={projectCounts}
            categorySpends={categorySpends}
          />
        </div>
      </main>
    </div>
  );
}

