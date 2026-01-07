import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import type { ProjectStatus } from '@/types';
import { IconPlus, IconChartBar } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { DashboardClient } from './dashboard-client';

export default async function HomePage() {
  const supabase = await createClient();

  // Fetch projects with calculated fields
  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching projects:', error);
  }

  // Fetch budget totals per project
  const { data: budgetTotals } = await supabase
    .from('budget_items')
    .select('project_id, underwriting_amount, forecast_amount, actual_amount');

  // Calculate budget totals per project
  const projectBudgets = new Map<string, { budget: number; actual: number }>();
  budgetTotals?.forEach((item) => {
    const existing = projectBudgets.get(item.project_id) || { budget: 0, actual: 0 };
    const budget = item.forecast_amount > 0 ? item.forecast_amount : item.underwriting_amount;
    projectBudgets.set(item.project_id, {
      budget: existing.budget + budget,
      actual: existing.actual + (item.actual_amount || 0),
    });
  });

  // Transform projects for dashboard
  const dashboardProjects = (projects || []).map((project) => {
    const budgets = projectBudgets.get(project.id) || { budget: 0, actual: 0 };
    const totalInvestment = (project.purchase_price || 0) + budgets.budget;
    const grossProfit = (project.arv || 0) - totalInvestment;
    const roi = totalInvestment > 0 ? (grossProfit / totalInvestment) * 100 : 0;

    // Calculate MAO (70% rule)
    const mao = (project.arv || 0) * 0.7 - budgets.budget;

    return {
      id: project.id,
      name: project.name,
      address: project.address,
      city: project.city,
      status: project.status as ProjectStatus,
      arv: project.arv || 0,
      purchase_price: project.purchase_price || 0,
      mao: mao,
      roi: roi,
      rehab_budget: budgets.budget,
      rehab_actual: budgets.actual,
      close_date: project.close_date,
      target_complete_date: project.target_complete_date,
      list_date: project.list_date,
      sale_date: project.sale_date,
      rehab_progress: budgets.budget > 0 ? Math.min(100, Math.round((budgets.actual / budgets.budget) * 100)) : 0,
    };
  });

  // Calculate portfolio metrics
  const activeProjects = dashboardProjects.filter((p) => p.status !== 'sold' && p.status !== 'dead');
  const soldProjects = dashboardProjects.filter((p) => p.status === 'sold');

  const totalARV = activeProjects.reduce((sum, p) => sum + p.arv, 0);
  const capitalDeployed = activeProjects.reduce((sum, p) => sum + p.purchase_price + (p.rehab_actual || 0), 0);
  const averageROI = soldProjects.length > 0
    ? soldProjects.reduce((sum, p) => sum + p.roi, 0) / soldProjects.length
    : activeProjects.length > 0
      ? activeProjects.reduce((sum, p) => sum + p.roi, 0) / activeProjects.length
      : 0;

  const projectCounts = {
    total: dashboardProjects.length,
    analyzing: dashboardProjects.filter((p) => p.status === 'analyzing').length,
    underContract: dashboardProjects.filter((p) => p.status === 'under_contract').length,
    inRehab: dashboardProjects.filter((p) => p.status === 'in_rehab').length,
    listed: dashboardProjects.filter((p) => p.status === 'listed').length,
    sold: dashboardProjects.filter((p) => p.status === 'sold').length,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center">
              <IconChartBar className="h-6 w-6 text-accent-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Rehab Budget Pro</h1>
              <p className="text-sm text-muted-foreground">Fix & Flip Portfolio Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild>
              <Link href="/projects/new">
                <IconPlus className="h-4 w-4" />
                New Project
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        <DashboardClient
          projects={dashboardProjects}
          totalARV={totalARV}
          capitalDeployed={capitalDeployed}
          averageROI={averageROI}
          projectCounts={projectCounts}
        />
      </main>
    </div>
  );
}
