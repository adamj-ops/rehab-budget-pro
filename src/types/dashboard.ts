// ============================================================================
// DASHBOARD TYPES
// Types for portfolio dashboard analytics
// ============================================================================

import type { ProjectStatus, ProjectSummary, BudgetCategory } from './index';

// ============================================================================
// VIEW TYPES (from database views)
// ============================================================================

/**
 * Portfolio summary type (from portfolio_summary view)
 * Aggregated metrics across all user projects
 */
export interface PortfolioSummary {
  user_id: string | null;
  total_projects: number;
  active_projects: number;
  lead_count: number;
  analyzing_count: number;
  under_contract_count: number;
  in_rehab_count: number;
  listed_count: number;
  sold_count: number;
  total_arv: number;
  capital_deployed: number;
  total_profit: number;
  avg_roi: number;
  total_budget: number;
  total_actual: number;
  over_budget_count: number;
  behind_schedule_count: number;
}

/**
 * Category totals type (from category_totals view)
 * Budget breakdown by category across active projects
 */
export interface CategoryTotal {
  user_id: string | null;
  category: BudgetCategory;
  total_underwriting: number;
  total_forecast: number;
  total_actual: number;
  total_budget: number;
  variance: number;
  item_count: number;
}

/**
 * Project with risk indicators (from projects_with_risks view)
 * Extends ProjectSummary with computed risk flags
 */
export interface ProjectWithRisks extends ProjectSummary {
  is_over_budget: boolean;
  is_behind_schedule: boolean;
  is_low_roi: boolean;
  budget_variance: number;
  days_overdue: number;
  contingency_used_percent: number;
}

// ============================================================================
// UI STATE TYPES
// ============================================================================

/**
 * Kanban column structure for pipeline view
 */
export interface KanbanColumn {
  id: ProjectStatus;
  title: string;
  projects: ProjectSummary[];
}

/**
 * Pipeline stages configuration
 */
export const PIPELINE_STAGES: { id: ProjectStatus; title: string; color: string }[] = [
  { id: 'lead', title: 'Leads', color: 'bg-slate-500' },
  { id: 'analyzing', title: 'Analyzing', color: 'bg-blue-500' },
  { id: 'under_contract', title: 'Under Contract', color: 'bg-purple-500' },
  { id: 'in_rehab', title: 'In Rehab', color: 'bg-amber-500' },
  { id: 'listed', title: 'Listed', color: 'bg-emerald-500' },
];

/**
 * Timeline event for Gantt chart visualization
 */
export interface TimelineEvent {
  id: string;
  projectId: string;
  title: string;
  address: string | null;
  type: 'acquisition' | 'rehab' | 'sale';
  startDate: Date | null;
  endDate: Date | null;
  progress: number;
  status: ProjectStatus;
  isCompleted: boolean;
  dependencies: string[];
  financials: {
    arv: number;
    budget: number;
    actual: number;
    roi: number;
  };
}

/**
 * Dashboard filter state
 */
export interface DashboardFilters {
  dateRange: 'all' | 'ytd' | 'quarter' | 'month';
  statusFilter: ProjectStatus | 'all';
  minROI: number | null;
  maxROI: number | null;
  city: string | null;
  searchQuery: string;
}

/**
 * Dashboard view mode
 */
export type DashboardView = 'kanban' | 'gantt' | 'grid';

/**
 * Alert severity levels
 */
export type AlertSeverity = 'critical' | 'warning' | 'info';

/**
 * Risk alert item
 */
export interface RiskAlert {
  id: string;
  projectId: string;
  projectName: string;
  type: 'over_budget' | 'behind_schedule' | 'low_roi' | 'contingency_burned';
  severity: AlertSeverity;
  message: string;
  value: number;
  threshold?: number;
}

// ============================================================================
// CHART DATA TYPES
// ============================================================================

/**
 * ROI distribution data point
 */
export interface RoiDistributionItem {
  range: string;
  count: number;
  percentage: number;
  color: string;
}

/**
 * Profit by project data point
 */
export interface ProfitByProjectItem {
  id: string;
  name: string;
  profit: number;
  roi: number;
  status: ProjectStatus;
}

/**
 * Category budget data for charts
 */
export interface CategoryBudgetItem {
  category: BudgetCategory;
  label: string;
  budget: number;
  actual: number;
  variance: number;
  variancePercent: number;
}

// ============================================================================
// DEFAULT VALUES
// ============================================================================

export const DEFAULT_DASHBOARD_FILTERS: DashboardFilters = {
  dateRange: 'all',
  statusFilter: 'all',
  minROI: null,
  maxROI: null,
  city: null,
  searchQuery: '',
};

// ROI thresholds for color coding
export const ROI_THRESHOLDS = {
  excellent: 20,
  good: 15,
  fair: 10,
  poor: 5,
};

// Budget variance thresholds for alerts
export const VARIANCE_THRESHOLDS = {
  warning: 5, // 5% over budget
  critical: 10, // 10% over budget
};

// Contingency usage thresholds
export const CONTINGENCY_THRESHOLDS = {
  warning: 50, // 50% used
  critical: 75, // 75% used
};
