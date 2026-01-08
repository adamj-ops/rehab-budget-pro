import { createClient } from '@/lib/supabase/server';
import type { BudgetCategory, ProjectStatus } from '@/types';

export interface DashboardData {
  projects: Array<{
    id: string;
    name: string;
    address: string | null;
    city: string | null;
    status: ProjectStatus;
    arv: number;
    purchase_price: number;
    sqft?: number | null;
    mao: number;
    roi: number;
    rehab_budget: number;
    rehab_actual: number;
    close_date?: string | null;
    target_complete_date?: string | null;
    list_date?: string | null;
    sale_date?: string | null;
    rehab_progress: number;
  }>;
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
  categorySpends: {
    category: BudgetCategory;
    budget: number;
    actual: number;
    projectCount: number;
  }[];
}

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createClient();

  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching projects:', error);
  }

  const { data: budgetTotals } = await supabase
    .from('budget_items')
    .select('project_id, category, underwriting_amount, forecast_amount, actual_amount');

  const projectBudgets = new Map<string, { budget: number; actual: number }>();
  budgetTotals?.forEach((item) => {
    const existing = projectBudgets.get(item.project_id) || { budget: 0, actual: 0 };
    const budget = item.forecast_amount > 0 ? item.forecast_amount : item.underwriting_amount;
    projectBudgets.set(item.project_id, {
      budget: existing.budget + budget,
      actual: existing.actual + (item.actual_amount || 0),
    });
  });

  const categorySpendMap = new Map<BudgetCategory, { budget: number; actual: number; projects: Set<string> }>();
  budgetTotals?.forEach((item) => {
    const category = item.category as BudgetCategory;
    const existing = categorySpendMap.get(category) || { budget: 0, actual: 0, projects: new Set() };
    const budget = item.forecast_amount > 0 ? item.forecast_amount : item.underwriting_amount;
    existing.budget += budget;
    existing.actual += item.actual_amount || 0;
    existing.projects.add(item.project_id);
    categorySpendMap.set(category, existing);
  });

  const categorySpends = Array.from(categorySpendMap.entries()).map(([category, data]) => ({
    category,
    budget: data.budget,
    actual: data.actual,
    projectCount: data.projects.size,
  }));

  const dashboardProjects = (projects || []).map((project) => {
    const budgets = projectBudgets.get(project.id) || { budget: 0, actual: 0 };
    const totalInvestment = (project.purchase_price || 0) + budgets.budget;
    const grossProfit = (project.arv || 0) - totalInvestment;
    const roi = totalInvestment > 0 ? (grossProfit / totalInvestment) * 100 : 0;
    const mao = (project.arv || 0) * 0.7 - budgets.budget;

    return {
      id: project.id,
      name: project.name,
      address: project.address,
      city: project.city,
      status: project.status as ProjectStatus,
      arv: project.arv || 0,
      purchase_price: project.purchase_price || 0,
      sqft: project.sqft,
      mao,
      roi,
      rehab_budget: budgets.budget,
      rehab_actual: budgets.actual,
      close_date: project.close_date,
      target_complete_date: project.target_complete_date,
      list_date: project.list_date,
      sale_date: project.sale_date,
      rehab_progress:
        budgets.budget > 0 ? Math.min(100, Math.round((budgets.actual / budgets.budget) * 100)) : 0,
    };
  });

  const activeProjects = dashboardProjects.filter((p) => p.status !== 'sold' && p.status !== 'dead');
  const soldProjects = dashboardProjects.filter((p) => p.status === 'sold');

  const totalARV = activeProjects.reduce((sum, p) => sum + p.arv, 0);
  const capitalDeployed = activeProjects.reduce(
    (sum, p) => sum + p.purchase_price + (p.rehab_actual || 0),
    0
  );
  const averageROI =
    soldProjects.length > 0
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

  return {
    projects: dashboardProjects,
    totalARV,
    capitalDeployed,
    averageROI,
    projectCounts,
    categorySpends,
  };
}
